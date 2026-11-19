// Truhen: Jeder Spieler darf eine Truhe einmal am Tag öffnen. Beute wie bei Wesen: [Gegenstand, Chance, min, max].
export const CHESTS = {
  chapel: { gold: [20, 40], items: [['greyglass', 0.6, 1, 2], ['glimmer', 0.5, 1, 2], ['moss_salve', 0.5, 1, 2], ['dusk_draught', 0.3, 1, 1]] },
  drift_deep: { gold: [30, 60], items: [['greyglass', 0.5, 1, 2], ['glimmer', 0.7, 1, 3], ['dusk_draught', 0.4, 1, 1], ['lily_oil', 0.4, 1, 2]] },
  drift: { gold: [8, 20], items: [['brass_bits', 0.6, 1, 3], ['glimmer', 0.4, 1, 1], ['survey_notes', 0.4, 1, 2], ['lamp_oil', 0.5, 1, 2]] },
  // The Unending Maze (seit 2026-11-13): eine Truhe pro Stockwerk, zwei auf jedem fünften
  maze_low: { gold: [10, 25], items: [['turnstone', 0.35, 1, 1], ['turn_chalk', 0.6, 1, 2], ['brass_bits', 0.5, 1, 3], ['lamp_oil', 0.6, 1, 2], ['bitter_tonic', 0.4, 1, 2]] },
  maze_mid: { gold: [30, 60], items: [['turnstone', 0.5, 1, 2], ['glimmer', 0.5, 1, 2], ['moss_salve', 0.5, 1, 2], ['lily_oil', 0.4, 1, 2], ['cinder_cake', 0.4, 1, 2]] },
  maze_deep: { gold: [80, 150], items: [['turnstone', 0.7, 1, 3], ['greyglass', 0.6, 1, 2], ['wisp_core', 0.4, 1, 2], ['dusk_draught', 0.5, 1, 2], ['cinder_cake', 0.6, 2, 3]] },
  // Tag 5: der Spind eines Schleusenwärters in den Sumps unter Cinderford
  sumps: { gold: [40, 80], items: [['verdigris', 0.7, 1, 2], ['greyglass', 0.4, 1, 1], ['seam_tonic', 0.4, 1, 1], ['cinder_cake', 0.5, 1, 2], ['lamp_oil', 0.5, 1, 2]] },
  // Tag 8: die Kiste eines Trägers am Rastplatz oben an der Steinstraße
  // Nachschlag Tag 9: die Truhe des Chors hinter der Tür unter der Chortreppe
  choir_vault: { gold: [40, 75], items: [['greyglass', 0.7, 1, 2], ['sodden_hymnal', 0.5, 1, 1], ['grey_wisp', 0.5, 1, 2], ['hearth_salve', 0.4, 1, 1], ['dusk_draught', 0.4, 1, 1]] },
  // Nachschlag Tag 9: die Glimmer Galleries
  galleries: { gold: [60, 110], items: [['lode_glimmer', 0.7, 1, 2], ['run_iron', 0.4, 1, 1], ['cinder_iron', 0.5, 1, 2], ['culvert_draught', 0.4, 1, 1]] },
  carriers_box: { gold: [25, 50], items: [['hollow_ration', 0.6, 1, 2], ['peat_brick', 0.6, 1, 3], ['peat_oil', 0.4, 1, 1], ['green_shard', 0.5, 1, 2], ['hearth_salve', 0.3, 1, 1]] },
};
