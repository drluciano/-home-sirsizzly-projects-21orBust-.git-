const knex = require("../data/db/knex");

// ----------------- helpers -----------------
function computeHandTotal(cards) {
  let total = 0;
  let aces = 0;

  for (const c of cards) {
    total += c.value;
    if (c.rank === "A") aces += 1;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

async function drawCards(trx, runId, count) {
  const run = await trx("runs").where({ id: runId }).forUpdate().first();
  if (!run) throw new Error("Run not found");

  const cards = await trx("deck_cards")
    .where({ run_id: runId })
    .andWhere("position", ">=", run.next_position)
    .orderBy("position", "asc")
    .limit(count);

  if (cards.length < count) {
    throw new Error("Deck exhausted");
  }

  await trx("runs")
    .where({ id: runId })
    .update({ next_position: run.next_position + cards.length });

  return cards;
}

async function getLatestRoundState(trx, runId) {
  return trx("round_states")
    .where({ run_id: runId })
    .orderBy("round_number", "desc")
    .first();
}

async function getRoundWithHandsByStateId(roundStateId) {
  const roundState = await knex("round_states")
    .where({ id: roundStateId })
    .first();

  if (!roundState) return null;

  const hands = await knex("round_hands")
    .where({ round_state_id: roundState.id })
    .orderBy("hand_index", "asc");

  return { roundState, hands };
}

// ----------------- start round -----------------
async function startRound(runId) {
  return knex.transaction(async (trx) => {
    const lastRound = await getLatestRoundState(trx, runId);
    const nextRoundNumber = lastRound ? lastRound.round_number + 1 : 1;

    const [roundState] = await trx("round_states")
      .insert({
        run_id: runId,
        round_number: nextRoundNumber,
        created_at: trx.fn.now(),
      })
      .returning("*");

    const cards = await drawCards(trx, runId, 2);
    const total = computeHandTotal(cards);

    await trx("round_hands").insert({
      round_state_id: roundState.id,
      hand_index: 0,
      cards: JSON.stringify(cards),
      total,
      is_active: true,
      is_finished: total >= 21,
    });

    const hands = await trx("round_hands")
      .where({ round_state_id: roundState.id })
      .orderBy("hand_index", "asc");

    return { roundState, hands };
  });
}

// ----------------- get current round -----------------
async function getCurrentRound(runId) {
  const roundState = await knex("round_states")
    .where({ run_id: runId })
    .orderBy("round_number", "desc")
    .first();

  if (!roundState) return null;

  const hands = await knex("round_hands")
    .where({ round_state_id: roundState.id })
    .orderBy("hand_index", "asc");

  return { roundState, hands };
}

// ----------------- hit -----------------
async function hit(runId, roundStateId, handIndex) {
  return knex.transaction(async (trx) => {
    const hand = await trx("round_hands")
      .where({ round_state_id: roundStateId, hand_index: handIndex })
      .first();

    if (!hand) throw new Error("Hand not found");
    if (hand.is_finished) throw new Error("Hand already finished");

    const cards = JSON.parse(hand.cards);
    const [newCard] = await drawCards(trx, runId, 1);
    cards.push(newCard);

    const total = computeHandTotal(cards);
    const isBust = total > 21;
    const isDone = isBust || total === 21;

    await trx("round_hands")
      .where({ id: hand.id })
      .update({
        cards: JSON.stringify(cards),
        total,
        is_active: !isDone,
        is_finished: isDone,
      });

    if (isDone) {
      const nextHand = await trx("round_hands")
        .where({ round_state_id: roundStateId, is_finished: false })
        .andWhere("id", "!=", hand.id)
        .orderBy("hand_index", "asc")
        .first();

      if (nextHand) {
        await trx("round_hands")
          .where({ id: nextHand.id })
          .update({ is_active: true });
      }
    }

    const hands = await trx("round_hands")
      .where({ round_state_id: roundStateId })
      .orderBy("hand_index", "asc");

    return { hands };
  });
}

// ----------------- stay -----------------
async function stay(roundStateId, handIndex) {
  return knex.transaction(async (trx) => {
    const hand = await trx("round_hands")
      .where({ round_state_id: roundStateId, hand_index: handIndex })
      .first();

    if (!hand) throw new Error("Hand not found");
    if (hand.is_finished) throw new Error("Hand already finished");

    await trx("round_hands")
      .where({ id: hand.id })
      .update({ is_active: false, is_finished: true });

    const nextHand = await trx("round_hands")
      .where({ round_state_id: roundStateId, is_finished: false })
      .orderBy("hand_index", "asc")
      .first();

    if (nextHand) {
      await trx("round_hands")
        .where({ id: nextHand.id })
        .update({ is_active: true });
    }

    const hands = await trx("round_hands")
      .where({ round_state_id: roundStateId })
      .orderBy("hand_index", "asc");

    return { hands };
  });
}

// ----------------- split -----------------
async function split(runId, roundStateId, handIndex) {
  return knex.transaction(async (trx) => {
    const hand = await trx("round_hands")
      .where({ round_state_id: roundStateId, hand_index: handIndex })
      .first();

    if (!hand) throw new Error("Hand not found");
    if (hand.is_finished) throw new Error("Hand already finished");

    const cards = JSON.parse(hand.cards);
    if (cards.length !== 2)
      throw new Error("Can only split with exactly two cards");
    if (cards[0].value !== cards[1].value)
      throw new Error("Can only split equal-value cards");

    const firstCard = cards[0];
    const secondCard = cards[1];

    const newCards = await drawCards(trx, runId, 2);
    const firstHandCards = [firstCard, newCards[0]];
    const secondHandCards = [secondCard, newCards[1]];

    const firstTotal = computeHandTotal(firstHandCards);
    const secondTotal = computeHandTotal(secondHandCards);

    await trx("round_hands")
      .where({ id: hand.id })
      .update({
        cards: JSON.stringify(firstHandCards),
        total: firstTotal,
        is_active: true,
        is_finished: firstTotal >= 21,
      });

    const maxIndexRow = await trx("round_hands")
      .where({ round_state_id: roundStateId })
      .max("hand_index as max_index")
      .first();

    const newIndex = (maxIndexRow.max_index ?? 0) + 1;

    await trx("round_hands").insert({
      round_state_id: roundStateId,
      hand_index: newIndex,
      cards: JSON.stringify(secondHandCards),
      total: secondTotal,
      is_active: false,
      is_finished: secondTotal >= 21,
    });

    const hands = await trx("round_hands")
      .where({ round_state_id: roundStateId })
      .orderBy("hand_index", "asc");

    return { hands };
  });
}

module.exports = {
  startRound,
  getCurrentRound,
  hit,
  stay,
  split,
};
