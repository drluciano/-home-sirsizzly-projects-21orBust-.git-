// scoringEngine.js
// Authoritative scoring pipeline for 21orBust.
// Implements base points, base modifiers, multiplier assembly,
// pre-fragile score, and final score output.

const { countFaceCards, countRank, uniqueSuits } = require("./cardEngine");

function computeBasePoints(hand, context) {
  const total = context.handTotal;

  // Bust baseline
  if (hand.busted) {
    // Legendary Joker: House Always Loses
    if (context.jokers.includes("house_always_loses")) {
      return Math.floor(total * 10 * 0.5);
    }

    // Relic: Grave Marker
    if (context.relics.includes("grave_marker")) {
      return total * 10;
    }

    // Rare Joker: Blood Counter
    if (context.jokers.includes("blood_counter")) {
      return 50;
    }

    return 0;
  }

  let base = total * 10;

  // Joker: Face Value
  if (context.jokers.includes("face_value")) {
    base += countFaceCards(hand.cards) * 10;
  }

  // Joker: Thin Margin
  if (context.jokers.includes("thin_margin") && hand.cards.length === 2) {
    base += 30;
  }

  // Joker: Even Odds
  if (context.jokers.includes("even_odds") && total % 2 === 0) {
    base += 20;
  }

  // Joker: Low Stakes
  if (context.jokers.includes("low_stakes") && total < 18) {
    base = Math.floor(base / 2);
  }

  // Boss: The Cutter
  if (context.boss === "boss_cutter" && (total === 20 || total === 21)) {
    base -= 20;
  }

  // Boss: The Short Stack
  if (context.boss === "boss_short_stack" && total < 17) {
    return 0;
  }

  // Boss: The Void
  if (context.boss === "boss_void") {
    base = Math.floor(base / 2);
  }

  return Math.max(0, base);
}

function assembleMultiplier(hand, context) {
  let mult = 1;

  // Permanent run multiplier
  mult += context.run.permanentMultiplier;

  const total = context.handTotal;

  // Joker: High Card
  if (context.jokers.includes("high_card") && total >= 19) {
    mult += 1;
  }

  // Joker: Odd Luck
  if (context.jokers.includes("odd_luck") && total % 2 === 1) {
    mult += 1;
  }

  // Joker: Double Down (first hand of round)
  if (context.jokers.includes("double_down") && context.firstHand) {
    mult += 1;
  }

  // Joker: Dealer’s Smile (first blackjack)
  if (
    context.jokers.includes("dealers_smile") &&
    hand.blackjack &&
    context.firstBlackjack
  ) {
    mult += 1;
  }

  // Joker: Late Stay
  if (
    context.jokers.includes("late_stay") &&
    hand.stayed &&
    (total === 20 || total === 21)
  ) {
    mult += 1;
  }

  // Joker: Suit Stitch
  if (context.jokers.includes("suit_stitch")) {
    const suits = uniqueSuits(hand.cards);
    if (suits.size >= 2) mult += 1;
  }

  // Joker: Suit Tyrant
  if (context.jokers.includes("suit_tyrant")) {
    const suits = uniqueSuits(hand.cards);
    mult += suits.size === 1 ? 3 : -1;
  }

  // Joker: Face Parade
  if (context.jokers.includes("face_parade")) {
    mult += countFaceCards(hand.cards) * 0.5;
  }

  // Joker: Lucky Sevens
  if (context.jokers.includes("lucky_sevens")) {
    const sevens = countRank(hand.cards, "7");
    mult += sevens * 2;
    if (sevens === 3) mult += 5;
  }

  // Joker: Crown of Kings
  if (context.jokers.includes("crown_of_kings")) {
    mult += countRank(hand.cards, "K") * 1.5;
  }

  // Joker: Suit Alchemy
  if (context.jokers.includes("suit_alchemy")) {
    mult += uniqueSuits(hand.cards).size;
  }

  // Joker: Pressure Cooker
  if (context.jokers.includes("pressure_cooker")) {
    mult += context.run.fragileStacks * 0.5;
  }

  // Enhancement: Face Crown
  if (context.enhancements.includes("face_crown")) {
    mult += countFaceCards(hand.cards);
  }

  // Enhancement: Blackjack Booster
  if (context.enhancements.includes("blackjack_booster") && hand.blackjack) {
    mult += 2;
  }

  // Enhancement: Cursed Edge
  if (context.enhancements.includes("cursed_edge")) {
    mult += 3;
  }

  return mult;
}

function scoreHand(hand, context) {
  const base = computeBasePoints(hand, context);
  const multiplier = assembleMultiplier(hand, context);
  const preFragile = base * multiplier;

  return {
    basePoints: base,
    multiplier,
    preFragileScore: preFragile,
  };
}

module.exports = {
  scoreHand,
};
