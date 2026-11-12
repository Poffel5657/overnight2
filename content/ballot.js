// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 2,
  options: [
    { id: 'old-mill', text: 'An old mill turns somewhere in the Grey, and nobody is turning it.' },
    { id: 'fishing', text: 'The stream has fish, and someone should learn to catch them.' },
    { id: 'beekeeper', text: 'A beekeeper moves to Kindle and wants the wild hives tamed.' },
    { id: 'snail-cup', text: 'Mabb wants a proper Snail Cup, with a trophy and two new snails.' },
  ],
};
