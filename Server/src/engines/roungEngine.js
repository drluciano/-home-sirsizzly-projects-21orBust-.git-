// roundEngine.js
// Authoritative round (ante) execution for 21orBust.
// Executes Small → Big → Boss blinds in order.

const { playBlind } = require("./blindEngine");

function playRound(context) {
  // context:
  // {
  //   run,
  //   deck,
  //   drawCard,
  //   anteIndex,
  //   boss,
  //   dispatcher,
  //   handlers
  // }

  const blindTargets = calculateBlindTargets(context.anteIndex);

  const blinds = [
    { type: "small", target: blindTargets.small, boss: null },
    { type: "big", target: blindTargets.big, boss: null },
    { type: "boss", target: blindTargets.boss, boss: context.boss },
  ];

  for (const blind of blinds) {
    const result = playBlind({
      run: context.run,
      deck: context.deck,
      drawCard: context.drawCard,
      targetScore: blind.target,
      maxHands: context.run.maxHands,
      boss: blind.boss,
      dispatcher: context.dispatcher,
      handlers: context.handlers,
    });

    if (!result.cleared) {
      return {
        success: false,
        failedAt: blind.type,
        score: result.accumulatedScore,
      };
    }
  }

  return {
    success: true,
  };
}

function calculateBlindTargets(anteIndex) {
  const base = 80 * Math.pow(2, (anteIndex - 1) * 3);
  return {
    small: base,
    big: base * 2,
    boss: base * 4,
  };
}

module.exports = {
  playRound,
};
