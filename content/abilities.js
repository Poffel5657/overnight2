// Fähigkeiten für die Leiste 1-9. Welche Klasse was lernt, steht in content/classes.js.
// cd und gcd in Takten (300 ms). oil: kostet Lampenöl. Wirkungen (kind):
//   melee   Ziel daneben, Schaden hit[]           ranged  Ziel bis range Felder entfernt
//   burst   alles im Umkreis radius, scare = flieht   self   heal / brace (halber Schaden) auf sich
//   aura    Heilung/brace für sich und Verbündete im Umkreis   hot  Heilung über Zeit (heal pro 2 Takte)
//   taunt   Wesen im Umkreis greifen dich an      dash   springt dist Felder vom Ziel weg
//   snare   Ziel steckt fest (root Takte)          fade   Wesen verlieren dich (Takte), außer im Licht
//   zone    Fläche um das Ziel, Schaden an allem darin
// power: Waffe zählt mit (Schaden + Waffenkraft). dazzle: Ziel kann kurz nicht angreifen.

export const GCD = 3;

export const ABILITIES = {
  punch: { name: 'Punch', glyph: '·', kind: 'melee', hit: [1, 2], cd: 0, power: true },

  // Warden
  bash: { name: 'Bash', glyph: '/', kind: 'melee', hit: [3, 5], cd: 0, power: true },
  brace: { name: 'Brace', glyph: '#', kind: 'self', brace: 10, cd: 30, text: 'You brace behind your shield.' },
  taunt: { name: 'Taunt', glyph: '!', kind: 'taunt', radius: 4, cd: 20, text: 'You bang your shield. Everything looks at you.' },
  lantern_ward: { name: 'Lantern Ward', glyph: 'O', kind: 'aura', radius: 3, brace: 8, oil: 6, cd: 40, text: 'Your lantern spreads a ring of steady light.' },
  shield_slam: { name: 'Shield Slam', glyph: ']', kind: 'melee', hit: [6, 9], dazzle: 4, cd: 16, power: true },

  // Mender
  ember_touch: { name: 'Ember Touch', glyph: '+', kind: 'aura', radius: 3, heal: 8, cd: 6, text: 'Warmth spreads from your staff.' },
  staff_rap: { name: 'Staff Rap', glyph: '|', kind: 'melee', hit: [1, 3], cd: 0, power: true },
  warmth: { name: 'Warmth', glyph: '~', kind: 'hot', radius: 3, heal: 3, ticks: 10, cd: 24, text: 'A slow warmth settles over everyone near.' },
  glow: { name: 'Glow', glyph: 'o', kind: 'aura', radius: 3, brace: 8, oil: 6, cd: 40, text: 'A soft glow wraps your friends.' },
  kindle_burst: { name: 'Kindle Burst', glyph: '*', kind: 'burst', radius: 2.5, hit: [3, 5], scare: 6, oil: 10, cd: 24, text: 'Your ember flares outward.' },

  // Flarecaster
  flare_bolt: { name: 'Flare Bolt', glyph: '-', kind: 'ranged', range: 5, hit: [3, 5], cd: 0, power: true },
  flare: { name: 'Flare', glyph: '*', kind: 'burst', radius: 2.5, hit: [2, 3], scare: 8, oil: 10, cd: 16, text: 'Your lantern flares white.' },
  sear: { name: 'Sear', glyph: '=', kind: 'ranged', range: 5, hit: [6, 9], oil: 4, cd: 10, power: true },
  sunspot: { name: 'Sunspot', glyph: '@', kind: 'zone', range: 5, radius: 1.5, hit: [4, 6], oil: 8, cd: 20, text: 'A patch of hard light lands on the ground.' },

  // Drifter
  slash: { name: 'Slash', glyph: 'x', kind: 'melee', hit: [4, 6], cd: 0, power: true },
  dusk_step: { name: 'Dusk Step', glyph: '>', kind: 'dash', dist: 2, cd: 12, text: 'You step back into the dusk.' },
  snare: { name: 'Snare', glyph: '&', kind: 'snare', range: 3, root: 8, cd: 18, text: 'A wire snare bites at its feet.' },
  fade: { name: 'Fade', glyph: '.', kind: 'fade', ticks: 12, cd: 40, text: 'You let the dark forget you.' },
  twin_cut: { name: 'Twin Cut', glyph: 'X', kind: 'melee', hit: [8, 11], cd: 12, power: true },
};
