// prngEngine.js
// Deterministic PRNG for full run reproducibility

let seed = 1;

function setSeed(newSeed) {
  seed = newSeed >>> 0 || 1;
}

function next() {
  // Linear Congruential Generator (Numerical Recipes)
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 0xffffffff;
}

function nextInt(maxExclusive) {
  return Math.floor(next() * maxExclusive);
}

function chance(probability) {
  return next() < probability;
}

module.exports = {
  setSeed,
  next,
  nextInt,
  chance,
};
