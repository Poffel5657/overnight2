// Stimmzettel am Altar: ein weißer Stimmstein pro Spieler und Tag für eine der Ideen (Gold zählt nicht).
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 6,
  options: [
    { id: 'bread-north', text: 'Send bread and oil north along the stones, for the carriers who still walk.' },
    { id: 'bar-north-road', text: 'Bar the north road at night, so nothing hungry walks into Kindle.' },
    { id: 'cup-ladder', text: 'Mabb keeps a ladder of Snail Cup winners, with a prize for the best.' },
    { id: 'chapel-riddle-room', text: 'A locked room in the Drowned Chapel that opens only for a group that thinks.' },
  ],
};
