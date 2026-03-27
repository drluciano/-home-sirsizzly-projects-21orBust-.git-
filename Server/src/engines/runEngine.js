// runEngine.js
// Authoritative run lifecycle for 21orBust.
// Initializes runs, manages ante progression, and determines run end.

const { setSeed } = require("./prngEngine");
const { createDeck, shuffle, draw } = require("./deckEngine");
const { playRound } = require("./roundEngine");

function startRun(seed) {
  setSeed(seed);

  const deck = shuffle(createDeck());

  return {
    seed,
    deck,
    deckPosition: 0,
    gold: 5,
    fragileStacks: 0,
    permanentMultiplier: 0,
    jokers: [],
    relics: [],
    anteIndex: 1,
    maxHands: 3,
    runOver: false,
    stats: {
      highestBlind: 0,
      totalScore: 0,
    },
  };
}

function drawCard(run) {
  const card = run.deck[run.deckPosition];
  run.deckPosition += 1;
  return card;
}

function playRun(run, context) {
  while (!run.runOver) {
    const boss = context.selectBoss(run.anteIndex);

    const roundResult = playRound({
      run,
      deck: run.deck,
      drawCard: () => drawCard(run),
      anteIndex: run.anteIndex,
      boss,
      dispatcher: context.dispatcher,
      handlers: context.handlers,
    });

    if (!roundResult.success) {
      run.runOver = true;
      run.stats.highestBlind = run.anteIndex;
      return {
        success: false,
        run,
      };
    }

    run.anteIndex += 1;
  }

  return {
    success: true,
    run,
  };
}

module.exports = {
  startRun,
  playRun,
};
