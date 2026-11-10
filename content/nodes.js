// Fundstellen für Sammelberufe. Stehen als Objekt { type: 'node', node: '<id>', x, y } in einem Gebiet.
//   prof / level: wer ab welcher Stufe sammeln darf.  yields: wie oft, bevor sie erschöpft ist.
//   item: Ertrag.  extra: [Gegenstand, Chance] als seltener Zusatzfund.  xp: Berufserfahrung pro Ertrag.
//   respawn: Takte, bis sie wieder voll ist (für alle Spieler gemeinsam).
//   look: Bauanleitung in src/render/objects.js.

export const NODES = {
  scrap_heap: { name: 'Scrap Heap', prof: 'salvage', level: 1, item: 'scrap', yields: 4, xp: 8, respawn: 60, look: 'heap', verb: 'Salvage' },
  rusted_cart: { name: 'Rusted Cart', prof: 'salvage', level: 4, item: 'scrap', extra: ['brass_bits', 0.3], yields: 4, xp: 13, respawn: 70, look: 'cart', verb: 'Salvage' },
  brass_wreck: { name: 'Brass Wreck', prof: 'salvage', level: 8, item: 'brass_bits', extra: ['glimmer', 0.12], yields: 3, xp: 18, respawn: 90, look: 'wreck', verb: 'Salvage' },
  bitterleaf_patch: { name: 'Bitterleaf', prof: 'foraging', level: 1, item: 'bitterleaf', yields: 4, xp: 8, respawn: 50, look: 'herbs', verb: 'Forage' },
  wild_hive: { name: 'Wild Hive', prof: 'foraging', level: 3, item: 'wax_comb', yields: 3, xp: 12, respawn: 70, look: 'hive', verb: 'Forage' },
  emberroot_patch: { name: 'Emberroot', prof: 'foraging', level: 7, item: 'emberroot', yields: 3, xp: 18, respawn: 90, look: 'ember', verb: 'Forage' },
  waymark: { name: 'Old Waymark', prof: 'cartography', level: 1, item: 'survey_notes', yields: 3, xp: 10, respawn: 80, look: 'waymark', verb: 'Survey' },
  leaning_post: { name: 'Leaning Signpost', prof: 'cartography', level: 6, item: 'survey_notes', extra: ['glimmer', 0.08], yields: 4, xp: 16, respawn: 90, look: 'signpost', verb: 'Survey' },
};
