// blindEngine.js
// Authoritative blind lifecycle for 21orBust.
// Manages hands, accumulated score, early clear, and Final Hand logic.

const { createHand, checkAutoBlackjack } = require("./handEngine");
const { calculateHandTotal } = require("./cardEngine");
const { scoreHand } = require("./scoringEngine");
const {
  applyFragileOnBust,
  applyFragileOnScore,
  applyFragileReduction,
} = require("./fragileEngine");

function playBlind(context) {
  // context:
  // {
  //   run,
  //   deck,
  //   drawCard,
  //   targetScore,
  //   maxHands,
  //   boss,
  //   dispatcher,
  //   handlers
  // }

  let accumulatedScore = 0;
  let handsPlayed = [];
  let firstBlackjackResolved = false;

  for (let handIndex = 0; handIndex < context.maxHands; handIndex++) {
    const hand = createHand();
    hand.cards.push(context.drawCard());
    hand.cards.push(context.drawCard());

    const handContext = {
      aceUpActive: false,
      scrambleActive: context.boss === "boss_scramble",
      prng: context.run.prng,
    };

    const total = checkAutoBlackjack(hand, handContext);
    if (hand.blackjack && !firstBlackjackResolved) {
      firstBlackjackResolved = true;
    }

    // Hand play loop is driven externally (player input)
    // At this point, the hand is resolved

    const handTotal = calculateHandTotal(hand.cards, handContext);

    const scoringContext = {
      run: context.run,
      boss: context.boss,
      handTotal,
      firstHand: handIndex === 0,
      firstBlackjack: firstBlackjackResolved,
      jokers: context.run.jokers.map((j) => j.key),
      relics: context.run.relics.map((r) => r.key),
      enhancements: hand.cards
        .map((c) => c.enhancement && c.enhancement.key)
        .filter(Boolean),
    };

    let { basePoints, multiplier, preFragileScore } = scoreHand(
      hand,
      scoringContext,
    );

    if (hand.busted) {
      applyFragileOnBust({
        run: context.run,
        boss: context.boss,
        jokers: scoringContext.jokers,
        relics: scoringContext.relics,
        enhancements: scoringContext.enhancements,
      });
    } else {
      applyFragileOnScore({
        run: context.run,
        boss: context.boss,
      });
    }

    const finalScore = applyFragileReduction(
      preFragileScore,
      context.run.fragileStacks,
    );

    handsPlayed.push({
      hand,
      finalScore,
      multiplier,
    });

    accumulatedScore += finalScore;

    if (accumulatedScore >= context.targetScore) {
      break;
    }
  }

  // Boss / Joker: Final Hand — only highest scoring hand counts
  if (
    context.boss === "boss_final_hand" ||
    context.run.jokers.some((j) => j.key === "final_hand")
  ) {
    const highest = Math.max(...handsPlayed.map((h) => h.finalScore));
    accumulatedScore = highest * 3;
  }

  return {
    cleared: accumulatedScore >= context.targetScore,
    accumulatedScore,
    handsPlayed,
  };
}

module.exports = {
  playBlind,
};
