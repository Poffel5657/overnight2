// Händler: welche Figur was verkauft. Verkaufen kann man bei jedem Händler alles mit value (zum halben Preis).
// Kaufen kostet BUY_MARKUP mal value: Händler sollen teuer sein, Handwerk und Handel sich lohnen.
export const BUY_MARKUP = 2.5;
export function buyPrice(value) {
  return Math.ceil(value * BUY_MARKUP);
}
export const SHOPS = {
  marrow: { name: "Marrow's Stall", npc: 'marrow', sells: ['bread', 'lamp_oil', 'tin_lantern', 'scrap_hood', 'scrap_boots'] },
};
