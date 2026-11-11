// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 1,
  options: [
    { id: 'old-mill', text: 'An old mill turns somewhere in the Grey, and nobody is turning it.' },
    { id: 'fishing', text: 'The stream has fish, and someone should learn to catch them.' },
    { id: 'north-lookout', text: 'Build a lookout at the edge of Hushwood, to watch the light in the north.' },
    { id: 'beekeeper', text: 'A beekeeper moves to Kindle and wants the wild hives tamed.' },
  ],
};
