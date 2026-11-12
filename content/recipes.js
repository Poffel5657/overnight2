// Rezepte für Herstellberufe. Man stellt an der passenden Station her (content/professions.js).
//   prof / level: wer ab welcher Stufe.  inputs: { Gegenstand: Anzahl }.  out: [Gegenstand, Anzahl].
//   xp: Berufserfahrung.

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
  t_shell_coat: { prof: 'tinkering', level: 20, inputs: { beetle_shell: 4, brass_bits: 2 }, out: ['shell_coat', 1], xp: 95 },
  t_greyglass_hood: { prof: 'tinkering', level: 24, inputs: { greyglass: 2, glimmer: 1 }, out: ['greyglass_hood', 1], xp: 120 },
  t_greyglass_boots: { prof: 'tinkering', level: 24, inputs: { greyglass: 2, glimmer: 1 }, out: ['greyglass_boots', 1], xp: 120 },
  t_greyglass_shivs: { prof: 'tinkering', level: 26, inputs: { greyglass: 3, glimmer: 2 }, out: ['greyglass_shivs', 1], xp: 140 },
  t_greyglass_shield: { prof: 'tinkering', level: 26, inputs: { greyglass: 4, glimmer: 2 }, out: ['greyglass_shield', 1], xp: 140 },
  t_wraithsilk_hood: { prof: 'tinkering', level: 30, inputs: { greyglass: 2, sodden_hymnal: 2, glimmer: 1 }, out: ['wraithsilk_hood', 1], xp: 180 },
  t_wardstone_boots: { prof: 'tinkering', level: 31, inputs: { greyglass: 2, beetle_shell: 2, glimmer: 1 }, out: ['wardstone_boots', 1], xp: 190 },
  t_greyglass_coat: { prof: 'tinkering', level: 28, inputs: { greyglass: 4, beetle_shell: 2 }, out: ['greyglass_coat', 1], xp: 160 },

  // Alchemy (Destille in der Kapelle)
  a_bitter_tonic: { prof: 'alchemy', level: 1, inputs: { bitterleaf: 2 }, out: ['bitter_tonic', 1], xp: 10 },
  a_lamp_oil: { prof: 'alchemy', level: 2, inputs: { wax_comb: 1 }, out: ['lamp_oil', 2], xp: 12 },
  a_glow_draught: { prof: 'alchemy', level: 6, inputs: { grey_wisp: 2, emberroot: 1 }, out: ['glow_draught', 1], xp: 24 },

  a_moss_salve: { prof: 'alchemy', level: 12, inputs: { moss_tuft: 2 }, out: ['moss_salve', 1], xp: 50 },
  a_dusk_draught: { prof: 'alchemy', level: 16, inputs: { nightcap: 2, grey_wisp: 1 }, out: ['dusk_draught', 1], xp: 66 },
  a_wisp_draught: { prof: 'alchemy', level: 24, inputs: { wisp_core: 1, nightcap: 1 }, out: ['wisp_draught', 1], xp: 96 },
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
  l_greyglass_lantern: { prof: 'lampwright', level: 24, inputs: { greyglass: 2, glimmer: 2, survey_notes: 3 }, out: ['greyglass_lantern', 1], xp: 120 },
  l_greyglass_lens: { prof: 'lampwright', level: 26, inputs: { greyglass: 3, glimmer: 2 }, out: ['greyglass_lens', 1], xp: 140 },
  l_shard_lantern: { prof: 'lampwright', level: 30, inputs: { lamp_shard: 1, greyglass: 3, glimmer: 2 }, out: ['shard_lantern', 1], xp: 220 },
  l_greyglass_staff: { prof: 'lampwright', level: 26, inputs: { greyglass: 2, glimmer: 2, lily_bulb: 2 }, out: ['greyglass_staff', 1], xp: 140 },
};
