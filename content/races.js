// Schneckenrennen auf der Wiese südwestlich vom Markt (ein Wunsch aus der Kapelle). Mabb nimmt Wetten an.
//   region / keeper: wo das Rennen läuft und wer die Wetten annimmt (Figur im Gebiet).
//   every: Takte vom Ende eines Rennens bis zum Start des nächsten.  stepEvery: Takte pro Zug.
//   startX / finishX: Bahn; jede Schnecke läuft auf ihrer eigenen Reihe (Figur snail_<id> im Gebiet).
//   watch: Felder um Mabb, in denen man das Rennen mitbekommt.  stakes: Einsätze in Gold.
//   snails: odds = Auszahlung (Einsatz mal odds), pace = Chance pro Zug auf ein Feld, burst = auf zwei.
//   Abgestimmt (tests/night/001-snail-races.test.mjs): Auf lange Sicht bekommt Mabb etwas mehr, als er auszahlt.
export const RACE = {
  region: 'kindle',
  keeper: 'mabb',
  every: 100,
  stepEvery: 3,
  startX: 42,
  finishX: 48,
  watch: 14,
  stakes: [5, 20],
  snails: {
    bramble: { name: 'Bramble', odds: 2, pace: 0.56, burst: 0, text: 'Steady as a fence post, and about as quick.' },
    pebble: { name: 'Pebble', odds: 3, pace: 0.29, burst: 0.1, text: 'Fast when she remembers she is racing.' },
    tom: { name: 'Old Tom', odds: 4, pace: 0.12, burst: 0.155, text: 'Mostly asleep. Occasionally a rocket.' },
  },
};
