// Wesen. Zeiten in Takten (ein Takt = TICK_MS aus shared/sim.js). Erfahrung geht an die aktive Klasse.
//   ai: 'grey'   Nebelwesen: mutig im Dunkeln, meiden helles Licht wie eine Wand
//       'beast'  Raubtier: greift auch im Licht an, kommt aber nicht ins Dorf
//       'animal' wehrt sich nur, wenn man es angreift
//   level: grobe Stufe (Anzeige und Balance).  moveEvery: Takte pro Schritt (0 = bewegt sich nie).
//   special: angekündigter Angriff, markiert den Boden und trifft nach delay Takten, wer dann noch dort steht.
//            pattern: plus (Kreuz um das Ziel), ring (alle Felder um das Wesen), line (drei Felder vom Wesen
//            zum Ziel), bigplus (Kreuz mit Reichweite 2 um das Ziel).
//   drainOil: Treffer stiehlt so viel Lampenöl.
//   drops: [Gegenstand, Chance, min, max].  gold: [min, max].

export const MOBS = {
  crow: {
    name: 'Crow', sprite: 'crow', level: 1, ai: 'animal',
    hp: 6, hit: [1, 1], attackEvery: 5, aggro: 0, leash: 6, respawn: 25, xp: 3,
    drops: [['crow_feather', 0.7, 1, 2]], gold: [0, 1],
    examine: 'It is judging you. Crows judge everyone.',
  },
  greyling: {
    name: 'Greyling', sprite: 'greyling', level: 3, ai: 'grey',
    hp: 18, hit: [2, 3], attackEvery: 4, aggro: 5, leash: 9, respawn: 40, xp: 12,
    drops: [['grey_wisp', 0.6, 1, 1], ['scrap', 0.25, 1, 2]], gold: [1, 4],
    special: { every: 3, delay: 3, pattern: 'plus', hit: [6, 8], text: 'The Greyling gathers itself, low and grey.' },
    examine: 'A bit of the Grey that has decided to have a shape. It does not like your lantern.',
  },
  wolf: {
    name: 'Hushwood Wolf', sprite: 'wolf', level: 12, ai: 'beast',
    hp: 45, hit: [5, 7], attackEvery: 4, aggro: 6, leash: 10, respawn: 60, xp: 35,
    drops: [['wolf_pelt', 0.5, 1, 1]], gold: [3, 8],
    special: { every: 3, delay: 2, pattern: 'line', hit: [10, 13], text: 'The wolf drops low. It is going to charge.' },
    examine: 'It makes no sound on the needles. Neither does anything else in Hushwood.',
  },
  moss_spirit: {
    name: 'Moss Spirit', sprite: 'moss_spirit', level: 14, ai: 'grey',
    hp: 55, hit: [4, 6], attackEvery: 4, aggro: 5, leash: 8, respawn: 70, xp: 42,
    drops: [['moss_tuft', 0.4, 1, 2], ['grey_wisp', 0.3, 1, 1]], gold: [2, 6],
    special: { every: 3, delay: 3, pattern: 'ring', hit: [9, 12], text: 'The moss spirit swells. Spores drift around it.' },
    examine: 'Moss that has learned to walk, and has opinions about trespassers.',
  },
  stone_beetle: {
    name: 'Stone Beetle', sprite: 'stone_beetle', level: 18, ai: 'beast', moveEvery: 2,
    hp: 80, hit: [7, 9], attackEvery: 5, aggro: 4, leash: 8, respawn: 80, xp: 60,
    drops: [['beetle_shell', 0.5, 1, 1], ['scrap', 0.4, 1, 3]], gold: [5, 12],
    special: { every: 3, delay: 3, pattern: 'ring', hit: [14, 18], text: 'The beetle rears up. The ground around it is about to have a bad day.' },
    examine: 'Slow, heavy and mostly shell. The shell is the problem.',
  },
  pit_worm: {
    name: 'Pit Worm', sprite: 'pit_worm', level: 22, ai: 'beast', moveEvery: 0,
    hp: 70, hit: [9, 12], attackEvery: 4, aggro: 3, leash: 3, respawn: 70, xp: 70,
    drops: [['glimmer', 0.25, 1, 1], ['brass_bits', 0.4, 1, 2]], gold: [6, 12],
    special: { every: 2, delay: 2, pattern: 'plus', hit: [14, 18], text: 'The worm sinks back. Something is coming up under you.' },
    examine: 'It never leaves its hole. It does not need to.',
  },
  will_o_wisp: {
    name: 'Will-o\'-Wisp', sprite: 'will_o_wisp', level: 25, ai: 'grey', drainOil: 12,
    hp: 60, hit: [6, 8], attackEvery: 4, aggro: 6, leash: 10, respawn: 70, xp: 75,
    drops: [['grey_wisp', 0.8, 1, 2], ['glimmer', 0.2, 1, 1]], gold: [4, 10],
    special: { every: 3, delay: 3, pattern: 'plus', hit: [12, 15], text: 'The wisp flickers. Your lantern flickers with it.' },
    examine: 'A light that eats light. It is very interested in your lantern.',
  },
  bog_toad: {
    name: 'Bog Toad', sprite: 'bog_toad', level: 28, ai: 'beast', moveEvery: 2,
    hp: 120, hit: [11, 14], attackEvery: 5, aggro: 4, leash: 8, respawn: 90, xp: 95,
    drops: [['lily_bulb', 0.3, 1, 1], ['scrap', 0.3, 1, 3]], gold: [8, 16],
    special: { every: 3, delay: 3, pattern: 'bigplus', hit: [20, 26], text: 'The toad inflates. Everyone nearby should not be.' },
    examine: 'About the size of a cart, and twice as smug.',
  },
  drowned_pilgrim: {
    name: 'Drowned Pilgrim', sprite: 'drowned_pilgrim', level: 32, ai: 'grey',
    hp: 110, hit: [12, 15], attackEvery: 4, aggro: 5, leash: 9, respawn: 120, xp: 120,
    drops: [['greyglass', 0.35, 1, 1], ['grey_wisp', 0.5, 1, 2]], gold: [10, 20],
    special: { every: 3, delay: 3, pattern: 'ring', hit: [22, 28], text: 'The pilgrim lifts its lamp. Water rises around it.' },
    examine: 'It came here to pray a long time ago. It is still praying, to something else.',
  },
};
