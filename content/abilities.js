// Fähigkeiten für die Leiste 1-9. cd und gcd in Takten.
// kind: 'melee' braucht ein Ziel daneben, 'self' wirkt auf einen selbst, 'burst' trifft alles im Umkreis.
export const GCD = 3;

export const ABILITIES = {
  strike: { name: 'Strike', glyph: '/', kind: 'melee', hit: [4, 6], cd: 0, text: 'You strike.' },
  flare: { name: 'Flare', glyph: '*', kind: 'burst', radius: 2.5, hit: [2, 3], cd: 16, oil: 10, scare: 8, text: 'Your lantern flares white.' },
  mend: { name: 'Mend', glyph: '+', kind: 'self', heal: 10, cd: 20, text: 'You catch your breath.' },
  brace: { name: 'Brace', glyph: '#', kind: 'self', brace: 10, cd: 30, text: 'You brace behind your shield.' },
};

// Belegung der Leiste beim Start. Spieler können sie später selbst ändern.
export const DEFAULT_BAR = ['strike', 'flare', 'mend', 'brace', null, null, null, null, null];
