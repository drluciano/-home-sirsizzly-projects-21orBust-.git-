// relicEngine.js
// Authoritative Relic behavior definitions for 21orBust.
// Relics resolve after Jokers and before base rules.

function registerRelics(handlers) {
  handlers.relics.golden_ledger = (event, payload) => {
    if (event === "on_round_end") {
      payload.run.gold += 1;
    }
  };

  handlers.relics.loaded_deck = (event, payload) => {
    if (event === "on_draw") {
      payload.faceCardBias += 0.1;
    }
  };

  handlers.relics.black_seal = (event, payload) => {
    if (event === "on_blackjack_scored" && payload.run.fragileStacks > 0) {
      payload.run.fragileStacks -= 1;
    }
  };

  handlers.relics.dealers_favor = (event, payload) => {
    if (event === "on_shop_purchase" && !payload.used) {
      payload.costReduction += 1;
      payload.used = true;
    }
  };

  handlers.relics.split_memory = (event, payload) => {
    if (event === "on_split") {
      payload.freeSplit = true;
    }
  };

  handlers.relics.grave_marker = () => {
    // Handled in scoringEngine (bust base override)
  };

  handlers.relics.vault_key = (event, payload) => {
    if (event === "on_shop_reroll") {
      payload.rerollCostReduction += 1;
    }
  };

  handlers.relics.echo_relic = (event, payload) => {
    if (event === "on_first_enhancement") {
      payload.duplicateEnhancement = true;
    }
  };

  handlers.relics.blood_contract = () => {
    // Handled in fragileEngine (permanent multiplier on bust)
  };

  handlers.relics.broken_compass = (event, payload) => {
    if (event === "on_ante_start") {
      payload.revealBoss = true;
    }
  };
}

module.exports = {
  registerRelics,
};
