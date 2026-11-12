// Händler: welche Figur was verkauft. Verkaufen kann man bei jedem Händler alles mit value (zum halben Preis).
// night: true = hat nur nach Einbruch der Dunkelheit geöffnet (Tageslicht unter 0,5).
// rotating: { pool, perDay } = zusätzlich zu sells jeden Tag (Berliner Datum) perDay Dinge aus pool,
//           für alle gleich (shopStock). Alles im pool braucht noch einen anderen Fundort.
// Kaufen kostet BUY_MARKUP mal value: Händler sollen teuer sein, Handwerk und Handel sich lohnen.
export const BUY_MARKUP = 2.5;
export function buyPrice(value) {
  return Math.ceil(value * BUY_MARKUP);
}
export const SHOPS = {
  mothwick: {
    name: 'The Night Market', npc: 'mothwick', night: true, sells: ['moth_lantern', 'moonwick', 'night_bread', 'lamp_oil'],
    // Seit Tag 2: jede Nacht zwei andere Dinge „aus dem Norden“
    rotating: { perDay: 2, pool: ['glow_draught', 'dusk_draught', 'moss_salve', 'flare_candle', 'lily_oil', 'nightcap', 'emberroot', 'survey_notes', 'glimmer', 'green_shard', 'wisp_core'] },
  },
  hollis: { name: 'The Lantern & Lark', npc: 'hollis', sells: ['hearth_stew', 'ember_ale', 'bread', 'lamp_oil'] },
  // Seit 2026-11-13: Hesk in Cinderford (Ausrüstung gegen Turnstones im Gespräch)
  hesk: { name: "Hesk's Stall", npc: 'hesk', sells: ['lamp_oil', 'cinder_cake', 'bitter_tonic', 'moss_salve'] },
  marrow: { name: "Marrow's Stall", npc: 'marrow', sells: ['bread', 'lamp_oil', 'tin_lantern', 'scrap_hood', 'scrap_boots'] },
};

// Was ein Händler an einem Tag (Berliner Datum) verkauft: feste Ware plus die wechselnde des Tages.
export function shopStock(id, date) {
  const s = SHOPS[id];
  if (!s) return [];
  if (!s.rotating) return s.sells;
  const pool = s.rotating.pool;
  let h = 2166136261;
  for (const c of `${id}:${date}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const extra = [];
  for (let i = 0; extra.length < Math.min(s.rotating.perDay, pool.length) && i < 100; i++) {
    h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0;
    const it = pool[h % pool.length];
    if (!extra.includes(it)) extra.push(it);
  }
  return [...s.sells, ...extra];
}
