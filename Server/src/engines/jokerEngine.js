// jokerEngine.js
// Authoritative Joker behavior definitions for 21orBust.
// Jokers never decide timing or precedence — only effect logic.

function registerJokers(handlers) {
  // -----------------------------
  // COMMON
  // -----------------------------

  handlers.jokers.high_card = (event, payload) => {
    if (event === "on_hand_scored" && payload.handTotal >= 19) {
      payload.multiplier += 1;
    }
  };

  handlers.jokers.suit_stitch = (event, payload) => {
    if (event === "on_hand_scored" && payload.uniqueSuits >= 2) {
      payload.multiplier += 1;
    }
  };

  handlers.jokers.face_value = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.basePoints += payload.faceCards * 10;
    }
  };

  handlers.jokers.ace_up = (event, payload) => {
    if (event === "on_hand_value") {
      payload.aceUpActive = true;
    }
  };

  handlers.jokers.double_down = (event, payload) => {
    if (event === "on_first_hand") {
      payload.multiplier += 1;
    }
  };

  handlers.jokers.even_odds = (event, payload) => {
    if (event === "on_hand_scored" && payload.handTotal % 2 === 0) {
      payload.basePoints += 20;
    }
  };

  handlers.jokers.odd_luck = (event, payload) => {
    if (event === "on_hand_scored" && payload.handTotal % 2 === 1) {
      payload.multiplier += 1;
    }
  };

  handlers.jokers.dealers_smile = (event, payload) => {
    if (event === "on_blackjack" && payload.firstBlackjack) {
      payload.multiplier += 1;
    }
  };

  handlers.jokers.thin_margin = (event, payload) => {
    if (event === "on_hand_scored" && payload.cardCount === 2) {
      payload.basePoints += 30;
    }
  };

  handlers.jokers.late_stay = (event, payload) => {
    if (
      event === "on_stay" &&
      (payload.handTotal === 20 || payload.handTotal === 21)
    ) {
      payload.multiplier += 1;
    }
  };

  handlers.jokers.soft_touch = (event, payload) => {
    if (event === "on_bust") {
      payload.fragileReduction += 1;
    }
  };

  handlers.jokers.stacked_deck = (event, payload) => {
    if (event === "on_blind_end" && payload.allHandsScored) {
      payload.run.permanentMultiplier += 1;
    }
  };

  handlers.jokers.low_stakes = (event, payload) => {
    if (event === "on_hand_scored" && payload.handTotal < 18) {
      payload.basePoints = Math.floor(payload.basePoints / 2);
    }
  };

  // -----------------------------
  // UNCOMMON
  // -----------------------------

  handlers.jokers.fortune_joker = (event, payload) => {
    if (event === "on_blackjack_scored") {
      payload.run.gold += 2;
    }
  };

  handlers.jokers.mirror_hand = (event, payload) => {
    if (event === "on_all_hands_scored") {
      payload.copyHighestMultiplier = true;
    }
  };

  handlers.jokers.suit_tyrant = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.multiplier += payload.uniqueSuits === 1 ? 3 : -1;
    }
  };

  handlers.jokers.face_parade = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.multiplier += payload.faceCards * 0.5;
    }
  };

  handlers.jokers.split_memory = (event, payload) => {
    if (event === "on_split") {
      payload.freeSplit = true;
    }
  };

  handlers.jokers.risk_premium = (event, payload) => {
    if (event === "on_bust") {
      payload.run.nextRoundBonusMultiplier += 2;
    }
  };

  handlers.jokers.double_vision = (event, payload) => {
    if (event === "on_first_enhancement") {
      payload.duplicateEnhancement = true;
    }
  };

  handlers.jokers.lucky_draw = (event, payload) => {
    if (event === "on_first_draw") {
      payload.allowDuplicateDraw = true;
    }
  };

  handlers.jokers.gold_lining = (event, payload) => {
    if (event === "on_blind_end" && payload.handsUsed <= 2) {
      payload.run.gold += 1;
    }
  };

  handlers.jokers.chain_reaction = (event, payload) => {
    if (event === "on_21_after_first") {
      payload.multiplier += 1;
    }
  };

  handlers.jokers.dealers_tell = (event, payload) => {
    if (event === "on_hit_preview") {
      payload.allowPeek = true;
    }
  };

  handlers.jokers.pressure_cooker = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.multiplier += payload.run.fragileStacks * 0.5;
    }
  };

  // -----------------------------
  // RARE
  // -----------------------------

  handlers.jokers.split_joker = (event, payload) => {
    if (event === "on_run_start") {
      payload.maxHands = 5;
    }
  };

  handlers.jokers.lucky_sevens = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.multiplier += payload.sevens * 2;
      if (payload.sevens === 3) payload.multiplier += 5;
    }
  };

  handlers.jokers.crown_of_kings = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.multiplier += payload.kings * 1.5;
    }
  };

  handlers.jokers.devils_bargain = (event, payload) => {
    if (event === "on_intentional_bust") {
      payload.run.permanentMultiplier += 2;
      payload.run.gold = Math.max(0, payload.run.gold - 2);
    }
  };

  handlers.jokers.blackjack_engine = (event, payload) => {
    if (event === "on_blackjack_scored") {
      payload.run.permanentMultiplier += 1;
    }
  };

  handlers.jokers.suit_alchemy = (event, payload) => {
    if (event === "on_hand_scored") {
      payload.multiplier += payload.uniqueSuits;
    }
  };

  handlers.jokers.blood_counter = (event, payload) => {
    if (event === "on_bust") {
      payload.basePoints += 50;
    }
  };

  handlers.jokers.echo_split = (event, payload) => {
    if (event === "on_split") {
      payload.echoSplit = true;
    }
  };

  handlers.jokers.debt_spiral = (event, payload) => {
    if (event === "on_run_start") {
      payload.run.gold += 5;
    }
  };

  handlers.jokers.perfect_storm = (event, payload) => {
    if (event === "on_all_hands_21") {
      payload.multiplier += 10;
    }
  };

  // -----------------------------
  // LEGENDARY
  // -----------------------------

  handlers.jokers.endless_twenty_one = (event, payload) => {
    if (event === "on_21_scored") {
      payload.run.permanentMultiplier += 1;
    }
  };

  handlers.jokers.house_always_loses = () => {};

  handlers.jokers.golden_devil = (event, payload) => {
    if (event === "on_bust") {
      payload.run.permanentMultiplier += 3;
      payload.run.gold += 1;
    }
  };

  handlers.jokers.final_hand = (event, payload) => {
    if (event === "on_blind_scored") {
      payload.finalHandOnly = true;
      payload.finalHandMultiplier = 3;
    }
  };
}

module.exports = {
  registerJokers,
};
