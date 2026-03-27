// cardEngine.js
// Authoritative card math and enhancement behavior for 21orBust.
// This file defines how cards behave under all circumstances.
// No other engine may reinterpret rank, suit, or value logic.

const SUITS = ["club", "diamond", "heart", "spade"];
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

// -----------------------------
// Base rank value
// -----------------------------
function baseRankValue(rank) {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J") return 10;
  return parseInt(rank, 10);
}

function isFace(rank) {
  return rank === "J" || rank === "Q" || rank === "K";
}

// -----------------------------
// Enhancement transforms
// -----------------------------
function applyRankAscension(card) {
  if (!card.enhancement || card.enhancement.key !== "rank_ascension") {
    return card.rank;
  }

  const idx = RANKS.indexOf(card.rank);
  return RANKS[Math.min(idx + 1, RANKS.length - 1)];
}

function applySuitChanger(card) {
  if (!card.enhancement || card.enhancement.key !== "suit_changer") {
    return card.suit;
  }

  return card.enhancement.newSuit;
}

function applyCardMimic(card) {
  if (!card.enhancement || card.enhancement.key !== "card_mimic") {
    return card;
  }

  return {
    ...card,
    rank: card.enhancement.rank,
    suit: card.enhancement.suit,
    enhancement: card.enhancement,
  };
}

function phantomInkMultiplier(card) {
  return card.enhancement && card.enhancement.key === "phantom_ink" ? 2 : 1;
}

function hasVoidBorder(card) {
  return card.enhancement && card.enhancement.key === "void_border";
}

// -----------------------------
// Boss: The Scramble
// -----------------------------
function scrambleSuit(originalSuit, prng) {
  return SUITS[Math.floor(prng() * SUITS.length)];
}

// -----------------------------
// Hand total calculation
// -----------------------------
function calculateHandTotal(cards, context) {
  // context:
  // {
  //   aceUpActive: boolean,
  //   scrambleActive: boolean,
  //   prng: function
  // }

  let total = 0;
  let aceCount = 0;

  for (let raw of cards) {
    let card = applyCardMimic(raw);

    const rank = applyRankAscension(card);
    const suit = applySuitChanger(card);

    const finalSuit = context.scrambleActive
      ? scrambleSuit(suit, context.prng)
      : suit;

    card._computedSuit = finalSuit;

    const value = baseRankValue(rank) * phantomInkMultiplier(card);

    total += value;
    if (rank === "A") aceCount += 1;
  }

  // Ace Up modifies downgrade threshold
  if (context.aceUpActive) {
    while (total > 22 && aceCount > 0) {
      total -= 10;
      aceCount -= 1;
    }
  }

  // Standard Ace downgrade
  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount -= 1;
  }

  return total;
}

// -----------------------------
// Helpers for scoring engines
// -----------------------------
function countFaceCards(cards) {
  return cards.reduce((n, c) => n + (isFace(c.rank) ? 1 : 0), 0);
}

function countRank(cards, rank) {
  return cards.reduce((n, c) => n + (c.rank === rank ? 1 : 0), 0);
}

function uniqueSuits(cards) {
  const set = new Set();
  for (const c of cards) {
    set.add(c._computedSuit || c.suit);
  }
  return set;
}

// -----------------------------
// Card cloning (Twin Sigil, Echo Split)
// -----------------------------
function cloneCard(card) {
  return {
    id: card.id,
    rank: card.rank,
    suit: card.suit,
    enhancement: card.enhancement ? { ...card.enhancement } : null,
  };
}

module.exports = {
  SUITS,
  RANKS,
  baseRankValue,
  calculateHandTotal,
  countFaceCards,
  countRank,
  uniqueSuits,
  hasVoidBorder,
  cloneCard,
};
