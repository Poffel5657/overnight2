// Berufe: dein Platz im Dorf. Jeder lernt höchstens MAX_PROFESSIONS. Verlernen beim Lehrer
// löscht den Fortschritt in diesem Beruf (die Wahl soll etwas bedeuten).
//   kind: gather (an Fundstellen sammeln, content/nodes.js) oder craft (an Stationen herstellen).
//   station: wo hergestellt wird (Objekt-Art in den Gebieten).  teacher: wer ihn beibringt.

export const MAX_PROFESSIONS = 2;
export const PROF_MAX_LEVEL = 50;

export const PROFESSIONS = {
  salvage: { name: 'Salvage', kind: 'gather', teacher: 'rook', text: 'Pull useful bits out of wrecks and heaps.' },
  foraging: { name: 'Foraging', kind: 'gather', teacher: 'tallow', text: 'Herbs, roots and wax from the meadows.' },
  cartography: { name: 'Cartography', kind: 'gather', teacher: 'fen', text: 'Survey waymarks and write the world down.' },
  tinkering: { name: 'Tinkering', kind: 'craft', station: 'workbench', teacher: 'rook', text: 'Weapons and armour from salvage.' },
  alchemy: { name: 'Alchemy', kind: 'craft', station: 'still', teacher: 'tallow', text: 'Tonics, oils and draughts.' },
  lampwright: { name: 'Lampwright', kind: 'craft', station: 'lampbench', teacher: 'wren', text: 'Lanterns, lenses and staves that hold light.' },
};

// Nebenfähigkeiten hat jeder (Kindling, Cooking, Wayfinding) – kommen später.
