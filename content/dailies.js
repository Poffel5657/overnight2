// Tägliche Gefallen am Anschlagbrett. Jeden Tag (Berliner Datum) zieht das Spiel FAVOURS_PER_DAY davon,
// für alle Spieler dieselben. Arten: bring (Gegenstände am Brett abgeben), kill (Wesen besiegen).
// reward: gold und xp (aktive Klasse). Gold braucht man beim Händler und beim Handel; abgestimmt wird ohne Gold (eine Stimme pro Tag).

export const FAVOURS_PER_DAY = 3;

export const FAVOURS = {
  oil_for_ama: { from: 'ama', type: 'bring', item: 'lamp_oil', n: 2, text: 'Ama wants two lamp oil for the night watch.', reward: { gold: 12, xp: 30 } },
  leaves_for_tallow: { from: 'tallow', type: 'bring', item: 'bitterleaf', n: 3, text: 'Tallow is out of bitterleaf again.', reward: { gold: 10, xp: 25 } },
  scrap_for_rook: { from: 'rook', type: 'bring', item: 'scrap', n: 5, text: 'Rook needs scrap. He always needs scrap.', reward: { gold: 10, xp: 25 } },
  wisps_for_wren: { from: 'wren', type: 'bring', item: 'grey_wisp', n: 3, text: 'Wren wants grey wisps to test a lens.', reward: { gold: 12, xp: 30 } },
  notes_for_fen: { from: 'fen', type: 'bring', item: 'survey_notes', n: 2, text: 'Fen wants survey notes for the big map.', reward: { gold: 12, xp: 30 } },
  thin_greylings: { from: 'ama', type: 'kill', mob: 'greyling', n: 5, text: 'Thin out the Greylings around the fields.', reward: { gold: 15, xp: 45 } },
  restless_wolves: { from: 'haskel', type: 'kill', mob: 'restless_wolf', n: 4, text: 'Restless wolves are sniffing round the fields. Haskel wants them sent home.', reward: { gold: 14, xp: 50 } },
  tufts_for_ama: { from: 'ama', type: 'bring', item: 'singed_tuft', n: 3, text: 'Ama wants singed tufts. She says they burn like kindling.', reward: { gold: 12, xp: 40 } },
  pelts_for_brindle: { from: 'brindle', type: 'bring', item: 'wolf_pelt', n: 2, text: 'Brindle wants wolf pelts. The wind up at the North Watch is mean.', reward: { gold: 16, xp: 60 } },
  shards_for_fen: { from: 'fen', type: 'bring', item: 'green_shard', n: 2, text: 'Fen wants green glass shards from Hushwood, for proof. Of what, Fen will not say.', reward: { gold: 18, xp: 70 } },
  foreman_again: { from: 'brack', type: 'kill', mob: 'old_foreman', n: 1, text: 'The Old Foreman clocked back in. Brack wants him resting again. Bring a friend.', reward: { gold: 40, xp: 300 } },
  quiet_the_choir: { from: 'tallow', type: 'kill', mob: 'choir_wraith', n: 2, text: 'Tallow hears the low part at night, all the way up here. Quiet two choir wraiths.', reward: { gold: 30, xp: 400 } },
  shoo_crows: { from: 'fen', type: 'kill', mob: 'crow', n: 3, text: 'The crows are judging the vegetable patch. Shoo them.', reward: { gold: 8, xp: 20 } },
};

// Was das Leuchtfeuer frisst und wie viel es zählt. Das Tagesziel bestimmt, wie weit der Grey
// in der nächsten Nacht zurückweicht (der Nightwright liest den Stand).
export const BEACON_FUEL = { lamp_oil: 5, wax_comb: 2, grey_wisp: 1, singed_tuft: 2 };
export const BEACON_GOAL = 300;

