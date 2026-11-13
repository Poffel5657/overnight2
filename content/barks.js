// Rufe: Figuren sagen von selbst etwas, als Sprechblase über dem Kopf (nur im Browser, ohne Server).
// Bewusst sparsam, damit es nicht nervt:
// - Der Crier ruft regelmäßig (das ist sein Beruf). news: zuerst die letzte Nacht und das Leuchtfeuer.
// - Wer eine Quest für dich hat ("!"), ruft einmal, wenn du vorbeigehst (hail), dann lange Ruhe.
// range: Felder. every: Sekunden zwischen zwei Rufen (ungefähr). Der Nightwright kann Zeilen ergänzen.

export const BARKS = {
  pell: {
    range: 14, every: 25, news: true, shout: true,
    lines: [
      'HEAR YE! Feed the Beacon before midnight!',
      'Favours on the notice board! Gold for honest work!',
      'Pray at the chapel, and the world may answer!',
      'The Night Market opens at dusk! Bring gold, and a lantern!',
      'Snail races by the west path! Mabb takes bets!',
      'The Lantern & Lark is open! Beds, stew and the Damp Socks!',
      'A lookout stands at the top of the north road! Brindle is watching!',
      'Wolves on the north-west fields! Warden Ama wants them sent home!',
      'Something new at the Night Market every night! Only after dark!',
      'Brack says the Old Foreman is still working! Somebody tell him!',
      'The old road west is back! Cinderford is at the end of it, and a maze under it!',
      'The Counting House is open! Coyne sells shares in Kindle! Your gold, working for you!',
      'The Snail Cup is here! Two new snails! Cup Day every weekend!',
      'Lights on the north edge at night! Brindle wants to know who is carrying them!',
      'Rook\'s workshop doubled in size! He still works in the yard!',
    ],
  },
  band_corra: {
    range: 9, every: 20,
    lines: ['*fiddles a quick jig*', 'One more! One more!', '*the fiddle squeaks, on purpose*', 'This one is called The Lark\'s Jig!'],
  },
  band_oswin: {
    range: 9, every: 26,
    lines: ['*drums on whatever is nearest*', 'Ba-dum, tss.', 'Everybody clap! No? Fine.'],
  },
  band_pip: {
    range: 9, every: 31,
    lines: ['*a thin, happy tune on the pipe*', '*toot*', 'There is a light in the north... la la...', '...and Brindle is watching it... la la...'],
  },
  brindle: {
    range: 8, every: 50,
    lines: [
      'Wind from the north again. Smells of smoke.',
      '*scribbles in a little book*',
      'Another wolf, running south. That makes nine today.',
      'Brighter than Tuesday. I am sure of it.',
      'Lamps on the tree line again. Five. No, four.',
    ],
  },
  hesk: {
    range: 8, every: 40,
    lines: ['Oil! Chalk! Cake! Rope!', 'Gear for turnstones, gold for everything else.', '*counts rope under his breath*'],
  },
  coyne: {
    range: 6, every: 50,
    lines: ['*counts under her breath*', 'Forty-one, forty-two... who moved that coin?', 'Shares in Kindle! Gold that comes back!'],
  },
  tansy: {
    range: 6, every: 55,
    lines: ['*tightens something that did not need tightening*', 'Rook! It is raining! ...no? Fine.', 'Mind the gears, they are in order.'],
  },
  sorrel: {
    range: 8, every: 45,
    lines: ['Who is going down?', 'Twelve down, eleven up. Where is number twelve?', 'The walls turned well last night. Lots of corners.'],
  },
  mabb: {
    range: 10, every: 45,
    lines: [
      'Bets on the snails! Five gold, twenty gold!',
      'Bramble is in fine form today. Probably.',
      'Old Tom is not asleep. He is thinking.',
      'Duchess will not race if anyone is rude about her hat.',
      'Thistle thinks she is a horse. Do not tell her.',
      'Win three and the Cup is yours! I have spares!',
    ],
  },
};

// Zuruf von Figuren mit einer Quest für dich: einmal beim Vorbeigehen.
export const HAIL_RANGE = 5;
export const HAIL_COOLDOWN = 120; // Sekunden pro Figur
export const HAILS = {
  ama: 'You there! The Beacon needs hands that hold a light.',
  tallow: 'Traveller! A word, if you have a moment.',
  rook: 'Psst. You look useful. Come here.',
  wren: 'Hey! Got a minute? I need something.',
  fen: 'You! Yes, you. I have a job for a pair of boots.',
  stranger: '...you. Come closer.',
  marrow: 'Oi! Business for you, if you want it.',
  haskel: 'Over here! I could use some help.',
  brack: 'Hold up, wanderer. I have work.',
  brindle: 'You! Got two hands and a head for heights?',
  mabb: 'You there! Fancy a flutter on a snail?',
  mothwick: 'Psst. Wicks, lanterns, night things. Only while it lasts.',
  sorrel: 'Kindle! Over here. The Maze is hiring.',
  ivy: 'You. Yes. Do you have steady hands?',
  band_corra: 'Psst! Did you hear about the west road?',
  coyne: 'You there. Yes, you, with the purse. A moment.',
  tansy: 'Hey! Want to learn the trade? Inside, where it is dry.',
};
export const HAIL_DEFAULT = 'You there! A word?';
