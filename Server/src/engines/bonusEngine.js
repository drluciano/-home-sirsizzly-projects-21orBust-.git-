// Jokers, relics, enhancements, boss side-effects: gold, shop, card transforms, etc.

function jokerKeys(runState) {
  return (runState.jokers || []).map((j) => j.key);
}

function relicKeys(runState) {
  return (runState.relics || []).map((r) => r.key);
}

function enhancementKeysForHand(hand) {
  return (hand.enhancements || []).map((e) => e.key);
}

// ---------- Card-level effects on deal / start ----------

function applyCardLevelEffectsOnDeal(hand, runState, context) {
  // Twin Sigil, Card Mimic, Suit Changer, Rank Ascension, Phantom Ink, Void Border
  const eKeys = enhancementKeysForHand(hand);

  // Phantom Ink: counts as two ranks for scoring only – handled in cardEngine/total logic, not here.

  // Rank Ascension / Suit Changer / Card Mimic are assumed to be applied at enhancement application time,
  // not dynamically here, so this function is mostly a placeholder for future per-deal triggers.

  return { hand, runState, context };
}

function applyBossStartEffects(runState, blindState) {
  const boss = blindState.boss;
  if (!boss) return;

  // The Misdeal: first card you draw is revealed, rejected, replaced with next card
  if (boss.key === "boss_misdeal") {
    blindState.misdealActive = true;
  }

  // The Tightening: each hand may Hit only twice – enforced in handEngine

  // The Crackdown: Split disabled – enforced in handEngine

  // The Jammer: leftmost Joker disabled this round
  if (boss.key === "boss_jammer") {
    blindState.jammerDisabledIndex = 0;
  }

  // The Scramble: suits treated as random – handled in cardEngine scoring logic

  // The Leak: each Hit costs 1 gold – enforced in handEngine

  // The Inflation / Taxman: shop-only, handled in shopService
}

// ---------- Bust bonuses / penalties ----------

function isCursedEdgeActive(hand, runState) {
  const eKeys = enhancementKeysForHand(hand);
  return eKeys.includes("cursed_edge");
}

function isGoldenDevilActive(runState) {
  return jokerKeys(runState).includes("golden_devil");
}

function isDebtSpiralActive(runState) {
  return jokerKeys(runState).includes("debt_spiral");
}

function isBloodContractActive(runState) {
  return relicKeys(runState).includes("blood_contract");
}

function applyBustBonuses(hand, runState, blindState) {
  const jKeys = jokerKeys(runState);
  const rKeys = relicKeys(runState);

  // Devil’s Bargain: intentional bust → +2× permanent, −2 gold
  if (jKeys.includes("devils_bargain") && hand.metadata.intentionalBust) {
    runState.permanentMultiplier += 2;
    runState.gold = Math.max(0, runState.gold - 2);
  }

  // Golden Devil: bust → +3×, +1 gold, Fragile doubles (Fragile doubling handled in fragileEngine via context)
  if (jKeys.includes("golden_devil")) {
    runState.permanentMultiplier += 3;
    runState.gold += 1;
  }

  // Blood Counter: bust adds +50 base – handled in scoringEngine bust path

  // Grave Marker: bust adds base instead of zero – handled in scoringEngine

  // Blood Contract: each bust permanently grants +1× – handled in fragileEngine via context

  return runState;
}

// ---------- Post-hand bonuses (non-bust) ----------

function applyPostHandBonuses(hand, runState, blindState) {
  const jKeys = jokerKeys(runState);
  const rKeys = relicKeys(runState);
  const eKeys = enhancementKeysForHand(hand);

  // Fortune Joker: +2 gold per Blackjack
  if (jKeys.includes("fortune_joker") && hand.isBlackjack) {
    runState.gold += 2;
  }

  // Golden Frame: if this card is part of a 21, +1 gold
  if (eKeys.includes("golden_frame") && hand.total === 21 && !hand.isBusted) {
    runState.gold += 1;
  }

  // Golden Ledger: +1 gold after every round – handled at round end, not per hand

  // Loaded Deck: +10% face card draw chance – handled in deckGenerator / draw logic

  // Black Seal: Blackjack removes 1 Fragile
  if (
    rKeys.includes("black_seal") &&
    hand.isBlackjack &&
    runState.fragileStacks > 0
  ) {
    runState.fragileStacks -= 1;
  }

  // Chain Reaction: each 21 after first → +1× (temporary multiplier handled in multiplierEngine if desired)

  return runState;
}

// ---------- Boss post-hand effects ----------

function applyPostHandBossEffects(hand, runState, blindState) {
  const boss = blindState.boss;
  if (!boss) return;

  // The Overload: every scoring hand applies +1 Fragile – handled in scoringEngine

  // The Grinder: busts apply +2 Fragile – handled in fragileEngine via context

  // The Dealer’s Due: lose 2 gold at end of round – handled at round end, not here
}

// ---------- Final Hand joker presence ----------

function hasFinalHandJoker(runState) {
  return jokerKeys(runState).includes("final_hand");
}

module.exports = {
  applyCardLevelEffectsOnDeal,
  applyBossStartEffects,
  applyBustBonuses,
  applyPostHandBonuses,
  applyPostHandBossEffects,
  isCursedEdgeActive,
  isGoldenDevilActive,
  isDebtSpiralActive,
  isBloodContractActive,
  hasFinalHandJoker,
};
