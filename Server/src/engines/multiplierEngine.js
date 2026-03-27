// Multiplier assembly: base 1×, jokers, relics, enhancements, bosses, permanent multipliers.

const { countFaceCards, countRank, suitsSet } = require("./cardEngine");

function buildHandMultiplier({ hand, runState, context }) {
  // runState: { permanentMultiplier, fragileStacks, jokers, relics, enhancements }
  // context: { boss, isFirstHandOfRound, isFirstBlackjackOfRound, allHands, isFinalHandBossOrJoker }
  let mult = 1 + (runState.permanentMultiplier || 0);

  const total = hand.total;
  const cards = hand.cards;
  const faces = countFaceCards(cards);
  const sevens = countRank(cards, "7");
  const kings = countRank(cards, "K");
  const suits = suitsSet(cards);

  const jokerKeys = (runState.jokers || []).map((j) => j.key);
  const relicKeys = (runState.relics || []).map((r) => r.key);
  const enhancementKeys = (hand.enhancements || []).map((e) => e.key);

  // COMMON JOKERS
  if (jokerKeys.includes("high_card") && total >= 19) {
    mult += 1;
  }
  if (jokerKeys.includes("odd_luck") && total % 2 === 1) {
    mult += 1;
  }
  if (jokerKeys.includes("double_down") && context.isFirstHandOfRound) {
    mult += 1;
  }
  if (jokerKeys.includes("late_stay") && hand.metadata.stayedAt20Or21) {
    mult += 1;
  }

  // UNCOMMON JOKERS
  if (jokerKeys.includes("suit_tyrant")) {
    if (suits.size === 1) {
      mult += 3;
    } else {
      mult -= 1;
    }
  }
  if (jokerKeys.includes("face_parade") && faces > 0) {
    mult += 0.5 * faces;
  }
  if (jokerKeys.includes("pressure_cooker") && runState.fragileStacks > 0) {
    mult += 0.5 * runState.fragileStacks;
  }

  // RARE JOKERS
  if (jokerKeys.includes("lucky_sevens") && sevens > 0) {
    mult += 2 * sevens;
  }
  if (jokerKeys.includes("crown_of_kings") && kings > 0) {
    mult += 1.5 * kings;
  }
  if (jokerKeys.includes("suit_alchemy") && suits.size > 0) {
    mult += suits.size;
  }

  // LEGENDARY JOKERS
  if (
    jokerKeys.includes("final_hand_joker") &&
    context.isFinalHandBossOrJoker
  ) {
    mult *= 3;
  }

  // ENHANCEMENTS
  if (enhancementKeys.includes("face_crown") && faces > 0) {
    mult += faces;
  }
  if (enhancementKeys.includes("blackjack_booster") && hand.isBlackjack) {
    mult += 2;
  }
  if (enhancementKeys.includes("cursed_edge")) {
    mult += 3;
  }

  // BOSSES
  if (context.boss && context.boss.key === "boss_void") {
    // handled at base points level, not multiplier
  }

  return mult;
}

function applyPostHandPermanentMultipliers({ hand, runState, context }) {
  const jokerKeys = (runState.jokers || []).map((j) => j.key);

  if (hand.isBlackjack && jokerKeys.includes("blackjack_engine")) {
    runState.permanentMultiplier += 1;
  }

  if (hand.total === 21 && jokerKeys.includes("endless_twenty_one")) {
    runState.permanentMultiplier += 1;
  }

  if (context.devilsBargainTriggered) {
    runState.permanentMultiplier += 2;
  }

  return runState;
}

module.exports = {
  buildHandMultiplier,
  applyPostHandPermanentMultipliers,
};
