// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 9,
  options: [
    { id: 'hollis-kitchen', text: 'Hollis opens his kitchen: cook what you hunt and gather into food that helps.' },
    { id: 'walk-her-home', text: 'When Wenna goes north, Kindle sends lamps to walk her up to the lean-to.' },
    { id: 'maze-riddles', text: 'Riddle rooms in the Unending Maze, a new one every day, for those who think.' },
    { id: 'gallery-boss', text: 'Something big is still digging at the bottom of the glimmer galleries.' },
  ],
};
