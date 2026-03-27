// Core blackjack flow for a blind: hands, actions, scoring, fragile, jokers, relics, bosses.

const {
  createEmptyHand,
  applyHit,
  applyStay,
  applySplit,
  applyDoubleDown,
  checkBlackjackAutoResolve,
  updateHandTotal,
} = require("./handEngine");
const { scoreHand, applyFinalHandRestriction } = require("./scoringEngine");
const { applyBustFragileGain } = require("./fragileEngine");
const { applyPostHandPermanentMultipliers } = require("./multiplierEngine");
const bonusEngine = require("./bonusEngine");

// runState shape (minimum):
// {
//   gold,
//   fragileStacks,
//   permanentMultiplier,
//   jokers: [{ key, rarity }],
//   relics: [{ key }],
//   anteIndex,
//   deck,            // array of card objects in dealing order
//   deckPosition,    // current index into deck
// }
//
// blindConfig:
// {
//   targetScore,
//   maxHands,
//   boss: { key, ... } | null
// }

function drawCard(runState) {
  const card = runState.deck[runState.deckPosition];
  runState.deckPosition += 1;
  return card;
}

function dealInitialHand(runState, context) {
  const hand = createEmptyHand();
  hand.cards.push(drawCard(runState));
  hand.cards.push(drawCard(runState));
  updateHandTotal(hand);
  checkBlackjackAutoResolve(hand);

  // Ace Up, Phantom Ink, Rank Ascension, Suit Changer, etc. are applied via enhancements/bonuses
  bonusEngine.applyCardLevelEffectsOnDeal(hand, runState, context);

  return hand;
}

function maxHandsFromJokers(runState) {
  const jokerKeys = (runState.jokers || []).map((j) => j.key);
  return jokerKeys.includes("split_joker") ? 5 : 3;
}

function isFirstHandOfRound(handIndex) {
  return handIndex === 0;
}

function resolveHandScoring(hand, runState, blindContext) {
  const context = {
    boss: blindContext.boss,
    isFirstHandOfRound: blindContext.isFirstHandOfRound,
    isFirstBlackjackOfRound: blindContext.isFirstBlackjackOfRound,
    allHands: blindContext.allHands,
    isFinalHandBossOrJoker: blindContext.isFinalHandBossOrJoker,
  };

  // Score pipeline
  let result = scoreHand({ hand, runState, context });
  hand = result.hand;
  runState = result.runState;

  // Boss Overload: every scoring hand adds +1 Fragile
  if (
    blindContext.boss &&
    blindContext.boss.key === "boss_overload" &&
    hand.scoreFinal > 0
  ) {
    runState.fragileStacks += 1;
  }

  // Post-hand bonuses (gold, permanent multipliers, etc.)
  runState = bonusEngine.applyPostHandBonuses(hand, runState, blindContext);

  // Permanent multipliers from jokers
  runState = applyPostHandPermanentMultipliers({ hand, runState, context });

  return { hand, runState };
}

function playSingleHand(runState, blindState, handIndex, inputProvider) {
  // blindState: { boss, hands, handsRemaining, targetScore, accumulatedScore }
  // inputProvider: function({ hand, runState, blindState }) => "hit" | "stay" | "split" | "double"
  let hand = dealInitialHand(runState, { boss: blindState.boss });

  const isFirstHand = isFirstHandOfRound(handIndex);
  const jokerKeys = (runState.jokers || []).map((j) => j.key);

  // Dealer’s Smile: first Blackjack each round +1× (handled in multiplier/bonus)
  if (hand.isBlackjack && isFirstHand) {
    blindState.firstBlackjackResolved = true;
  }

  while (!hand.isResolved) {
    if (hand.total === 21) {
      checkBlackjackAutoResolve(hand);
      if (hand.isResolved) break;
    }

    const action = inputProvider({ hand, runState, blindState });

    if (action === "hit") {
      const card = drawCard(runState);
      const res = applyHit(hand, card, {
        boss: blindState.boss,
        gold: runState.gold,
      });
      hand = res.hand;
      runState.gold = res.context.gold;
    } else if (action === "stay") {
      hand.metadata.stayedAt20Or21 = hand.total === 20 || hand.total === 21;
      hand = applyStay(hand);
    } else if (action === "split") {
      const splitRes = applySplit(hand, drawCard, {
        maxHands: blindState.maxHands,
        currentHandsCount: blindState.hands.length,
        boss: blindState.boss,
        echoSplitActive: jokerKeys.includes("echo_split"),
      });
      const newHands = splitRes.hands;
      // Replace current hand with first, push second to queue
      blindState.hands.splice(handIndex, 1, newHands[0]);
      blindState.hands.splice(handIndex + 1, 0, newHands[1]);
      return { runState, blindState, handResolved: false }; // re-enter loop with updated hands
    } else if (action === "double") {
      const card = drawCard(runState);
      const res = applyDoubleDown(hand, card, { boss: blindState.boss });
      hand = res.hand;
    } else {
      // Unknown action: treat as stay
      hand = applyStay(hand);
    }
  }

  // Bust handling: Fragile gain, Devil’s Bargain, Golden Devil, etc.
  if (hand.isBusted) {
    runState = bonusEngine.applyBustBonuses(hand, runState, blindState);

    runState = applyBustFragileGain(runState, {
      boss: blindState.boss,
      cursedEdgeActive: bonusEngine.isCursedEdgeActive(hand, runState),
      goldenDevilActive: bonusEngine.isGoldenDevilActive(runState),
      debtSpiralActive: bonusEngine.isDebtSpiralActive(runState),
      bloodContractActive: bonusEngine.isBloodContractActive(runState),
    });
  }

  blindState.hands[handIndex] = hand;
  return { runState, blindState, handResolved: true };
}

function playBlind(runState, blindConfig, inputProvider) {
  const maxHands = blindConfig.maxHands || maxHandsFromJokers(runState);
  const blindState = {
    boss: blindConfig.boss || null,
    targetScore: blindConfig.targetScore,
    accumulatedScore: 0,
    handsRemaining: maxHands,
    hands: [],
    maxHands,
    firstBlackjackResolved: false,
  };

  bonusEngine.applyBossStartEffects(runState, blindState);

  let handIndex = 0;

  while (
    blindState.handsRemaining > 0 &&
    blindState.accumulatedScore < blindState.targetScore
  ) {
    blindState.handsRemaining -= 1;

    // Ensure hand slot exists
    blindState.hands[handIndex] = createEmptyHand();

    const res = playSingleHand(runState, blindState, handIndex, inputProvider);
    runState = res.runState;
    blindState.hands = blindState.hands;

    // If split happened, we re-loop without scoring yet
    if (!res.handResolved) {
      continue;
    }

    // After all hands for this blind are known, we can compute Perfect Storm / Final Hand
    const allHandsSnapshot = blindState.hands.filter(
      (h) => h.cards && h.cards.length > 0,
    );
    const isFinalHandBossOrJoker =
      (blindState.boss && blindState.boss.key === "boss_final_hand") ||
      bonusEngine.hasFinalHandJoker(runState);

    const scoringContext = {
      boss: blindState.boss,
      isFirstHandOfRound: handIndex === 0,
      isFirstBlackjackOfRound: blindState.firstBlackjackResolved,
      allHands: allHandsSnapshot,
      isFinalHandBossOrJoker,
    };

    let { hand } = res.blindState
      ? res.blindState.hands[handIndex]
      : blindState.hands[handIndex];
    ({ hand, runState } = scoreHand({
      hand,
      runState,
      context: scoringContext,
    }));

    blindState.hands[handIndex] = hand;

    // After scoring, apply Final Hand restriction if needed
    const restrictedHands = applyFinalHandRestriction(
      blindState.hands,
      runState,
      scoringContext,
    );
    blindState.hands = restrictedHands;

    // Add this hand’s final score to blind total
    blindState.accumulatedScore += hand.scoreFinal;

    // Post-hand boss effects (Overload already handled in scoring)
    bonusEngine.applyPostHandBossEffects(hand, runState, blindState);

    // Check blind clear
    if (blindState.accumulatedScore >= blindState.targetScore) {
      break;
    }

    handIndex += 1;
  }

  const cleared = blindState.accumulatedScore >= blindState.targetScore;

  return {
    runState,
    blindState,
    cleared,
  };
}

module.exports = {
  playBlind,
};
