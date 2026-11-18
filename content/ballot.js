// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 8,
  options: [
    { id: 'cup-ladder', text: 'Mabb keeps a ladder of Snail Cup winners, with a prize for the best.' },
    { id: 'chapel-riddle-room', text: 'A locked room in the Drowned Chapel that opens only for a group that thinks.' },
    { id: 'hollis-kitchen', text: 'Hollis opens his kitchen: cook what you hunt and gather into food that helps.' },
    { id: 'carriers-rest', text: 'Rebuild the carriers\' lean-to at the top of the Stone Road, so anyone can rest there.' },
  ],
};
