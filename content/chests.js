// Truhen: Jeder Spieler darf eine Truhe einmal am Tag öffnen. Beute wie bei Wesen: [Gegenstand, Chance, min, max].
export const CHESTS = {
  chapel: { gold: [20, 40], items: [['greyglass', 0.6, 1, 2], ['glimmer', 0.5, 1, 2], ['moss_salve', 0.5, 1, 2], ['dusk_draught', 0.3, 1, 1]] },
  drift_deep: { gold: [30, 60], items: [['greyglass', 0.5, 1, 2], ['glimmer', 0.7, 1, 3], ['dusk_draught', 0.4, 1, 1], ['lily_oil', 0.4, 1, 2]] },
  drift: { gold: [8, 20], items: [['brass_bits', 0.6, 1, 3], ['glimmer', 0.4, 1, 1], ['survey_notes', 0.4, 1, 2], ['lamp_oil', 0.5, 1, 2]] },
};
