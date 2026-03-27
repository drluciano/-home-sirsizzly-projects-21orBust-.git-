// fragileEngine.js
// Authoritative Fragile system for 21orBust.
// Handles Fragile gain, modification, and score reduction.

function applyFragileOnBust(context) {
  // context:
  // {
  //   run,
  //   boss,
  //   jokers,
  //   relics,
  //   enhancements
  // }

  let fragileGain = 1; // baseline

  // Boss: The Grinder — busts apply +2 Fragile instead
  if (context.boss === "boss_grinder") {
    fragileGain = 2;
  }

  // Enhancement: Cursed Edge — doubles Fragile gained on bust
  if (context.enhancements.includes("cursed_edge")) {
    fragileGain *= 2;
  }

  // Joker: Golden Devil — Fragile doubles on bust
  if (context.jokers.includes("golden_devil")) {
    fragileGain *= 2;
  }

  // Joker: Debt Spiral — Fragile stacks twice as fast
  if (context.jokers.includes("debt_spiral")) {
    fragileGain *= 2;
  }

  // Joker: Soft Touch — reduces Fragile gain by 1 (minimum 0)
  if (context.jokers.includes("soft_touch")) {
    fragileGain = Math.max(0, fragileGain - 1);
  }

  context.run.fragileStacks += fragileGain;

  // Relic: Blood Contract — each bust grants +1× permanent multiplier
  if (context.relics.includes("blood_contract")) {
    context.run.permanentMultiplier += 1;
  }
}

function applyFragileOnScore(context) {
  // Boss: The Overload — every scoring hand adds +1 Fragile
  if (context.boss === "boss_overload") {
    context.run.fragileStacks += 1;
  }
}

function applyFragileReduction(score, fragileStacks) {
  const reduction = 0.05 * fragileStacks;
  const multiplier = Math.max(0, 1 - reduction);
  return Math.floor(score * multiplier);
}

module.exports = {
  applyFragileOnBust,
  applyFragileOnScore,
  applyFragileReduction,
};
