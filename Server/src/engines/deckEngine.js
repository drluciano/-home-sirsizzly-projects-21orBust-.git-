// deckEngine.js
// 104-card deck, sequential draw, no discard

const { nextInt } = require("./prngEngine");

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

function createDeck() {
  const deck = [];
  for (let d = 0; d < 2; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: `${rank}_${suit}_${d}`,
          rank,
          suit,
          enhancement: null,
        });
      }
    }
  }
  return deck;
}

function shuffle(deck) {
  const result = deck.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = nextInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function draw(deckState) {
  const card = deckState.cards[deckState.position];
  deckState.position += 1;
  return card;
}

module.exports = {
  createDeck,
  shuffle,
  draw,
};
