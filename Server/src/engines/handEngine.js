// handEngine.js
// Authoritative hand lifecycle logic for 21orBust.
// Handles actions, resolution, auto-blackjack, splits, and boss restrictions.

const {
  calculateHandTotal,
  hasVoidBorder,
  cloneCard,
} = require("./cardEngine");

// -----------------------------
// Hand factory
// -----------------------------
function createHand() {
  return {
    cards: [],
    resolved: false,
    busted: false,
    blackjack: false,
    stayed: false,
    hitsTaken: 0,
    voidBorderUsed: false,
  };
}

// -----------------------------
// Auto-resolve at 21
// -----------------------------
function checkAutoBlackjack(hand, context) {
  const total = calculateHandTotal(hand.cards, context);
  if (total === 21) {
    hand.blackjack = true;
    hand.resolved = true;
  }
  return total;
}

// -----------------------------
// Hit action
// -----------------------------
function hit(hand, drawCard, context) {
  if (hand.resolved) return;

  // Boss: The Tightening — max 2 hits
  if (context.boss === "boss_tightening" && hand.hitsTaken >= 2) {
    return;
  }

  // Boss: The Leak — hit costs 1 gold
  if (context.boss === "boss_leak") {
    context.run.gold = Math.max(0, context.run.gold - 1);
  }

  const card = drawCard();
  hand.cards.push(card);
  hand.hitsTaken += 1;

  const total = calculateHandTotal(hand.cards, context);

  if (total > 21) {
    // Void Border — ignore first bust
    if (!hand.voidBorderUsed && hand.cards.some(hasVoidBorder)) {
      hand.voidBorderUsed = true;
      return;
    }

    hand.busted = true;
    hand.resolved = true;
    return;
  }

  if (total === 21) {
    hand.blackjack = true;
    hand.resolved = true;
  }
}

// -----------------------------
// Stay action
// -----------------------------
function stay(hand) {
  if (hand.resolved) return;
  hand.stayed = true;
  hand.resolved = true;
}

// -----------------------------
// Double Down
// -----------------------------
function doubleDown(hand, drawCard, context) {
  if (hand.resolved) return;

  const card = drawCard();
  hand.cards.push(card);

  const total = calculateHandTotal(hand.cards, context);

  if (total > 21) {
    if (!hand.voidBorderUsed && hand.cards.some(hasVoidBorder)) {
      hand.voidBorderUsed = true;
    } else {
      hand.busted = true;
    }
  } else if (total === 21) {
    hand.blackjack = true;
  }

  hand.resolved = true;
}

// -----------------------------
// Split action
// -----------------------------
function canSplit(hand, context) {
  if (hand.cards.length !== 2) return false;

  // Boss: The Crackdown — split disabled
  if (context.boss === "boss_crackdown") return false;

  return true;
}

function split(hand, context) {
  if (!canSplit(hand, context)) return null;

  const [c1, c2] = hand.cards;

  const h1 = createHand();
  const h2 = createHand();

  h1.cards.push(cloneCard(c1));
  h2.cards.push(cloneCard(c2));

  // Echo Split — duplicate highest card
  if (context.echoSplit) {
    const total1 = calculateHandTotal(h1.cards, context);
    const total2 = calculateHandTotal(h2.cards, context);
    const highest = total1 >= total2 ? c1 : c2;

    h1.cards.push(cloneCard(highest));
    h2.cards.push(cloneCard(highest));
  }

  return [h1, h2];
}

module.exports = {
  createHand,
  checkAutoBlackjack,
  hit,
  stay,
  doubleDown,
  split,
};
