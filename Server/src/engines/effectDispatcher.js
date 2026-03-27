// effectDispatcher.js
// Centralized trigger resolution for 21orBust.
// Enforces trigger timing, resolution order, and override hierarchy.
//
// Resolution order (per spec):
//   Enhancements → Jokers → Relics (left-to-right)
// Override hierarchy:
//   Boss > Joker > Relic > Enhancement > Base

function dispatch(event, payload, context) {
  // context:
  // {
  //   boss,
  //   jokers: [{ key }],
  //   relics: [{ key }],
  //   enhancements: [{ key }],
  //   handlers: {
  //     enhancements: { [key]: fn },
  //     jokers: { [key]: fn },
  //     relics: { [key]: fn },
  //     bosses: { [key]: fn }
  //   }
  // }

  // Boss overrides always resolve first
  if (context.boss && context.handlers.bosses[context.boss]) {
    const blocked = context.handlers.bosses[context.boss](
      event,
      payload,
      context,
    );
    if (blocked === true) return;
  }

  // Enhancements (left → right)
  for (const enh of context.enhancements) {
    const handler = context.handlers.enhancements[enh.key];
    if (handler) handler(event, payload, context);
  }

  // Jokers (left → right)
  for (const joker of context.jokers) {
    const handler = context.handlers.jokers[joker.key];
    if (handler) handler(event, payload, context);
  }

  // Relics (left → right)
  for (const relic of context.relics) {
    const handler = context.handlers.relics[relic.key];
    if (handler) handler(event, payload, context);
  }
}

module.exports = {
  dispatch,
};
