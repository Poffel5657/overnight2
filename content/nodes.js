// Fundstellen für Sammelberufe. Stehen als Objekt { type: 'node', node: '<id>', x, y } in einem Gebiet.
//   prof / level: wer ab welcher Stufe sammeln darf.  yields: wie oft, bevor sie erschöpft ist.
//   item: Ertrag.  extra: [Gegenstand, Chance] als seltener Zusatzfund.  xp: Berufserfahrung pro Ertrag.
//   respawn: Takte, bis sie wieder voll ist (für alle Spieler gemeinsam).
//   look: Bauanleitung in src/render/objects.js.

export const NODES = {
  scrap_heap: { name: 'Scrap Heap', prof: 'salvage', level: 1, item: 'scrap', yields: 4, xp: 8, respawn: 60, look: 'heap', verb: 'Salvage' },
  rusted_cart: { name: 'Rusted Cart', prof: 'salvage', level: 4, item: 'scrap', extra: ['brass_bits', 0.3], yields: 4, xp: 13, respawn: 70, look: 'cart', verb: 'Salvage' },
  copper_seam: { name: 'Copper Seam', prof: 'salvage', level: 13, item: 'brass_bits', extra: ['glimmer', 0.25], yields: 4, xp: 26, respawn: 90, look: 'seam', verb: 'Salvage' },
  glimmer_vein: { name: 'Glimmer Vein', prof: 'salvage', level: 18, item: 'glimmer', yields: 3, xp: 34, respawn: 110, look: 'vein', verb: 'Salvage' },
  sunken_cache: { name: 'Sunken Cache', prof: 'salvage', level: 23, item: 'greyglass', extra: ['glimmer', 0.3], yields: 3, xp: 44, respawn: 120, look: 'cache', verb: 'Salvage' },
  // Tag 4, Nachschlag: das tiefe Flöz östlich des Old Shaft (zwischen den Seam Lurkern). Cinder Iron ohne Anteil und ohne Kampf, wenn man vorsichtig ist.
  deep_seam: { name: 'Deep Seam', prof: 'salvage', level: 32, item: 'cinder_iron', extra: ['glimmer', 0.3], yields: 2, xp: 64, respawn: 160, look: 'vein', verb: 'Salvage' },
  // Tag 4, Nachschlag: Foraging 30, am Nordrand von Hushwood, wo es nachts nach fremdem Rauch riecht. Zutaten für die Hearthroot Salve.
  ember_thicket: { name: 'Ember Thicket', prof: 'foraging', level: 30, item: 'emberroot', extra: ['nightcap', 0.35], yields: 4, xp: 60, respawn: 140, look: 'ember', verb: 'Forage' },
  // Tag 4, Nachschlag: Cartography 30. Die Vermessungspflöcke von Bracks Großvater am alten Flöz; manchmal steckt Eisen daran.
  seam_stake: { name: 'Old Survey Stake', prof: 'cartography', level: 30, item: 'survey_notes', extra: ['cinder_iron', 0.15], yields: 4, xp: 60, respawn: 140, look: 'waymark', verb: 'Survey' },
  // Tag 5, Nachschlag: in den Sumps unter Cinderford (Stufe 36 bis 38). Verdigris ohne Kampf, wenn man leise ist.
  // Nachschlag Tag 9: die tiefe Glimmer-Ader in den Glimmer Galleries (Salvage 44)
  deep_lode: { name: 'Deep Lode', prof: 'salvage', level: 44, item: 'lode_glimmer', extra: ['glimmer', 0.5], yields: 3, xp: 84, respawn: 170, look: 'vein', verb: 'Salvage' },
  verdigris_pipe: { name: 'Verdigris Pipe', prof: 'salvage', level: 38, item: 'verdigris', extra: ['cinder_iron', 0.2], yields: 3, xp: 72, respawn: 160, look: 'vein', verb: 'Salvage' },
  sluice_mark: { name: 'Sluice-Keeper\'s Mark', prof: 'cartography', level: 36, item: 'survey_notes', extra: ['verdigris', 0.25], yields: 4, xp: 70, respawn: 150, look: 'waymark', verb: 'Survey' },
  // Tag 8: Torfstiche an der Steinstraße (Foraging 33). Torf ist Brennstoff für das Leuchtfeuer und wird zu Peat Oil.
  peat_cut: { name: 'Peat Cut', prof: 'foraging', level: 33, item: 'peat_brick', extra: ['moss_tuft', 0.3], yields: 4, xp: 64, respawn: 140, look: 'moss', verb: 'Cut peat' },
  // Tag 8, Nachschlag: Wegzeichen der Träger an der Steinstraße (Cartography 34): Kerben im Fels, die zählen, wie weit es noch ist
  carrier_notch: { name: 'Carrier\'s Notch', prof: 'cartography', level: 34, item: 'survey_notes', extra: ['hollow_bead', 0.15], yields: 4, xp: 66, respawn: 140, look: 'waymark', verb: 'Read' },
  lampcap_cluster: { name: 'Lampcap Cluster', prof: 'foraging', level: 36, item: 'nightcap', extra: ['lily_bulb', 0.35], yields: 4, xp: 70, respawn: 150, look: 'shrooms', verb: 'Forage' },
  old_shaft: { name: 'Old Shaft', prof: 'salvage', level: 26, item: 'glimmer', extra: ['greyglass', 0.2], yields: 3, xp: 52, respawn: 130, look: 'vein', verb: 'Salvage' },
  brass_wreck: { name: 'Brass Wreck', prof: 'salvage', level: 8, item: 'brass_bits', extra: ['glimmer', 0.12], yields: 3, xp: 18, respawn: 90, look: 'wreck', verb: 'Salvage' },
  bitterleaf_patch: { name: 'Bitterleaf', prof: 'foraging', level: 1, item: 'bitterleaf', yields: 4, xp: 8, respawn: 50, look: 'herbs', verb: 'Forage' },
  wild_hive: { name: 'Wild Hive', prof: 'foraging', level: 3, item: 'wax_comb', yields: 3, xp: 12, respawn: 70, look: 'hive', verb: 'Forage' },
  emberroot_patch: { name: 'Emberroot', prof: 'foraging', level: 7, item: 'emberroot', yields: 3, xp: 18, respawn: 90, look: 'ember', verb: 'Forage' },
  moss_bloom: { name: 'Moss Bloom', prof: 'foraging', level: 12, item: 'moss_tuft', yields: 4, xp: 24, respawn: 90, look: 'moss', verb: 'Forage' },
  nightcap_ring: { name: 'Nightcap Ring', prof: 'foraging', level: 17, item: 'nightcap', yields: 3, xp: 32, respawn: 100, look: 'shrooms', verb: 'Forage' },
  bog_lily: { name: 'Bog Lily', prof: 'foraging', level: 22, item: 'lily_bulb', yields: 3, xp: 42, respawn: 110, look: 'lily', verb: 'Forage' },
  drowned_garden: { name: 'Drowned Garden', prof: 'foraging', level: 26, item: 'nightcap', extra: ['lily_bulb', 0.35], yields: 3, xp: 52, respawn: 130, look: 'shrooms', verb: 'Forage' },
  waymark: { name: 'Old Waymark', prof: 'cartography', level: 1, item: 'survey_notes', yields: 3, xp: 10, respawn: 80, look: 'waymark', verb: 'Survey' },
  cairn: { name: 'Forest Cairn', prof: 'cartography', level: 12, item: 'survey_notes', extra: ['moss_tuft', 0.2], yields: 4, xp: 24, respawn: 100, look: 'waymark', verb: 'Survey' },
  survey_stone: { name: 'Survey Stone', prof: 'cartography', level: 18, item: 'survey_notes', extra: ['glimmer', 0.15], yields: 4, xp: 34, respawn: 110, look: 'waymark', verb: 'Survey' },
  north_cairn: { name: 'North Cairn', prof: 'cartography', level: 26, item: 'survey_notes', extra: ['green_shard', 0.25], yields: 4, xp: 52, respawn: 130, look: 'waymark', verb: 'Survey' },
  ruin_marker: { name: 'Ruin Marker', prof: 'cartography', level: 24, item: 'survey_notes', extra: ['greyglass', 0.12], yields: 4, xp: 44, respawn: 120, look: 'signpost', verb: 'Survey' },
  leaning_post: { name: 'Leaning Signpost', prof: 'cartography', level: 6, item: 'survey_notes', extra: ['glimmer', 0.08], yields: 4, xp: 16, respawn: 90, look: 'signpost', verb: 'Survey' },
};
