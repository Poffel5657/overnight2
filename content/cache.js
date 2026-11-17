// Die Vorratskiste am ersten Stein (Tag 7, Abstimmung „bread-north“): Kindle schickt Brot und Öl nach Norden,
// für die Träger, die noch gehen. Objekt 'cache' (Aktion use = „Leave supplies“) am ersten Steinmann nördlich
// des Ausgucks. Man legt alles, was die Kiste nimmt, auf einmal hinein; jeder Gegenstand zählt so viele Punkte
// (accepts). Die Punkte sammeln sich im Spielstand (sentNorth, Bedingung sentNorth: n). Das erste Hinterlegen am
// Tag gibt Erfahrung (Schlüssel cache:<datum> in dailyOf().chests) und eine Zeile für alle im Gebiet.
// Quest-Aktion 'cache'. Brennholz nimmt die Kiste nicht: das gehört auf Amas Stapel.
export const CACHE = {
  accepts: { bread: 1, night_bread: 1, millbread: 2, hollow_ration: 2, lamp_oil: 2, fens_drawing: 1 },
  // Antwort aus dem Norden: Wer schon so viel hinterlegt hat, findet beim ersten Mal am Tag mit dieser Chance etwas im Kasten.
  answerFrom: 10,
  answerChance: 0.35,
  answer: { item: 'hollow_ration', n: 1, text: 'Under the lid, in the corner where nothing of yours was, somebody has left a small loaf wrapped in birch bark. It smells of peat smoke.' },
  // Höchstens so viele Stück pro Sorte und Besuch (damit niemand aus Versehen seinen ganzen Ölvorrat hineinlegt)
  maxEach: 5,
  // Wennas Dank (Quest „A Week of Bread“): ab so vielen Punkten insgesamt
  week: 30,
  xp: 20,
  xpPerLevel: 5,
  nothing: 'An oak box under the first cairn, lid weighted with a flat stone. Somebody has painted a loaf on it, and an arrow pointing north. It takes bread and lamp oil. Wood goes on Ama\'s pile.',
  first: 'You hear Brindle call down from the Watch: "Saw that. Writing it in the book."',
  all: 'Somebody has left bread at the first stone, for the carriers.',
};
