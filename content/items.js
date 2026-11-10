// Gegenstände. Jeder hat einen Zweck und einen Fundort (tools/check-world.mjs prüft das).
//   slot: main (Hauptwaffe, bestimmt die Klasse), head, body, feet, lantern. Ohne slot: Beutel.
//   cls: Klasse der Hauptwaffe.  power: Angriff.  defence: Abwehr.  light: Laternen-Reichweite (+Felder).
//   burn: Ölverbrauch der Laterne (1 = normal).  use: Wirkung beim Benutzen (heal, oil, glow).
//   stack: stapelt im Beutel.  value: Preis beim Händler (Verkauf bringt die Hälfte).
//   sprite: Pixelbild im Beutel (content/sprites.js), sonst ein Zeichen (glyph).

export const ITEMS = {
  // ---------- Hauptwaffen: die Klasse kommt aus der Hand ----------
  scrap_shield: { name: 'Scrap Shield', slot: 'main', cls: 'warden', power: 2, defence: 2, value: 12, glyph: ']', text: 'Half a door and a lantern hook. Wardens swear by it.' },
  brass_shield: { name: 'Brass Shield', slot: 'main', cls: 'warden', power: 4, defence: 4, value: 60, glyph: ']', text: 'It rings when things hit it. Things hit it less after that.' },
  ember_staff: { name: 'Ember Staff', slot: 'main', cls: 'mender', power: 1, heal: 2, value: 12, glyph: '|', text: 'A stick with a coal that never quite goes out.' },
  brass_staff: { name: 'Brass Ember Staff', slot: 'main', cls: 'mender', power: 2, heal: 5, value: 60, glyph: '|', text: 'The coal sits in a brass cup and hums a little.' },
  cracked_lens: { name: 'Cracked Lens', slot: 'main', cls: 'flarecaster', power: 2, value: 12, glyph: 'o', text: 'Gathers lantern light into a point. The crack makes it angry.' },
  brass_lens: { name: 'Ground Brass Lens', slot: 'main', cls: 'flarecaster', power: 5, value: 60, glyph: 'o', text: 'Wren ground it for a week. It focuses light, and grudges.' },
  scrap_shivs: { name: 'Scrap Shivs', slot: 'main', cls: 'drifter', power: 3, value: 12, glyph: 'x', text: 'Two sharp bits of something that used to be useful.' },
  brass_shivs: { name: 'Brass Shivs', slot: 'main', cls: 'drifter', power: 6, value: 60, glyph: 'x', text: 'They do not reflect light. Nobody knows how.' },

  // ---------- Rüstung ----------
  scrap_hood: { name: 'Scrap Hood', slot: 'head', defence: 1, value: 6, glyph: '^', text: 'Keeps the drizzle and some of the teeth off.' },
  scrap_coat: { name: 'Scrap Coat', slot: 'body', defence: 2, value: 10, glyph: 'M', text: 'Patched from sacks and old sails. Smells of both.' },
  scrap_boots: { name: 'Scrap Boots', slot: 'feet', defence: 1, value: 6, glyph: 'u', text: 'Two left boots, but very determined ones.' },
  brass_hood: { name: 'Brass Hood', slot: 'head', defence: 2, value: 30, glyph: '^', text: 'A helmet that was a kettle. Still whistles in wind.' },
  brass_coat: { name: 'Brass-Ringed Coat', slot: 'body', defence: 4, value: 50, glyph: 'M', text: 'Rings of brass sewn into leather. Clinks politely.' },
  brass_boots: { name: 'Brass-Toed Boots', slot: 'feet', defence: 2, value: 30, glyph: 'u', text: 'For kicking the Grey, and doors.' },

  // ---------- Laternen ----------
  tin_lantern: { name: 'Tin Lantern', slot: 'lantern', light: 0, burn: 1, value: 4, glyph: 'i', text: 'Everyone in Kindle gets one. Most of them still work.' },
  brass_lantern: { name: 'Brass Lantern', slot: 'lantern', light: 1.5, burn: 0.7, value: 45, glyph: 'i', text: 'Brighter and thriftier. Wren polished the reflector with a map.' },

  // ---------- Verbrauch ----------
  bread: { name: 'Bread', stack: true, use: { heal: 12 }, value: 3, glyph: 'n', text: 'Kindle bread. Dense enough to stop a door.' },
  lamp_oil: { name: 'Lamp Oil', stack: true, use: { oil: 40 }, value: 4, glyph: '!', text: 'Rendered from tallow. Pours slowly, burns gold.' },
  bitter_tonic: { name: 'Bitter Tonic', stack: true, use: { heal: 25 }, value: 8, glyph: '!', text: 'Tastes like a bad decision. Heals like a good one.' },
  glow_draught: { name: 'Glow Draught', stack: true, use: { glow: 100, oil: 15 }, value: 14, glyph: '!', text: 'You glow a little. Greylings find this rude.' },

  // ---------- Rohstoffe ----------
  scrap: { name: 'Scrap', stack: true, value: 1, glyph: '%', text: 'Bits of the world the Grey chewed and spat out.' },
  brass_bits: { name: 'Brass Bits', stack: true, value: 3, glyph: '%', text: 'Warm-coloured scraps. Rook can tell them apart by smell.' },
  glimmer: { name: 'Glimmer', stack: true, value: 10, glyph: '*', text: 'A chip of something that holds light after dark.' },
  bitterleaf: { name: 'Bitterleaf', stack: true, value: 1, glyph: '"', text: 'Grows where people sigh. Tallow brews it.' },
  wax_comb: { name: 'Wax Comb', stack: true, value: 2, glyph: '#', text: 'From the wild hives by the stream. Renders into tallow oil.' },
  emberroot: { name: 'Emberroot', stack: true, value: 4, glyph: '"', text: 'A root that is warm to the touch, even in the Grey.' },
  survey_notes: { name: 'Survey Notes', stack: true, value: 5, glyph: '=', text: 'Distances, angles, and a small drawing of a worried goose.' },
  grey_wisp: { name: 'Grey Wisp', stack: true, value: 2, glyph: '~', text: 'What is left of a Greyling. It tries to get back into the fog.' },
  crow_feather: { name: 'Crow Feather', stack: true, value: 1, glyph: '/', text: 'Glossy and judgemental. Fen collects them for quills.' },
};

// Ausrüstungsplätze in der Reihenfolge, in der das Fenster sie zeigt.
export const SLOTS = ['main', 'head', 'body', 'feet', 'lantern'];
export const SLOT_NAMES = { main: 'HAND', head: 'HEAD', body: 'BODY', feet: 'FEET', lantern: 'LANTERN' };
export const BAG_SIZE = 24;
