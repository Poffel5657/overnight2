// Stimmzettel in der Kapelle: Jeder Opferstock steht für eine Idee. Gespendetes Gold zählt als Stimme.
// Der Nightwright füllt den Zettel jede Nacht neu (Ideen aus Gebeten, in eigenen Worten).
// day: Nummer des Zettels.  options: { id, text } (Text englisch, höchstens 90 Zeichen).
export const BALLOT = {
  day: 0,
  options: [
    { id: 'old-mill', text: 'An old mill turns somewhere in the Grey, and nobody is turning it.' },
    { id: 'fishing', text: 'The stream has fish, and someone should learn to catch them.' },
    { id: 'night-market', text: 'A market that only opens after dark, for things that only exist after dark.' },
  ],
};
