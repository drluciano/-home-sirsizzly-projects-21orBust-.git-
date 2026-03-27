exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS run_jokers (
      run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      slot_index INTEGER NOT NULL,
      joker_key TEXT NOT NULL,
      PRIMARY KEY (run_id, slot_index)
    );

    CREATE TABLE IF NOT EXISTS run_relics (
      run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      slot_index INTEGER NOT NULL,
      relic_key TEXT NOT NULL,
      PRIMARY KEY (run_id, slot_index)
    );

    CREATE TABLE IF NOT EXISTS run_stats (
      run_id INTEGER PRIMARY KEY REFERENCES runs(id) ON DELETE CASCADE,
      highest_ante INTEGER NOT NULL DEFAULT 0,
      total_score BIGINT NOT NULL DEFAULT 0,
      hands_played INTEGER NOT NULL DEFAULT 0,
      blackjacks INTEGER NOT NULL DEFAULT 0,
      busts INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS active_blind_state (
      run_id INTEGER PRIMARY KEY REFERENCES runs(id) ON DELETE CASCADE,
      blind_type TEXT NOT NULL CHECK (blind_type IN ('small','big','boss')),
      target_score INTEGER NOT NULL,
      accumulated_score INTEGER NOT NULL DEFAULT 0,
      hands_played INTEGER NOT NULL DEFAULT 0,
      boss_key TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS active_hand_state (
      run_id INTEGER PRIMARY KEY REFERENCES runs(id) ON DELETE CASCADE,
      hand_index INTEGER NOT NULL DEFAULT 0,
      cards JSONB NOT NULL DEFAULT '[]'::jsonb,
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      stayed BOOLEAN NOT NULL DEFAULT FALSE,
      busted BOOLEAN NOT NULL DEFAULT FALSE,
      void_border_used BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    DROP TABLE IF EXISTS active_hand_state;
    DROP TABLE IF EXISTS active_blind_state;
    DROP TABLE IF EXISTS run_stats;
    DROP TABLE IF EXISTS run_relics;
    DROP TABLE IF EXISTS run_jokers;
  `);
};
