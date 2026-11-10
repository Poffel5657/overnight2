// Wesen. ai: 'greyling' (mutig im Dunkeln, scheu im Licht) oder 'animal' (flieht, wehrt sich kaum).
// Zeiten in Takten (ein Takt = TICK_MS aus shared/rules.js).
export const MOBS = {
  greyling: {
    name: 'Greyling',
    sprite: 'greyling',
    hp: 18,
    hit: [2, 3],
    attackEvery: 4,
    aggro: 5,
    leash: 9,
    respawn: 40,
    xp: 12,
    // Angekündigter Angriff: markiert den Boden, trifft nach "delay" Takten, wer dann noch dort steht.
    lunge: { every: 3, delay: 3, hit: [6, 8], text: 'The Greyling gathers itself, low and grey.' },
    examine: 'A bit of the Grey that has decided to have a shape. It does not like your lantern.',
  },
  crow: {
    name: 'Crow',
    sprite: 'crow',
    hp: 6,
    hit: [1, 1],
    attackEvery: 5,
    aggro: 0,
    leash: 6,
    respawn: 25,
    xp: 3,
    ai: 'animal',
    examine: 'It is judging you. Crows judge everyone.',
  },
};
