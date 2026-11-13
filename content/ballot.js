// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 3,
  options: [
    { id: 'beekeeper', text: 'A beekeeper moves to Kindle and wants the wild hives tamed.' },
    { id: 'cooking', text: 'Hollis teaches cooking: hot food that heals and keeps you warm at night.' },
    { id: 'north-road-fires', text: 'Signal fires along the north road, so night walkers have somewhere to stop.' },
    { id: 'rook-masterwork', text: 'Old Rook moves indoors and teaches masterwork recipes at his own bench.' },
  ],
};
