// Fähigkeiten für die Leiste 1-9. Welche Klasse was lernt, steht in content/classes.js.
// cd und gcd in Takten (300 ms). oil: kostet Lampenöl. Wirkungen (kind):
//   melee   Ziel daneben, Schaden hit[]           ranged  Ziel bis range Felder entfernt
//   burst   alles im Umkreis radius, scare = flieht, dazzle = kann kurz nicht angreifen, hold = greift dich an
//   self    heal / brace (halber Schaden) auf sich
//   aura    Heilung/brace für sich und Verbündete im Umkreis   hot  Heilung über Zeit (heal pro 2 Takte)
//   taunt   Wesen im Umkreis greifen dich an      dash   springt dist Felder vom Ziel weg
//   snare   Ziel steckt fest (root Takte)          fade   Wesen verlieren dich (Takte), außer im Licht
//   zone    Fläche um das Ziel, Schaden an allem darin
// desc: ein Satz Stimmung; die Zahlen erzeugt shared/describe.js aus den Daten.
// power: Waffe zählt mit (Schaden + Waffenkraft). dazzle: Ziel kann kurz nicht angreifen.

// Globale Abklingzeit: eine Handlung (Fähigkeit, Gegenstand oder normaler Schlag) pro GCD Takte.
export const GCD = 4;

export const ABILITIES = {
  punch: { name: 'Punch', desc: "Fists. Better than nothing, barely.", glyph: '·', kind: 'melee', hit: [1, 2], cd: 0, power: true },

  // Warden
  bash: { name: 'Bash', desc: "A plain shield blow. The Warden's bread and butter.", glyph: '/', kind: 'melee', hit: [3, 5], cd: 0, power: true },
  brace: { name: 'Brace', desc: "Plant your feet and let the shield take it.", glyph: '#', kind: 'self', brace: 10, cd: 30, text: 'You brace behind your shield.' },
  taunt: { name: 'Taunt', desc: "Bang the shield. Everything nearby forgets the others.", glyph: '!', kind: 'taunt', radius: 4, cd: 20, text: 'You bang your shield. Everything looks at you.' },
  lantern_ward: { name: 'Lantern Ward', desc: "Your lantern's steady light hardens everyone close.", glyph: 'O', kind: 'aura', radius: 3, brace: 8, oil: 6, cd: 40, text: 'Your lantern spreads a ring of steady light.' },
  stand_fast: { name: 'Stand Fast', desc: "Dig in behind the shield and get your breath back.", glyph: 'H', kind: 'self', heal: 18, brace: 8, cd: 36, text: 'You dig in. The shield holds, and so do you.' },
  beacon_slam: { name: 'Beacon Slam', desc: "Slam the lantern into the shield. The flash rings every head nearby.", glyph: '*', kind: 'burst', radius: 1.5, hit: [7, 10], dazzle: 5, hold: true, oil: 5, cd: 24, text: 'Lantern meets shield. Everything close sees stars.' },
  shield_slam: { name: 'Shield Slam', desc: "A heavy slam that rings the target's head.", glyph: ']', kind: 'melee', hit: [6, 9], dazzle: 4, cd: 16, power: true },

  // Mender
  ember_touch: { name: 'Ember Touch', desc: "Quick warmth from the staff for everyone close.", glyph: '+', kind: 'aura', radius: 3, heal: 8, cd: 6, text: 'Warmth spreads from your staff.' },
  staff_rap: { name: 'Staff Rap', desc: "A smart rap with the staff. Menders are not helpless.", glyph: '|', kind: 'melee', hit: [1, 3], cd: 0, power: true },
  warmth: { name: 'Warmth', desc: "A slow, steady warmth that keeps working after you move on.", glyph: '~', kind: 'hot', radius: 3, heal: 3, ticks: 10, cd: 24, text: 'A slow warmth settles over everyone near.' },
  glow: { name: 'Glow', desc: "A soft glow that dulls every blow for a while.", glyph: 'o', kind: 'aura', radius: 3, brace: 8, oil: 6, cd: 40, text: 'A soft glow wraps your friends.' },
  kindle_burst: { name: 'Kindle Burst', desc: "The ember flares. Creatures flinch and run.", glyph: '*', kind: 'burst', radius: 2.5, hit: [3, 5], scare: 6, oil: 10, cd: 24, text: 'Your ember flares outward.' },

  // Flarecaster
  flare_bolt: { name: 'Flare Bolt', desc: "A focused bolt of lantern light.", glyph: '-', kind: 'ranged', range: 5, hit: [3, 5], cd: 0, power: true },
  flare: { name: 'Flare', desc: "A white flash. Everything close is scorched and scared off.", glyph: '*', kind: 'burst', radius: 2.5, hit: [2, 3], scare: 8, oil: 10, cd: 16, text: 'Your lantern flares white.' },
  sear: { name: 'Sear', desc: "A long, hot beam. Costs a little oil, hits hard.", glyph: '=', kind: 'ranged', range: 5, hit: [6, 9], oil: 4, cd: 10, power: true },
  sunspot: { name: 'Sunspot', desc: "Drop a patch of hard light on a group.", glyph: '@', kind: 'zone', range: 5, radius: 1.5, hit: [4, 6], oil: 8, cd: 20, text: 'A patch of hard light lands on the ground.' },

  // Drifter
  slash: { name: 'Slash', desc: "Quick cut. The Drifter's everyday tool.", glyph: 'x', kind: 'melee', hit: [4, 6], cd: 0, power: true },
  dusk_step: { name: 'Dusk Step', desc: "Step back into the dusk and out of the fight.", glyph: '>', kind: 'dash', dist: 2, cd: 12, text: 'You step back into the dusk.' },
  snare: { name: 'Snare', desc: "A wire snare. The target stays where it is.", glyph: '&', kind: 'snare', range: 3, root: 8, cd: 18, text: 'A wire snare bites at its feet.' },
  fade: { name: 'Fade', desc: "Let the dark forget you. Light still finds you.", glyph: '.', kind: 'fade', ticks: 12, cd: 40, text: 'You let the dark forget you.' },
  twin_cut: { name: 'Twin Cut', desc: "Both blades at once. Your hardest hit.", glyph: 'X', kind: 'melee', hit: [8, 11], cd: 12, power: true },
};
