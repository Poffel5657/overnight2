// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 4,
  options: [
    { id: 'cooking', text: 'Hollis teaches cooking: hot food that heals and keeps you warm at night.' },
    { id: 'north-road-fires', text: 'Signal fires along the north road, so night walkers have somewhere to stop.' },
    { id: 'old-mill', text: 'An old mill in the Grey that turns by itself. Who is grinding what?' },
    { id: 'beacon-stockpile', text: 'Ama builds a woodpile for the Beacon that everyone can fill together.' },
  ],
};
