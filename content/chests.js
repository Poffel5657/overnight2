// Truhen: Jeder Spieler darf eine Truhe einmal am Tag öffnen. Beute wie bei Wesen: [Gegenstand, Chance, min, max].
export const CHESTS = {
  chapel: { gold: [20, 40], items: [['greyglass', 0.6, 1, 2], ['glimmer', 0.5, 1, 2], ['moss_salve', 0.5, 1, 2], ['dusk_draught', 0.3, 1, 1]] },
  drift_deep: { gold: [30, 60], items: [['greyglass', 0.5, 1, 2], ['glimmer', 0.7, 1, 3], ['dusk_draught', 0.4, 1, 1], ['lily_oil', 0.4, 1, 2]] },
  drift: { gold: [8, 20], items: [['brass_bits', 0.6, 1, 3], ['glimmer', 0.4, 1, 1], ['survey_notes', 0.4, 1, 2], ['lamp_oil', 0.5, 1, 2]] },
  // The Unending Maze (seit 2026-11-13): eine Truhe pro Stockwerk, zwei auf jedem fünften
  maze_low: { gold: [10, 25], items: [['turnstone', 0.35, 1, 1], ['turn_chalk', 0.6, 1, 2], ['brass_bits', 0.5, 1, 3], ['lamp_oil', 0.6, 1, 2], ['bitter_tonic', 0.4, 1, 2]] },
  maze_mid: { gold: [30, 60], items: [['turnstone', 0.5, 1, 2], ['glimmer', 0.5, 1, 2], ['moss_salve', 0.5, 1, 2], ['lily_oil', 0.4, 1, 2], ['cinder_cake', 0.4, 1, 2]] },
  maze_deep: { gold: [80, 150], items: [['turnstone', 0.7, 1, 3], ['greyglass', 0.6, 1, 2], ['wisp_core', 0.4, 1, 2], ['dusk_draught', 0.5, 1, 2], ['cinder_cake', 0.6, 2, 3]] },
};
