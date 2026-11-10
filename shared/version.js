// Version von Server und Seite: Prüfsumme über shared/, content/ und worker/ (tools/build-sig.mjs).
// Beim Anmelden verglichen: Ist der Server älter als die Seite, startet sein Gebietsraum neu;
// ist die Seite älter, bekommt der Spieler den Hinweis, neu zu laden.
export { BUILD as CONTENT_SIG } from './build.js';
