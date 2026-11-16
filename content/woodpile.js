// Ama's Woodpile (Tag 6, Abstimmung „beacon-stockpile“): ein Holzstapel neben dem Leuchtfeuer, den alle zusammen füllen.
// Totholz (Objekt 'deadfall', Aktion use = „Split“) liegt am Waldrand; jeder darf es ohne Beruf spalten,
// einmal am Tag pro Stelle und Spieler (logs Scheite). Am Stapel (Objekt 'woodpile', Aktion use = „Stack“)
// legt man alle Split Logs auf einmal nach: Sie zählen für den Tageszähler des Leuchtfeuers (BEACON_FUEL),
// und der Stapel wird im Bild höher, je voller der Tag ist (src/render/objects.js, setPile).
//   log: der Gegenstand.  logs: Scheite pro Totholz und Tag.  xp / xpPerLevel: Erfahrung beim ersten Stapeln am Tag.
// Quest-Aktionen 'split' und 'stack'. Ein Vorrat über mehrere Tage bräuchte einen dauerhaften Weltzähler (nur mit Chris).
export const WOODPILE = {
  // Amas Zähltafel: ab so vielen Scheiten insgesamt (Spielstand stacked) gibt es „Ama's Tally“
  tally: 40,
  log: 'split_log',
  logs: 2,
  split: 'You set your boot on the deadfall and break it into lengths. Dry, old, and it will burn like it has been waiting to.',
  spent: 'You have already split what is dry here today. The rest is wet through. Tomorrow.',
  nothing: 'Ama\'s woodpile, stacked bark-up so the rain runs off. Bring split logs: deadfall lies at the edge of the woods, and anybody can break it.',
  first: 'Ama chalks a line on the tally board by the pile, without looking up. "That one is yours."',
  xp: 15,
  xpPerLevel: 4,
};
