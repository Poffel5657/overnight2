// Klassen: dein Platz im Kampf. Jeder kann jede Klasse lernen und leveln.
// Die erste wählt man bei Warden Ama (Quest „Kindling“). Weitere schaltet der jeweilige Lehrer frei,
// sobald eine Klasse Stufe UNLOCK_LEVEL erreicht hat (Prüfungs-Quest). Gewechselt wird im Dorf,
// indem man die Hauptwaffe der anderen Klasse in die Hand nimmt. Fortschritt geht nie verloren.
//   hp / hpPerLevel: Lebenspunkte.  abilities: [Fähigkeit, ab Stufe] (content/abilities.js).
//   starter: Waffe, die man beim Freischalten bekommt.  teacher: Figur, die die Klasse lehrt.
//   specs: Spezialisierungen ab Stufe SPEC_LEVEL. Eine pro Klasse und Spieler, gewählt beim Lehrer
//          (Gesprächswirkung { chooseSpec: '<id>' }, Bedingung { specLevel: true, noSpec: true }).
//          Form: { <id>: { name, text, abilities: [[Fähigkeit, ab Stufe], …] } }. Die Fähigkeiten der
//          Spezialisierung kommen zu denen der Klasse dazu. Der Nightwright baut sie Nacht für Nacht aus.
// Die Klassen wachsen bis Stufe 99 (MAX_LEVEL in shared/player.js). Jede Klasse soll über die ganze
// Strecke regelmäßig Neues bekommen (Fähigkeiten, Verbesserungen), nicht nur bis Stufe 10.

export const UNLOCK_LEVEL = 10;
export const SPEC_LEVEL = 50;

export const CLASSES = {
  warden: {
    name: 'Warden', role: 'TANK', teacher: 'ama', starter: 'scrap_shield', trial: 'trial_warden',
    hp: 36, hpPerLevel: 4,
    text: 'Stands in front. Holds the line, and the light.',
    abilities: [['bash', 1], ['brace', 2], ['taunt', 4], ['lantern_ward', 6], ['shield_slam', 8], ['stand_fast', 12], ['beacon_slam', 16]],
    specs: {},
  },
  mender: {
    name: 'Mender', role: 'HEALER', teacher: 'tallow', starter: 'ember_staff', trial: 'trial_mender',
    hp: 30, hpPerLevel: 3,
    text: 'Keeps everyone warm. Warm people do not fall over.',
    abilities: [['ember_touch', 1], ['staff_rap', 1], ['warmth', 3], ['glow', 6], ['kindle_burst', 9]],
    specs: {},
  },
  flarecaster: {
    name: 'Flarecaster', role: 'RANGED', teacher: 'wren', starter: 'cracked_lens', trial: 'trial_flarecaster',
    hp: 28, hpPerLevel: 3,
    text: 'Turns lantern light into something that hurts.',
    abilities: [['flare_bolt', 1], ['flare', 2], ['sear', 4], ['sunspot', 7]],
    specs: {},
  },
  drifter: {
    name: 'Drifter', role: 'MELEE', teacher: 'stranger', starter: 'scrap_shivs', trial: 'trial_drifter',
    hp: 30, hpPerLevel: 3,
    text: 'Fast, quiet, and suspiciously comfortable in the dark.',
    abilities: [['slash', 1], ['dusk_step', 2], ['snare', 4], ['fade', 6], ['twin_cut', 8]],
    specs: {},
  },
};

// Ohne Klasse (vor der ersten Wahl) ist man ein Wanderer mit bloßen Fäusten.
export const WANDERER = { name: 'Wanderer', role: '', hp: 30, hpPerLevel: 0, abilities: [['punch', 1]] };
