// The Old Mill (Tag 5, Abstimmung „old-mill“): eine Wassermühle am Bach in Fernmeadow, westlich der Straße.
// Das Rad dreht sich von selbst, der Bach treibt es. Am Mühlstein (Objekt 'millstone', Aktion use = „Grind“)
// darf jeder mahlen, ohne Beruf: Was man im Beutel hat, wird nach der ersten passenden Regel gemahlen.
//   grinds: [{ inputs: { Gegenstand: Anzahl }, out: [Gegenstand, Anzahl], text }]  (Reihenfolge = Vorrang)
//   xp / xpPerLevel: Erfahrung beim ersten Mahlen am Tag (wie beim Ausguck).
// Quest-Aktion 'grind'. Hollis backt aus Mehl Millbread (Gespräch in content/npcs.js).
export const MILL = {
  grinds: [
    { inputs: { barley: 2 }, out: ['mill_flour', 1], text: 'You tip the barley into the hopper. The stones rumble, and flour sifts out into the tray, warm and pale.' },
  ],
  nothing: 'The stones turn and turn with nothing between them. They want barley: two handfuls make a sack of flour. Crows steal it from the fields, and Marrow sells it.',
  first: 'You knock the flour from your hands. Somebody built this mill a long time ago, and it is glad to be working again.',
  xp: 20,
  xpPerLevel: 4,
};
