// Tägliche Gefallen am Anschlagbrett. Jeden Tag (Berliner Datum) zieht das Spiel FAVOURS_PER_DAY davon,
// für alle Spieler dieselben. Arten: bring (Gegenstände am Brett abgeben), kill (Wesen besiegen).
// reward: gold und xp (aktive Klasse). Gold braucht man zum Spenden in der Kapelle.

export const FAVOURS_PER_DAY = 3;

export const FAVOURS = {
  oil_for_ama: { from: 'ama', type: 'bring', item: 'lamp_oil', n: 2, text: 'Ama wants two lamp oil for the night watch.', reward: { gold: 12, xp: 30 } },
  leaves_for_tallow: { from: 'tallow', type: 'bring', item: 'bitterleaf', n: 3, text: 'Tallow is out of bitterleaf again.', reward: { gold: 10, xp: 25 } },
  scrap_for_rook: { from: 'rook', type: 'bring', item: 'scrap', n: 5, text: 'Rook needs scrap. He always needs scrap.', reward: { gold: 10, xp: 25 } },
  wisps_for_wren: { from: 'wren', type: 'bring', item: 'grey_wisp', n: 3, text: 'Wren wants grey wisps to test a lens.', reward: { gold: 12, xp: 30 } },
  notes_for_fen: { from: 'fen', type: 'bring', item: 'survey_notes', n: 2, text: 'Fen wants survey notes for the big map.', reward: { gold: 12, xp: 30 } },
  thin_greylings: { from: 'ama', type: 'kill', mob: 'greyling', n: 5, text: 'Thin out the Greylings around the fields.', reward: { gold: 15, xp: 45 } },
  shoo_crows: { from: 'fen', type: 'kill', mob: 'crow', n: 3, text: 'The crows are judging the vegetable patch. Shoo them.', reward: { gold: 8, xp: 20 } },
};

// Was das Leuchtfeuer frisst und wie viel es zählt. Das Tagesziel bestimmt, wie weit der Grey
// in der nächsten Nacht zurückweicht (der Nightwright liest den Stand).
export const BEACON_FUEL = { lamp_oil: 5, wax_comb: 2, grey_wisp: 1 };
export const BEACON_GOAL = 300;

// Spenden in der Kapelle: höchstens so viel Gold pro Tag und Person.
export const DONATE_CAP = 50;
