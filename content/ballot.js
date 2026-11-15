// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 5,
  options: [
    { id: 'cooking', text: 'Hollis teaches cooking: hot food that heals and keeps you warm at night.' },
    { id: 'north-road-fires', text: 'Signal fires along the north road, so night walkers have somewhere to stop.' },
    { id: 'beacon-stockpile', text: 'Ama builds a woodpile for the Beacon that everyone can fill together.' },
    { id: 'lightsworn', text: 'A sworn path of light for Wardens at level 50: shield, lamp and a vow.' },
  ],
};
