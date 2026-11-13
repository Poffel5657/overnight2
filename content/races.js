// Schneckenrennen auf der Wiese südwestlich vom Markt (ein Wunsch aus der Kapelle). Mabb nimmt Wetten an.
//   region / keeper: wo das Rennen läuft und wer die Wetten annimmt (Figur im Gebiet).
//   every: Takte vom Ende eines Rennens bis zum Start des nächsten.  stepEvery: Takte pro Zug.
//   startX / finishX: Bahn; jede Schnecke läuft auf ihrer eigenen Reihe (Figur snail_<id> im Gebiet).
//   watch: Felder um Mabb, in denen man das Rennen mitbekommt.  stakes: Einsätze in Gold.
//   snails: odds = Auszahlung (Einsatz mal odds), pace = Chance pro Zug auf ein Feld, burst = auf zwei.
//   Abgestimmt (tests/night/001-snail-races.test.mjs): Auf lange Sicht bekommt Mabb etwas mehr, als er auszahlt.
//   Seit Tag 3 laufen fünf Schnecken; die Quoten sind dafür neu abgestimmt (Erwartung je Schnecke 0,91 bis 0,96).
//   cup: Seit Tag 3 (Abstimmung) ist am Wochenende Cup Day: Mabb nimmt dann zusätzlich den Einsatz cup.stake an.
//        days = Wochentage nach Berliner Datum (0 = Sonntag, 6 = Samstag). Gewonnene Wetten zählen für „The Snail Cup“.
export const RACE = {
  region: 'kindle',
  keeper: 'mabb',
  every: 100,
  stepEvery: 3,
  startX: 42,
  finishX: 48,
  watch: 14,
  stakes: [5, 20],
  cup: { days: [0, 6], stake: 50 },
  snails: {
    bramble: { name: 'Bramble', odds: 3, pace: 0.545, burst: 0, text: 'Steady as a fence post, and about as quick.' },
    pebble: { name: 'Pebble', odds: 4, pace: 0.28, burst: 0.1, text: 'Fast when she remembers she is racing.' },
    tom: { name: 'Old Tom', odds: 5, pace: 0.12, burst: 0.15, text: 'Mostly asleep. Occasionally a rocket.' },
    // Seit Tag 3 (Snail Cup): zwei neue Schnecken auf zwei neuen Bahnen
    duchess: { name: 'Duchess', odds: 6, pace: 0.315, burst: 0.06, text: 'Came from Cinderford in a hatbox. Will not race in the rain.' },
    thistle: { name: 'Thistle', odds: 8, pace: 0.1, burst: 0.13, text: 'Tiny, prickly and absolutely sure she is a horse.' },
  },
};

// Cup Day: am Wochenende (Berliner Datum 'YYYY-MM-DD').
export function isCupDay(date) {
  if (!date) return false;
  return RACE.cup.days.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}
