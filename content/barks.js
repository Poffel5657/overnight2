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
};
export const HAIL_DEFAULT = 'You there! A word?';
