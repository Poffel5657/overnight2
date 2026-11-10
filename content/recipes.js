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
  t_brass_hood: { prof: 'tinkering', level: 8, inputs: { brass_bits: 3 }, out: ['brass_hood', 1], xp: 30 },
  t_brass_boots: { prof: 'tinkering', level: 8, inputs: { brass_bits: 3 }, out: ['brass_boots', 1], xp: 30 },
  t_brass_shivs: { prof: 'tinkering', level: 9, inputs: { brass_bits: 3, scrap: 2 }, out: ['brass_shivs', 1], xp: 36 },
  t_brass_shield: { prof: 'tinkering', level: 9, inputs: { brass_bits: 4, scrap: 2 }, out: ['brass_shield', 1], xp: 36 },
  t_brass_coat: { prof: 'tinkering', level: 11, inputs: { brass_bits: 5, crow_feather: 2 }, out: ['brass_coat', 1], xp: 44 },

  // Alchemy (Destille in der Kapelle)
  a_bitter_tonic: { prof: 'alchemy', level: 1, inputs: { bitterleaf: 2 }, out: ['bitter_tonic', 1], xp: 10 },
  a_lamp_oil: { prof: 'alchemy', level: 2, inputs: { wax_comb: 1 }, out: ['lamp_oil', 2], xp: 12 },
  a_glow_draught: { prof: 'alchemy', level: 6, inputs: { grey_wisp: 2, emberroot: 1 }, out: ['glow_draught', 1], xp: 24 },

  // Lampwright (Linsenbank in der Werkstatt)
  l_cracked_lens: { prof: 'lampwright', level: 1, inputs: { scrap: 2, grey_wisp: 1 }, out: ['cracked_lens', 1], xp: 12 },
  l_ember_staff: { prof: 'lampwright', level: 2, inputs: { scrap: 1, wax_comb: 1 }, out: ['ember_staff', 1], xp: 14 },
  l_brass_lantern: { prof: 'lampwright', level: 5, inputs: { brass_bits: 3, survey_notes: 2 }, out: ['brass_lantern', 1], xp: 30 },
  l_brass_lens: { prof: 'lampwright', level: 9, inputs: { brass_bits: 2, glimmer: 1 }, out: ['brass_lens', 1], xp: 40 },
  l_brass_staff: { prof: 'lampwright', level: 9, inputs: { brass_bits: 2, emberroot: 2 }, out: ['brass_staff', 1], xp: 40 },
};
