// enhancementEngine.js
// Authoritative enhancement attachment and behavior for 21orBust.
// Enforces one-enhancement-per-card and full inheritance on duplication.

const { cloneCard } = require("./cardEngine");

function applyEnhancement(card, enhancement) {
  // Replaces any existing enhancement
  card.enhancement = { ...enhancement };
}

function duplicateCard(card) {
  return cloneCard(card);
}

function applyTwinSigil(card, context) {
  if (
    card.enhancement &&
    card.enhancement.key === "twin_sigil" &&
    !context.twinSigilUsed
  ) {
    context.twinSigilUsed = true;
    return duplicateCard(card);
  }
  return null;
}

function handleEnhancementApplication(card, enhancement, context) {
  applyEnhancement(card, enhancement);

  // Joker: Double Vision
  if (context.doubleVision) {
    applyEnhancement(card, enhancement);
  }

  // Relic: Echo Relic
  if (context.echoRelic) {
    applyEnhancement(card, enhancement);
  }
}

module.exports = {
  applyEnhancement,
  duplicateCard,
  applyTwinSigil,
  handleEnhancementApplication,
};
