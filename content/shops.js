// Händler: welche Figur was verkauft. Verkaufen kann man bei jedem Händler alles mit value (zum halben Preis).
// night: true = hat nur nach Einbruch der Dunkelheit geöffnet (Tageslicht unter 0,5).
// Kaufen kostet BUY_MARKUP mal value: Händler sollen teuer sein, Handwerk und Handel sich lohnen.
export const BUY_MARKUP = 2.5;
export function buyPrice(value) {
  return Math.ceil(value * BUY_MARKUP);
}
export const SHOPS = {
  mothwick: { name: 'The Night Market', npc: 'mothwick', night: true, sells: ['moth_lantern', 'moonwick', 'night_bread', 'lamp_oil'] },
  hollis: { name: 'The Lantern & Lark', npc: 'hollis', sells: ['hearth_stew', 'ember_ale', 'bread', 'lamp_oil'] },
  marrow: { name: "Marrow's Stall", npc: 'marrow', sells: ['bread', 'lamp_oil', 'tin_lantern', 'scrap_hood', 'scrap_boots'] },
};
