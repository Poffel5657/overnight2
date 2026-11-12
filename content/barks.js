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
    lines: ['*a thin, happy tune on the pipe*', '*toot*', 'There is a light in the north... la la...'],
  },
  mabb: {
    range: 10, every: 45,
    lines: [
      'Bets on the snails! Five gold, twenty gold!',
      'Bramble is in fine form today. Probably.',
      'Old Tom is not asleep. He is thinking.',
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
  mabb: 'You there! Fancy a flutter on a snail?',
  mothwick: 'Psst. Wicks, lanterns, night things. Only while it lasts.',
};
export const HAIL_DEFAULT = 'You there! A word?';
