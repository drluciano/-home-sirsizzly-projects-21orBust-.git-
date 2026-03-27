// bossEngine.js
// Authoritative Boss Blind behavior for 21orBust.
// Boss rules override all other systems.

function registerBosses(handlers) {
  handlers.bosses.boss_cutter = (event, payload) => {
    if (
      event === "on_hand_scored" &&
      (payload.handTotal === 20 || payload.handTotal === 21)
    ) {
      payload.basePoints -= 20;
    }
  };

  handlers.bosses.boss_misdeal = (event, payload) => {
    if (event === "on_first_draw") {
      payload.rejectFirstCard = true;
    }
  };

  handlers.bosses.boss_taxman = (event, payload) => {
    if (event === "on_shop_enter") {
      payload.priceIncrease += 1;
    }
  };

  handlers.bosses.boss_grinder = (event, payload) => {
    if (event === "on_bust") {
      payload.fragileOverride = 2;
    }
  };

  handlers.bosses.boss_tightening = (event, payload) => {
    if (event === "on_round_start") {
      payload.maxHitsPerHand = 2;
    }
  };

  handlers.bosses.boss_short_stack = (event, payload) => {
    if (event === "on_hand_scored" && payload.handTotal < 17) {
      payload.basePoints = 0;
      return true; // block lower layers
    }
  };

  handlers.bosses.boss_dealers_due = (event, payload) => {
    if (event === "on_round_end") {
      payload.run.gold = Math.max(0, payload.run.gold - 2);
    }
  };

  handlers.bosses.boss_inflation = (event, payload) => {
    if (event === "on_shop_reroll") {
      payload.rerollCostIncrease += 2;
    }
  };

  handlers.bosses.boss_leak = (event, payload) => {
    if (event === "on_action_hit") {
      payload.run.gold = Math.max(0, payload.run.gold - 1);
    }
  };

  handlers.bosses.boss_crackdown = (event) => {
    if (event === "on_split_attempt") {
      return true; // block split
    }
  };

  handlers.bosses.boss_jammer = (event, payload) => {
    if (event === "on_round_start") {
      payload.disableJokerIndex = 0;
    }
  };

  handlers.bosses.boss_scramble = (event, payload) => {
    if (event === "on_round_start") {
      payload.scrambleSuits = true;
    }
  };

  handlers.bosses.boss_final_hand = (event, payload) => {
    if (event === "on_blind_scored") {
      payload.finalHandOnly = true;
    }
  };

  handlers.bosses.boss_overload = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.run.fragileStacks += 1;
    }
  };

  handlers.bosses.boss_void = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.basePoints = Math.floor(payload.basePoints / 2);
    }
  };
}

module.exports = {
  registerBosses,
};
