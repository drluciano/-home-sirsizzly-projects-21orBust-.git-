// shopEngine.js
// Authoritative shop logic for 21orBust.
// Handles shop inventory, pricing, rerolls, purchases, and boss penalties.

const { nextInt } = require("./prngEngine");

const BASE_PRICES = {
  joker: 3,
  relic: 4,
  enhancement: 2,
  pack: 5,
};

function generateShop(run, context) {
  const shop = {
    items: [],
    rerollCost: 1,
    usedDiscount: false,
  };

  // Boss: Inflation
  if (context.boss === "boss_inflation") {
    shop.rerollCost += 2;
  }

  // Generate 3 items deterministically
  for (let i = 0; i < 3; i++) {
    shop.items.push(generateItem(run));
  }

  return shop;
}

function generateItem(run) {
  const roll = nextInt(100);

  if (roll < 40) {
    return { type: "enhancement", price: BASE_PRICES.enhancement };
  }
  if (roll < 70) {
    return { type: "joker", price: BASE_PRICES.joker };
  }
  if (roll < 90) {
    return { type: "relic", price: BASE_PRICES.relic };
  }

  return { type: "pack", price: BASE_PRICES.pack };
}

function rerollShop(shop, run) {
  const cost = shop.rerollCost;
  if (run.gold < cost) return false;

  run.gold -= cost;
  shop.items = [];
  for (let i = 0; i < 3; i++) {
    shop.items.push(generateItem(run));
  }

  return true;
}

function purchaseItem(shop, run, index) {
  const item = shop.items[index];
  if (!item) return false;

  let price = item.price;

  // Relic: Dealer’s Favor (one-time discount)
  if (run.relics.some((r) => r.key === "dealers_favor") && !shop.usedDiscount) {
    price = Math.max(0, price - 1);
    shop.usedDiscount = true;
  }

  if (run.gold < price) return false;

  run.gold -= price;
  shop.items.splice(index, 1);

  return item;
}

module.exports = {
  generateShop,
  rerollShop,
  purchaseItem,
};
