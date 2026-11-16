// Rezepte für Herstellberufe. Man stellt an der passenden Station her (content/professions.js).
//   prof / level: wer ab welcher Stufe.  inputs: { Gegenstand: Anzahl }.  out: [Gegenstand, Anzahl].
//   xp: Berufserfahrung.

// Ab diesem Schritt der Quest „Rook's Masterwork“ darf man Meisterstücke (master: true) herstellen.
export const MASTERWORK_STEP = 3;

export const RECIPES = {
  // Tinkering (Werkbank)
  t_scrap_hood: { prof: 'tinkering', level: 1, inputs: { scrap: 2 }, out: ['scrap_hood', 1], xp: 10 },
  t_scrap_boots: { prof: 'tinkering', level: 1, inputs: { scrap: 2 }, out: ['scrap_boots', 1], xp: 10 },
  t_scrap_shivs: { prof: 'tinkering', level: 2, inputs: { scrap: 3 }, out: ['scrap_shivs', 1], xp: 14 },
  t_scrap_shield: { prof: 'tinkering', level: 2, inputs: { scrap: 4 }, out: ['scrap_shield', 1], xp: 14 },
  t_scrap_coat: { prof: 'tinkering', level: 3, inputs: { scrap: 4, crow_feather: 1 }, out: ['scrap_coat', 1], xp: 18 },
  t_ruff_hood: { prof: 'tinkering', level: 6, inputs: { singed_tuft: 3, scrap: 2 }, out: ['ruff_hood', 1], xp: 24 },
  t_brass_hood: { prof: 'tinkering', level: 8, inputs: { brass_bits: 3 }, out: ['brass_hood', 1], xp: 30 },
  t_brass_boots: { prof: 'tinkering', level: 8, inputs: { brass_bits: 3 }, out: ['brass_boots', 1], xp: 30 },
  t_brass_shivs: { prof: 'tinkering', level: 9, inputs: { brass_bits: 3, scrap: 2 }, out: ['brass_shivs', 1], xp: 36 },
  t_brass_shield: { prof: 'tinkering', level: 9, inputs: { brass_bits: 4, scrap: 2 }, out: ['brass_shield', 1], xp: 36 },
  t_brass_coat: { prof: 'tinkering', level: 11, inputs: { brass_bits: 5, crow_feather: 2 }, out: ['brass_coat', 1], xp: 44 },

  t_glim_hood: { prof: 'tinkering', level: 13, inputs: { brass_bits: 2, glimmer: 1 }, out: ['glim_hood', 1], xp: 56 },
  t_glim_boots: { prof: 'tinkering', level: 14, inputs: { brass_bits: 2, glimmer: 1 }, out: ['glim_boots', 1], xp: 60 },
  t_glim_shivs: { prof: 'tinkering', level: 15, inputs: { brass_bits: 3, glimmer: 2 }, out: ['glim_shivs', 1], xp: 70 },
  t_glim_shield: { prof: 'tinkering', level: 15, inputs: { brass_bits: 4, glimmer: 2 }, out: ['glim_shield', 1], xp: 70 },
  t_glim_coat: { prof: 'tinkering', level: 17, inputs: { brass_bits: 3, glimmer: 1, wolf_pelt: 2 }, out: ['glim_coat', 1], xp: 80 },
  // Tag 3: die Wickel der Träger nachbauen (Wolfsfell, Messing, ein Wisp für das Lämpchen am Knöchel)
  t_carriers_wraps: { prof: 'tinkering', level: 18, inputs: { wolf_pelt: 2, brass_bits: 2, grey_wisp: 1 }, out: ['carriers_wraps', 1], xp: 86 },
  t_shell_coat: { prof: 'tinkering', level: 20, inputs: { beetle_shell: 4, brass_bits: 2 }, out: ['shell_coat', 1], xp: 95 },
  t_greyglass_hood: { prof: 'tinkering', level: 24, inputs: { greyglass: 2, glimmer: 1 }, out: ['greyglass_hood', 1], xp: 120 },
  t_greyglass_boots: { prof: 'tinkering', level: 24, inputs: { greyglass: 2, glimmer: 1 }, out: ['greyglass_boots', 1], xp: 120 },
  t_greyglass_shivs: { prof: 'tinkering', level: 26, inputs: { greyglass: 3, glimmer: 2 }, out: ['greyglass_shivs', 1], xp: 140 },
  t_greyglass_shield: { prof: 'tinkering', level: 26, inputs: { greyglass: 4, glimmer: 2 }, out: ['greyglass_shield', 1], xp: 140 },
  t_wraithsilk_hood: { prof: 'tinkering', level: 30, inputs: { greyglass: 2, sodden_hymnal: 2, glimmer: 1 }, out: ['wraithsilk_hood', 1], xp: 180 },
  t_wardstone_boots: { prof: 'tinkering', level: 31, inputs: { greyglass: 2, beetle_shell: 2, glimmer: 1 }, out: ['wardstone_boots', 1], xp: 190 },
  // Tag 4 (Abstimmung): Rooks Meisterstücke. master: nur an einer Werkbank mit master (Rooks gute Bank in der
  // Werkstatt) und erst, wenn Rook es gezeigt hat (Quest „Rook's Masterwork“ ab Schritt 3).
  t_mw_hood: { prof: 'tinkering', level: 32, master: true, inputs: { cinder_iron: 2, glimmer: 2 }, out: ['masterwork_hood', 1], xp: 210 },
  t_mw_boots: { prof: 'tinkering', level: 33, master: true, inputs: { cinder_iron: 2, beetle_shell: 2 }, out: ['masterwork_boots', 1], xp: 220 },
  t_mw_shivs: { prof: 'tinkering', level: 34, master: true, inputs: { cinder_iron: 3, greyglass: 2 }, out: ['masterwork_shivs', 1], xp: 240 },
  t_mw_shield: { prof: 'tinkering', level: 35, master: true, inputs: { cinder_iron: 4, greyglass: 2 }, out: ['masterwork_shield', 1], xp: 250 },
  t_mw_coat: { prof: 'tinkering', level: 37, master: true, inputs: { cinder_iron: 4, greyglass: 2, wolf_pelt: 2 }, out: ['masterwork_coat', 1], xp: 280 },
  // Tag 5 (Sumps): Sumpwalker-Ausrüstung aus Verdigris und Cinder Iron, an der normalen Werkbank (eine Stufe über den Meisterstücken)
  t_sw_boots: { prof: 'tinkering', level: 38, inputs: { verdigris: 3, cinder_iron: 2 }, out: ['sumpwalker_boots', 1], xp: 300 },
  t_sw_hood: { prof: 'tinkering', level: 39, inputs: { verdigris: 3, cinder_iron: 2, glimmer: 1 }, out: ['sumpwalker_hood', 1], xp: 310 },
  t_sw_coat: { prof: 'tinkering', level: 40, inputs: { verdigris: 5, cinder_iron: 3, greyglass: 1 }, out: ['sumpwalker_coat', 1], xp: 340 },
  t_greyglass_coat: { prof: 'tinkering', level: 28, inputs: { greyglass: 4, beetle_shell: 2 }, out: ['greyglass_coat', 1], xp: 160 },

  // Alchemy (Destille in der Kapelle)
  a_bitter_tonic: { prof: 'alchemy', level: 1, inputs: { bitterleaf: 2 }, out: ['bitter_tonic', 1], xp: 10 },
  a_lamp_oil: { prof: 'alchemy', level: 2, inputs: { wax_comb: 1 }, out: ['lamp_oil', 2], xp: 12 },
  a_glow_draught: { prof: 'alchemy', level: 6, inputs: { grey_wisp: 2, emberroot: 1 }, out: ['glow_draught', 1], xp: 24 },

  a_moss_salve: { prof: 'alchemy', level: 12, inputs: { moss_tuft: 2 }, out: ['moss_salve', 1], xp: 50 },
  a_dusk_draught: { prof: 'alchemy', level: 16, inputs: { nightcap: 2, grey_wisp: 1 }, out: ['dusk_draught', 1], xp: 66 },
  a_wisp_draught: { prof: 'alchemy', level: 24, inputs: { wisp_core: 1, nightcap: 1 }, out: ['wisp_draught', 1], xp: 96 },
  // Tag 4, Nachschlag: Alchemie 28 und 32, Heilung für die Lurker im tiefen Flöz
  a_hearth_salve: { prof: 'alchemy', level: 28, inputs: { emberroot: 2, moss_tuft: 2, nightcap: 1 }, out: ['hearth_salve', 2], xp: 110 },
  a_seam_tonic: { prof: 'alchemy', level: 32, inputs: { lily_bulb: 2, nightcap: 2, glimmer: 1 }, out: ['seam_tonic', 2], xp: 130 },
  // Tag 5, Nachschlag: Alchemie 36. Der Trank der Schleusenwärter: Verdigris bindet das Öl, die Lilie heilt.
  a_sluice_draught: { prof: 'alchemy', level: 36, inputs: { verdigris: 1, lily_bulb: 2, nightcap: 1 }, out: ['sluice_draught', 2], xp: 150 },
  a_lily_oil: { prof: 'alchemy', level: 21, inputs: { lily_bulb: 2 }, out: ['lily_oil', 2], xp: 86 },

  // Lampwright (Linsenbank in der Werkstatt)
  l_cracked_lens: { prof: 'lampwright', level: 1, inputs: { scrap: 2, grey_wisp: 1 }, out: ['cracked_lens', 1], xp: 12 },
  l_ember_staff: { prof: 'lampwright', level: 2, inputs: { scrap: 1, wax_comb: 1 }, out: ['ember_staff', 1], xp: 14 },
  l_brass_lantern: { prof: 'lampwright', level: 5, inputs: { brass_bits: 3, survey_notes: 2 }, out: ['brass_lantern', 1], xp: 30 },
  l_moon_candle: { prof: 'lampwright', level: 11, inputs: { moonwick: 1, wax_comb: 1 }, out: ['moon_candle', 2], xp: 46 },
  l_brass_lens: { prof: 'lampwright', level: 9, inputs: { brass_bits: 2, glimmer: 1 }, out: ['brass_lens', 1], xp: 40 },
  l_brass_staff: { prof: 'lampwright', level: 9, inputs: { brass_bits: 2, emberroot: 2 }, out: ['brass_staff', 1], xp: 40 },
  l_glim_lantern: { prof: 'lampwright', level: 13, inputs: { brass_bits: 3, glimmer: 2, survey_notes: 2 }, out: ['glim_lantern', 1], xp: 56 },
  l_green_lens: { prof: 'lampwright', level: 12, inputs: { green_shard: 3, brass_bits: 1 }, out: ['green_lens', 1], xp: 52 },
  l_glim_lens: { prof: 'lampwright', level: 15, inputs: { brass_bits: 2, glimmer: 3 }, out: ['glim_lens', 1], xp: 70 },
  l_glim_staff: { prof: 'lampwright', level: 17, inputs: { brass_bits: 2, glimmer: 2, moss_tuft: 2 }, out: ['glim_staff', 1], xp: 80 },
  l_foremans_lamp: { prof: 'lampwright', level: 19, inputs: { brass_bits: 3, glimmer: 2, beetle_shell: 1 }, out: ['foremans_lamp', 1], xp: 85 },
  l_flare_candle: { prof: 'lampwright', level: 20, inputs: { wax_comb: 2, glimmer: 1 }, out: ['flare_candle', 2], xp: 90 },
  // Tag 5, Nachschlag: Glas aus der Old Mill, gegossen wie im Norden (Wenna)
  // Tag 6, Nachschlag: Wennas Trägerlampe, nachgebaut von Wren. Grit aus der Mühle, ein Scheit für den Griff, Wachs für den Docht.
  l_carriers_lamp: { prof: 'lampwright', level: 16, inputs: { glass_grit: 1, split_log: 1, wax_comb: 1 }, out: ['carriers_lamp', 1], xp: 76 },
  l_hollow_glass_lantern: { prof: 'lampwright', level: 22, inputs: { glass_grit: 2, brass_bits: 2, survey_notes: 1 }, out: ['hollow_glass_lantern', 1], xp: 105 },
  l_greyglass_lantern: { prof: 'lampwright', level: 24, inputs: { greyglass: 2, glimmer: 2, survey_notes: 3 }, out: ['greyglass_lantern', 1], xp: 120 },
  l_greyglass_lens: { prof: 'lampwright', level: 26, inputs: { greyglass: 3, glimmer: 2 }, out: ['greyglass_lens', 1], xp: 140 },
  l_shard_lantern: { prof: 'lampwright', level: 30, inputs: { lamp_shard: 1, greyglass: 3, glimmer: 2 }, out: ['shard_lantern', 1], xp: 220 },
  // Tag 4, Nachschlag: Lampwright 32, Cinder Iron aus Cinderford
  l_cinder_lantern: { prof: 'lampwright', level: 32, inputs: { cinder_iron: 2, glimmer: 3, wisp_core: 1 }, out: ['cinder_lantern', 1], xp: 240 },
  l_cinder_staff: { prof: 'lampwright', level: 34, inputs: { cinder_iron: 3, greyglass: 2, emberroot: 2 }, out: ['cinder_staff', 1], xp: 250 },
  l_cinder_lens: { prof: 'lampwright', level: 35, inputs: { cinder_iron: 3, greyglass: 3 }, out: ['cinder_lens', 1], xp: 255 },
  // Tag 5 (Sumps, Nachschlag): Verdigris hält die Feuchte aus dem Eisen. Stab und Linse eine Stufe über Cinder Iron.
  l_verdigris_staff: { prof: 'lampwright', level: 38, inputs: { verdigris: 3, cinder_iron: 2, emberroot: 2 }, out: ['verdigris_staff', 1], xp: 290 },
  l_verdigris_lens: { prof: 'lampwright', level: 39, inputs: { verdigris: 3, cinder_iron: 2, greyglass: 2 }, out: ['verdigris_lens', 1], xp: 300 },
  l_greyglass_staff: { prof: 'lampwright', level: 26, inputs: { greyglass: 2, glimmer: 2, lily_bulb: 2 }, out: ['greyglass_staff', 1], xp: 140 },
};
