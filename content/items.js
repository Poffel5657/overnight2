// Gegenstände. Jeder hat einen Zweck und einen Fundort (tools/check-world.mjs prüft das).
//   slot: main (Hauptwaffe, bestimmt die Klasse), head, body, feet, lantern. Ohne slot: Beutel.
//   cls: Klasse der Hauptwaffe.  power: Angriff.  defence: Abwehr.  light: Laternen-Reichweite (+Felder).
//   burn: Ölverbrauch der Laterne (1 = normal).  use: Wirkung beim Benutzen (heal, oil, glow).
//   stack: stapelt im Beutel.  value: Preis beim Händler (Verkauf bringt die Hälfte).
//   sprite: Pixelbild im Beutel (content/sprites.js), sonst ein Zeichen (glyph).

export const ITEMS = {
  // ---------- Hauptwaffen: die Klasse kommt aus der Hand ----------
  scrap_shield: { name: 'Scrap Shield', slot: 'main', cls: 'warden', delay: 9, power: 2, defence: 2, value: 12, glyph: ']', text: 'Half a door and a lantern hook. Wardens swear by it.' },
  brass_shield: { name: 'Brass Shield', slot: 'main', cls: 'warden', delay: 9, power: 4, defence: 4, value: 60, glyph: ']', text: 'It rings when things hit it. Things hit it less after that.' },
  ember_staff: { name: 'Ember Staff', slot: 'main', cls: 'mender', delay: 10, power: 1, heal: 2, value: 12, glyph: '|', text: 'A stick with a coal that never quite goes out.' },
  brass_staff: { name: 'Brass Ember Staff', slot: 'main', cls: 'mender', delay: 10, power: 2, heal: 5, value: 60, glyph: '|', text: 'The coal sits in a brass cup and hums a little.' },
  cracked_lens: { name: 'Cracked Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 2, value: 12, glyph: 'o', text: 'Gathers lantern light into a point. The crack makes it angry.' },
  brass_lens: { name: 'Ground Brass Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 5, value: 60, glyph: 'o', text: 'Wren ground it for a week. It focuses light, and grudges.' },
  glim_shield: { name: 'Glimsteel Shield', slot: 'main', cls: 'warden', delay: 9, power: 7, defence: 6, value: 140, glyph: ']', text: 'Brass folded around glimmer. It hums when the Grey is near.' },
  greyglass_shield: { name: 'Greyglass Shield', slot: 'main', cls: 'warden', delay: 9, power: 10, defence: 8, value: 320, glyph: ']', text: 'You can see through it, a little. Things on the other side cannot see you.' },
  glim_staff: { name: 'Glimsteel Staff', slot: 'main', cls: 'mender', delay: 10, power: 4, heal: 8, value: 140, glyph: '|', text: 'The ember sits in a cage of glimmer and never cools.' },
  greyglass_staff: { name: 'Greyglass Staff', slot: 'main', cls: 'mender', delay: 10, power: 6, heal: 12, value: 320, glyph: '|', text: 'Light pools in it like water in a cupped hand.' },
  green_lens: { name: 'Green Glass Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 7, value: 100, glyph: 'o', text: 'Ground from shards nobody in Kindle poured. It throws a greenish light, and it throws it hard.' },
  glim_lens: { name: 'Glimsteel Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 8, value: 140, glyph: 'o', text: 'Ground so fine it sings when it focuses.' },
  greyglass_lens: { name: 'Greyglass Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 12, value: 320, glyph: 'o', text: 'Made from the Grey itself. It hates its relatives.' },
  scrap_shivs: { name: 'Scrap Shivs', slot: 'main', cls: 'drifter', delay: 7, power: 3, value: 12, glyph: 'x', text: 'Two sharp bits of something that used to be useful.' },
  brass_shivs: { name: 'Brass Shivs', slot: 'main', cls: 'drifter', delay: 7, power: 6, value: 60, glyph: 'x', text: 'They do not reflect light. Nobody knows how.' },
  glim_shivs: { name: 'Glimsteel Shivs', slot: 'main', cls: 'drifter', delay: 7, power: 9, value: 140, glyph: 'x', text: 'Two thin glints, gone before you see them.' },
  greyglass_shivs: { name: 'Greyglass Shivs', slot: 'main', cls: 'drifter', delay: 7, power: 13, value: 320, glyph: 'x', text: 'They cut the dark itself. The dark complains.' },

  // ---------- Rüstung ----------
  scrap_hood: { name: 'Scrap Hood', slot: 'head', defence: 1, value: 6, glyph: '^', text: 'Keeps the drizzle and some of the teeth off.' },
  scrap_coat: { name: 'Scrap Coat', slot: 'body', defence: 2, value: 10, glyph: 'M', text: 'Patched from sacks and old sails. Smells of both.' },
  scrap_boots: { name: 'Scrap Boots', slot: 'feet', defence: 1, value: 6, glyph: 'u', text: 'Two left boots, but very determined ones.' },
  ruff_hood: { name: 'Smoke-Ruff Hood', slot: 'head', defence: 2, light: 0.5, value: 22, glyph: '^', text: 'A scrap hood with a ruff of singed wolf fur. It smells of someone else\'s fire, and keeps the light close.' },
  brass_hood: { name: 'Brass Hood', slot: 'head', defence: 2, value: 30, glyph: '^', text: 'A helmet that was a kettle. Still whistles in wind.' },
  brass_coat: { name: 'Brass-Ringed Coat', slot: 'body', defence: 4, value: 50, glyph: 'M', text: 'Rings of brass sewn into leather. Clinks politely.' },
  brass_boots: { name: 'Brass-Toed Boots', slot: 'feet', defence: 2, value: 30, glyph: 'u', text: 'For kicking the Grey, and doors.' },
  glim_hood: { name: 'Glimsteel Hood', slot: 'head', defence: 3, value: 70, glyph: '^', text: 'A faint glow at the brow. Useful for reading in bed.' },
  glim_coat: { name: 'Glimsteel Coat', slot: 'body', defence: 5, value: 110, glyph: 'M', text: 'Wolf pelt lined with glimsteel rings. Warm and stubborn.' },
  glim_boots: { name: 'Glimsteel Boots', slot: 'feet', defence: 3, value: 70, glyph: 'u', text: 'Quiet on stone, loud on Greylings.' },
  shell_coat: { name: 'Beetle-Shell Coat', slot: 'body', defence: 6, value: 150, glyph: 'M', text: 'Plates from Copperdeep beetles. They were not using them any more.' },
  watchers_hood: { name: 'Watcher\'s Hood', slot: 'head', defence: 3, light: 1, value: 90, glyph: '^', text: 'Brindle\'s spare. A wolf-fur hood with a little brass lamp stitched to the brow, for long nights looking at nothing.' },
  wraithsilk_hood: { name: 'Wraithsilk Hood', slot: 'head', defence: 5, value: 220, glyph: '^', text: 'Lined with pages from a drowned hymnal. It hums the low part, very quietly, when something is about to hit you.' },
  wardstone_boots: { name: 'Wardstone Boots', slot: 'feet', defence: 5, value: 220, glyph: 'u', text: 'Beetle shell and greyglass, riveted. Every step sounds like a door closing on the Grey.' },
  greyglass_hood: { name: 'Greyglass Hood', slot: 'head', defence: 4, value: 160, glyph: '^', text: 'Your thoughts echo slightly inside it.' },
  choir_mantle: { name: 'Choir Mantle', slot: 'body', defence: 8, light: 1, value: 300, glyph: 'M', text: 'A singer\'s mantle from the old chapel, dried out and stitched with greyglass. It still hums the low part.' },
  greyglass_coat: { name: 'Greyglass Coat', slot: 'body', defence: 7, value: 260, glyph: 'M', text: 'Cold to wear, colder to hit.' },
  greyglass_boots: { name: 'Greyglass Boots', slot: 'feet', defence: 4, value: 160, glyph: 'u', text: 'They leave no footprints. Fen finds this deeply upsetting.' },

  // ---------- Laternen ----------
  tin_lantern: { name: 'Tin Lantern', slot: 'lantern', light: 0, burn: 1, value: 4, glyph: 'i', text: 'Everyone in Kindle gets one. Most of them still work.' },
  brass_lantern: { name: 'Brass Lantern', slot: 'lantern', light: 1.5, burn: 0.7, value: 45, glyph: 'i', text: 'Brighter and thriftier. Wren polished the reflector with a map.' },
  glim_lantern: { name: 'Glimsteel Lantern', slot: 'lantern', light: 2.5, burn: 0.55, value: 120, glyph: 'i', text: 'The glimmer holds some light back for later.' },
  shard_lantern: { name: 'Shard Lantern', slot: 'lantern', light: 4.5, burn: 0.3, value: 500, glyph: 'i', text: 'Built around a shard of the False Light. It burns for you now. Mostly.' },
  moth_lantern: { name: 'Moth Lantern', slot: 'lantern', light: 2, burn: 0.6, value: 90, glyph: 'i', text: 'Paper-thin glass, soft light. Moths love it. So do people walking home late.' },
  foremans_lamp: { name: 'Foreman\'s Lamp', slot: 'lantern', light: 2.5, burn: 0.5, value: 150, glyph: 'i', text: 'A brass mining lamp with a glimmer reflector. It went out for the Foreman. It lights for you.' },
  greyglass_lantern: { name: 'Greyglass Lantern', slot: 'lantern', light: 3.5, burn: 0.4, value: 280, glyph: 'i', text: 'It burns brightest where the Grey is thickest. Nobody likes to think about why.' },

  // ---------- Verbrauch ----------
  bread: { name: 'Bread', stack: true, use: { heal: 12 }, value: 3, glyph: 'n', text: 'Kindle bread. Dense enough to stop a door.' },
  lamp_oil: { name: 'Lamp Oil', stack: true, use: { oil: 40 }, value: 4, glyph: '!', text: 'Rendered from tallow. Pours slowly, burns gold.' },
  bitter_tonic: { name: 'Bitter Tonic', stack: true, use: { heal: 25 }, value: 8, glyph: '!', text: 'Tastes like a bad decision. Heals like a good one.' },
  moss_salve: { name: 'Moss Salve', stack: true, use: { heal: 40 }, value: 16, glyph: '!', text: 'Smells like a forest floor. Works like a miracle.' },
  dusk_draught: { name: 'Dusk Draught', stack: true, use: { glow: 200, oil: 30 }, value: 24, glyph: '!', text: 'Brewed from nightcaps. You glow, and so does your lantern.' },
  flare_candle: { name: 'Flare Candle', stack: true, use: { glow: 150, oil: 20 }, value: 18, glyph: '!', text: 'A fat candle with a glimmer wick. Burns white.' },
  lily_oil: { name: 'Lily Oil', stack: true, use: { oil: 80 }, value: 14, glyph: '!', text: 'Pressed from bog lilies. Burns clean and long.' },
  night_bread: { name: 'Night Bread', stack: true, use: { heal: 30 }, value: 7, glyph: 'n', text: 'Dark rye baked after midnight. It stays warm until morning, out of spite.' },
  moon_candle: { name: 'Moon Candle', stack: true, use: { glow: 240, oil: 35 }, value: 20, glyph: '!', text: 'Wax and moonwick. It burns pale and slow, and the Grey finds it rude.' },
  hearth_stew: { name: 'Hearth Stew', stack: true, use: { heal: 60 }, value: 6, glyph: 'u', text: 'Hollis will not say what is in it. It is brown, it is hot, and it fixes most things.' },
  ember_ale: { name: 'Ember Ale', stack: true, use: { heal: 12, glow: 90 }, value: 4, glyph: '!', text: 'Warm ale that glows faintly in the mug. You glow faintly too, for a while.' },
  wisp_draught: { name: 'Wisplight Draught', stack: true, use: { glow: 300, oil: 50 }, value: 30, glyph: '!', text: 'A wisp core dissolved in nightcap tea. Your lantern leans north for an hour, and burns very bright.' },
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
  moss_tuft: { name: 'Moss Tuft', stack: true, value: 4, glyph: '"', text: 'Soft, damp, faintly glowing. From Hushwood.' },
  nightcap: { name: 'Nightcap', stack: true, value: 6, glyph: 'T', text: 'A mushroom that only opens after dark.' },
  lily_bulb: { name: 'Lily Bulb', stack: true, value: 8, glyph: 'o', text: 'A bulb from the Sinkmarsh lilies. Oily and pale.' },
  greyglass: { name: 'Greyglass', stack: true, value: 20, glyph: '*', text: 'Glass made of fog, somehow. Cold and very sharp.' },
  wolf_pelt: { name: 'Wolf Pelt', stack: true, value: 6, glyph: '&', text: 'Thick grey fur that smells of pine and bad intentions.' },
  beetle_shell: { name: 'Beetle Shell', stack: true, value: 10, glyph: ')', text: 'A plate of stone-hard shell. Rook wants these.' },
  lamp_shard: { name: 'Lamp Shard', stack: true, value: 60, glyph: '*', text: 'A piece of the False Light. Still warm. Still wrong.' },
  prayer_tablet: { name: 'Prayer Tablet', stack: true, value: 0, glyph: '=', text: 'A cracked stone tablet. The prayer on it is not addressed to the Nightwright.' },
  moonwick: { name: 'Moonwick', stack: true, value: 8, glyph: '~', text: 'A wick spun from something that only comes out at night. Lampwrights pay well for it.' },
  sodden_hymnal: { name: 'Sodden Hymnal', stack: true, value: 3, glyph: '=', text: 'A swollen choir book. The hymns are not for the Nightwright. Brother Tallow wants to read them.' },
  choir_bell: { name: 'Choir Bell', stack: true, value: 0, glyph: 'A', text: 'A small green-bronze bell. When it rings, the water nearby goes very still.' },
  cold_glass: { name: 'Cold Lantern Glass', stack: true, value: 0, glyph: '*', text: 'Thick, greenish glass from a lantern. Nobody in Kindle makes glass like this.' },
  spyglass_lens: { name: 'Spyglass Lens', stack: true, value: 0, glyph: 'o', text: 'Wren ground it from Kindle glass and polished it with grey wisps. Everything far away looks a little closer, and a little more worrying.' },
  foremans_ledger: { name: 'Foreman\'s Ledger', stack: true, value: 0, glyph: '=', text: 'A damp mine ledger. Shift lists, wages, and page after page of crates sent north.' },
  green_shard: { name: 'Green Glass Shard', stack: true, value: 5, glyph: '*', text: 'A curved shard of thick green glass, like the cold lantern up north. Things in Hushwood keep finding them.' },
  wisp_core: { name: 'Wisp Core', stack: true, value: 12, glyph: 'o', text: 'The cold bead left when a will-o\'-wisp goes out. It still pulls at your lantern, very gently.' },
  // Tag 6 (Ama's Woodpile): Totholz vom Waldrand, gespalten. Jeder darf es spalten; Amas Stapel und das Leuchtfeuer nehmen es.
  split_log: { name: 'Split Log', stack: true, value: 2, glyph: '=', text: 'Dry deadfall, broken into lengths. Ama likes them bark-up on the pile.' },
  // Tag 6 (Oil for the Road): Wennas Dank. Grünes Glas, ein Docht aus Torffaser, Griff in Birkenrinde.
  carriers_lamp: { name: 'Carrier\'s Lamp', slot: 'lantern', light: 2.2, burn: 0.5, value: 160, glyph: 'i', text: 'A small lamp of thick green glass with a birch-bark grip. Carriers make them to last a whole road on one filling.' },
  // Tag 6, Nachschlag (the Spillway): Rüstung für Stufe 48 bis 50 und die Tafel der Überlaufwärter
  spillway_mail: { name: 'Spillway Mail', slot: 'body', defence: 14, value: 640, glyph: 'M', text: 'Scale mail riveted from the old sluicegate, green at every edge. It sheds water, and most other things.' },
  spillway_slate: { name: 'Spillway Slate', glyph: '#', value: 0, text: 'A small slate from the overflow, chalk still on it: "Overflow runs north. Keep it running. They need it more than we do."' },
  // Tag 6, Nachschlag: Amas Dank für vierzig Striche auf der Zähltafel
  woodward_hood: { name: 'Woodward\'s Hood', slot: 'head', defence: 3, light: 0.5, value: 80, glyph: '^', text: 'A felt hood with a sprig of birch stitched to the band. Ama gives one to anybody with forty lines on her board. She has given out four, ever.' },
  singed_tuft: { name: 'Singed Tuft', stack: true, value: 2, glyph: '&', text: 'A tuft of wolf fur, burnt at the tips. It smells of woodsmoke, and the wood was not from here.' },
  // Tag 3: der Pokal vom Snail Cup. Man trägt ihn auf dem Kopf, Mabb besteht darauf.
  snail_cup: { name: 'The Kindle Snail Cup', slot: 'head', defence: 1, light: 0.5, value: 5, glyph: 'U', text: 'A little brass cup hammered from an old kettle. It fits any head. Polish it and it catches the lantern light.' },
  abels_riddle: { name: "Abel's Note", stack: true, value: 0, glyph: '=', text: 'One: every Warden carries two things, and one is a shield. Two: what ended every hymn of the forty voices. Three: what the keeper of the Night Market is named for.' },
  // Tag 3 (Bogen): was die Träger am Nordrand verloren haben
  hollow_ration: { name: 'Peat-Smoked Ration', stack: true, use: { heal: 30 }, value: 6, glyph: '%', text: 'Hard brown bread, wrapped in birch bark. It smells of peat smoke. Nobody in Kindle bakes like this.' },
  tally_stick: { name: 'Notched Tally Stick', stack: true, value: 0, glyph: '/', text: 'A carrier\'s tally. Rows of notches, forty to a row. The last rows are short.' },
  carriers_wraps: { name: 'Carrier\'s Wraps', slot: 'feet', defence: 3, light: 0.5, value: 90, glyph: 'u', text: 'Leg wraps of oiled cloth with a tiny lamp-hook at the ankle. Made for walking a long way in the dark.' },
  abels_purse_1: { name: "Abel's First Purse", stack: true, value: 0, glyph: '$', text: 'A small leather purse, tied with a riddle-knot. Heavy for its size. Coyne will want to count it.' },
  abels_purse_2: { name: "Abel's Second Purse", stack: true, value: 0, glyph: '$', text: 'A small leather purse, tied with a riddle-knot. Heavy for its size. Coyne will want to count it.' },
  abels_purse_3: { name: "Abel's Third Purse", stack: true, value: 0, glyph: '$', text: 'A small leather purse, tied with a riddle-knot. Heavy for its size. Coyne will want to count it.' },
  sealed_ledger: { name: 'Sealed Ledger', stack: true, value: 0, glyph: '=', text: 'A ledger tied with red string and sealed with wax shaped like a coin. Corrections, in Coyne\'s smallest handwriting.' },
  prayer_slip: { name: 'Folded Prayer', stack: true, value: 0, glyph: '=', text: 'A strip of pale bark paper, folded small. The writing is neat, brown and not from Kindle.' },
  crow_feather: { name: 'Crow Feather', stack: true, value: 1, glyph: '/', text: 'Glossy and judgemental. Fen collects them for quills.' },

  // ---------- The Unending Maze und Cinderford (seit 2026-11-13, Gebet 4) ----------
  turn_chalk: { name: 'Turn Chalk', stack: true, value: 3, glyph: '/', text: 'Delvers mark the turns with it. By morning the Maze has rubbed every mark off.' },
  turnstone: { name: 'Turnstone', stack: true, value: 20, glyph: '*', text: 'A small stone, warm on one side. Every Keeper carries some. Hesk in Cinderford trades gear for them.' },
  cinder_cake: { name: 'Cinder Cake', stack: true, use: { heal: 60 }, value: 12, glyph: 'n', text: 'Baked on the quarry stones. Black on the outside, which is the point.' },
  delvers_lamp: { name: 'Delver\'s Lamp', slot: 'lantern', light: 1.8, burn: 0.7, value: 120, glyph: 'i', text: 'A squat lamp with a chalk-white shade. Ivy says it was made for corners.' },
  delvers_hood: { name: 'Delver\'s Hood', slot: 'head', defence: 4, light: 0.5, value: 140, glyph: '^', text: 'Padded leather with a candle stub over the brow. Built for low ceilings.' },
  delvers_boots: { name: 'Delver\'s Boots', slot: 'feet', defence: 5, value: 160, glyph: 'u', text: 'Hobnailed. They leave scratches the Maze cannot quite rub out.' },
  delvers_coat: { name: 'Delver\'s Coat', slot: 'body', defence: 9, value: 300, glyph: 'M', text: 'A long coat sewn with turnstone buttons. Each one is warm on the side facing the way out.' },
  // Tag 4 (Gebet 7): Flint in Cinderford gräbt Eisen aus dem Steinbruch; Seam Lurker im Old Shaft schlucken es.
  cinder_iron: { name: 'Cinder Iron', stack: true, value: 16, glyph: '%', text: 'Black quarry iron from under the hill. It rings when you drop it, and Rook says it remembers being hit.' },
  // Tag 4 (Abstimmung): Rooks Meisterstücke, nur an seiner guten Werkbank drinnen und erst nach „Rook's Masterwork“
  masterwork_shield: { name: 'Masterwork Shield', slot: 'main', cls: 'warden', delay: 9, power: 12, defence: 10, value: 480, glyph: ']', text: 'Cinder iron, folded twice and riveted with greyglass. Rook put his mark on the inside, where only you can see it.' },
  masterwork_shivs: { name: 'Masterwork Shivs', slot: 'main', cls: 'drifter', delay: 7, power: 15, value: 480, glyph: 'x', text: 'Two black blades that ring like a bell when they touch. Rook says do not let them touch.' },
  masterwork_hood: { name: 'Masterwork Hood', slot: 'head', defence: 6, light: 0.5, value: 300, glyph: '^', text: 'An iron cap with a glimmer chip set over the brow. It fits like it was measured, because it was.' },
  masterwork_boots: { name: 'Masterwork Boots', slot: 'feet', defence: 6, value: 300, glyph: 'u', text: 'Iron-toed, beetle-soled. They do not squeak. Rook made sure. Rook hates squeaks.' },
  masterwork_coat: { name: 'Masterwork Coat', slot: 'body', defence: 10, value: 420, glyph: 'M', text: 'Overlapping plates of cinder iron on oiled leather. It weighs less than it looks and more than you hoped.' },
  chapel_chalk: { name: 'Chapel Chalk', stack: true, value: 0, glyph: '/', text: 'A stick of white chalk from the chapel. Tallow uses it to write the hymn numbers. Fen uses it for everything else.' },
  shadow_tracing: { name: 'Shadow Tracing', stack: true, value: 0, glyph: '=', text: 'Your own shadow, drawn in chalk on a sheet of bark paper by Beacon-light. It looks taller than you. Fen says shadows always do.' },
  cinder_lantern: { name: 'Cinder Iron Lantern', slot: 'lantern', light: 3.8, burn: 0.4, value: 360, glyph: 'i', text: 'A heavy black lantern with a wisp core behind the glass. Iron holds the heat, so the oil lasts. Wren made the first one and will not stop talking about it.' },
  cinder_staff: { name: 'Cinder Iron Staff', slot: 'main', cls: 'mender', delay: 10, power: 7, heal: 14, value: 480, glyph: '|', text: 'A black iron staff that stays warm all night. Wren set an ember in the top, and it has not gone out once.' },
  cinder_lens: { name: 'Cinder Iron Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 14, value: 480, glyph: 'o', text: 'Greyglass ground thin and held in a ring of cinder iron. It throws light like a shovel throws dirt.' },
  crossed_map: { name: 'Map Full of Crosses', stack: true, value: 0, glyph: '=', text: 'A charcoal map of everything around Kindle, every place crossed out. Only one spot, far north of the North Watch, has a circle instead. On the back: "Not here either."' },
  unsent_letter: { name: 'Unsent Letter', stack: true, value: 0, glyph: '=', text: '"Dear Mother, the fog is fine, the people are fine, I am fine. The one in the hat sends her love. I will bring her home when the road opens. Are your maps still wrong by evening?" Not signed.' },
  ivys_map: { name: "Ivy's Map of Kindle", stack: true, value: 0, glyph: '=', text: 'A careful map of Kindle, drawn from memory. Every house is in the right place. It is the only map Ivy has ever drawn that will still be right tonight.' },
  duchess_hat: { name: "Duchess's Spare Hat", slot: 'head', defence: 2, light: 0.3, value: 25, glyph: '^', text: 'A tiny green felt hat with a feather, made for a snail and stretched, with some violence, for a person. It still smells faintly of lettuce.' },
  cart_wheel: { name: 'Cart Wheel', stack: true, value: 0, glyph: 'o', text: 'An iron-rimmed wheel from Rook\'s yard. Rook says it is the best wheel in the Grey. Rook says that about every wheel.' },
  // Tag 4, Nachschlag: stärkere Heilung für Stufe 30 bis 40 (Alchemie 28 und 32)
  hearth_salve: { name: 'Hearthroot Salve', stack: true, use: { heal: 90 }, value: 28, glyph: '!', text: 'Emberroot and moss, cooked down until it is warm to hold. Rub it in and the cold goes out of the bruise.' },
  seam_tonic: { name: 'Deep Seam Tonic', stack: true, use: { heal: 140, oil: 20 }, value: 40, glyph: '!', text: 'Lily, nightcap and a pinch of ground glimmer. Flint swears by it. Flint swears by most things.' },
  rooks_tongs: { name: "Rook's Old Tongs", stack: true, value: 0, glyph: '/', text: 'Iron tongs, worn smooth where nine fingers held them. Tansy says they belong on the good bench.' },
  keepers_lantern: { name: 'Keeper\'s Lantern', slot: 'lantern', light: 4, burn: 0.35, value: 600, glyph: 'i', text: 'Made from the lamp of a Keeper. It lights every corner at once, and seems to enjoy it.' },
  // ---------- Tag 5: The Sumps unter Cinderford (Gebet 9) ----------
  verdigris: { name: 'Verdigris', stack: true, value: 20, glyph: '%', text: 'Green crust scraped off the old brass pipes under Cinderford. Rook says it is brass that has been thinking for too long.' },
  sluice_handle: { name: 'Sluice Handle', stack: true, value: 0, glyph: '*', text: 'A heavy iron wheel with six spokes, black with lamp soot. It fits the weir at the end of the Sumps.' },
  weir_lamp: { name: 'Weir Lamp', slot: 'lantern', light: 4.2, burn: 0.45, value: 640, glyph: 'i', text: 'The sluice-keepers\' old lamp, dragged out of the weir. Green brass, thick glass, and a flame that leans downstream.' },
  sumpwalker_boots: { name: 'Sumpwalker Boots', slot: 'feet', defence: 7, value: 360, glyph: 'u', text: 'Tall iron-shod boots sealed with verdigris. Your feet stay dry, which down there feels like magic.' },
  sumpwalker_hood: { name: 'Sumpwalker Hood', slot: 'head', defence: 7, light: 0.5, value: 360, glyph: '^', text: 'A riveted hood with a little brass lamp-hook over the brow, copied from the sluice-keepers.' },
  sumpwalker_coat: { name: 'Sumpwalker Coat', slot: 'body', defence: 12, value: 500, glyph: 'M', text: 'Cinder iron plates on oilskin, green at every seam. It smells of the Sumps for a week, and then of nothing.' },
  verdigris_staff: { name: 'Verdigris Staff', slot: 'main', cls: 'mender', delay: 10, power: 8, heal: 16, value: 520, glyph: '|', text: 'Cinder iron sealed in green brass, the ember sitting in a cup of it. It stays warm in the wettest dark.' },
  verdigris_lens: { name: 'Verdigris Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 16, value: 520, glyph: 'o', text: 'Greyglass ground thin and set in a green brass ring. Light comes out of it like water out of a sluice.' },
  sluice_draught: { name: 'Sluice Draught', stack: true, use: { heal: 170, oil: 25 }, value: 48, glyph: '!', text: 'Green, cold, and thick as the Sumps. The sluice-keepers drank it before going down. It tastes like a pipe.' },
  // ---------- Tag 5: The Old Mill (Abstimmung) und Wenna (Bogen) ----------
  barley: { name: 'Barley', stack: true, value: 2, glyph: '"', text: 'A handful of Fernmeadow barley. The crows planted most of it by accident, and want it back.' },
  mill_flour: { name: 'Mill Flour', stack: true, value: 6, glyph: '%', text: 'A small sack of flour from the Old Mill. Hollis at the tavern bakes it into millbread.' },
  millbread: { name: 'Millbread', stack: true, use: { heal: 45, oil: 5 }, value: 10, glyph: 'n', text: 'A round loaf from the Old Mill\'s flour, baked by Hollis. Still warm in the middle for hours, which helps a lamp along.' },
  glass_grit: { name: 'Glass Grit', stack: true, value: 14, glyph: '%', text: 'Green glass ground fine at the Old Mill. Somebody used to pour it into lanterns. Somebody up north still does.' },
  hollow_glass_lantern: { name: 'Hollow-Glass Lantern', slot: 'lantern', light: 3, burn: 0.5, value: 200, glyph: 'i', text: 'Thick green glass poured from mill grit, the way Wenna says they do it at home. The light it throws is a little green, and very steady.' },
  millers_ledger: { name: "The Miller's Ledger", stack: true, value: 0, glyph: '=', text: 'A flour-dusted account book. Sacks of flour for Kindle, and every month, sacks of glass grit "up the north road, for the Hollow". The last page is a list of names, crossed out one by one.' },
  tin_face: { name: 'Tin Face', stack: true, value: 0, glyph: 'o', text: 'A tin plate hammered into a face with a very rude expression. Rook says it is a portrait of a crow\'s worst nightmare. It looks a bit like Rook.' },
  hollow_barley: { name: 'Grey Barley', stack: true, value: 0, glyph: '"', text: 'Small grey grains with a smell of peat smoke. They did not grow anywhere near Kindle.' },
  // Tag 7: die erloschene Laterne des Strangers (Quest „A Lamp Gone Out“) und Wennas Dank für eine Woche Brot
  // Tag 7, Nachschlag: the Overflow Run (Stufe 50 bis 54)
  run_iron: { name: 'Run Iron', stack: true, value: 30, glyph: '*', text: 'Bronze-green iron from the old pump workings under Cinderford. It never quite dries, and it never rusts.' },
  gate_rubbing: { name: 'Gate Rubbing', stack: true, value: 0, glyph: '=', text: 'Chalk on paper, taken from the iron gate at the end of the Overflow Run: NORTH, TO THE HOLLOW. KEEP IT RUNNING.' },
  run_iron_shield: { name: 'Run Iron Shield', slot: 'main', cls: 'warden', delay: 9, power: 14, defence: 12, value: 640, glyph: ']', text: 'Pump iron on a cinder iron frame. Water runs off it, and so do most other things.' },
  run_iron_shivs: { name: 'Run Iron Shivs', slot: 'main', cls: 'drifter', delay: 7, power: 18, value: 640, glyph: 'x', text: 'Two green-black blades that are always slightly wet. Nobody has ever seen them rust.' },
  run_iron_staff: { name: 'Run Iron Staff', slot: 'main', cls: 'mender', delay: 10, power: 9, heal: 19, value: 640, glyph: '|', text: 'The ember sits in a pump-valve of run iron and breathes in and out with you.' },
  run_iron_lens: { name: 'Run Iron Lens', slot: 'main', cls: 'flarecaster', delay: 10, power: 19, value: 640, glyph: 'o', text: 'Greyglass in a run-iron ring that never fogs. The light comes out of it cold and very straight.' },
  pump_lamp: { name: 'Pump Lamp', slot: 'lantern', light: 4.6, burn: 0.4, value: 720, glyph: 'i', text: 'The quarrymen\'s lamp from the Pumpwarden\'s chest, still lit when you prised it out. It burns low and very steady, and the flame leans north.' },
  culvert_hood: { name: 'Culvert Hood', slot: 'head', defence: 9, light: 0.5, value: 480, glyph: '^', text: 'A run-iron cap with a lamp-hook and a drip lip, so the water goes round your face instead of into it.' },
  culvert_coat: { name: 'Culvert Coat', slot: 'body', defence: 16, value: 760, glyph: 'M', text: 'Run-iron scales on oiled canvas. It never rusts, and it never quite dries. You get used to the second part.' },
  culvert_boots: { name: 'Culvert Boots', slot: 'feet', defence: 9, value: 520, glyph: 'u', text: 'Pump-keepers\' boots with run-iron toecaps. Hesk had a pair put by for whoever reached the north gate.' },
  river_stone: { name: 'River Stone', stack: true, value: 0, glyph: 'o', text: 'Flat, grey and smooth as soap, still cold. Rivers made it. There is no river anywhere near the north road.' },
  fens_drawing: { name: 'Fen\'s Drawing', stack: true, value: 0, glyph: '=', text: 'Chapel paper, crayon: a very big Beacon, a very small Kindle, and a dotted line going north with loaves on it. A goose supervises.' },
  strangers_lamp: { name: 'The Stranger\'s Lamp', stack: true, value: 0, glyph: 'i', text: 'A carrier\'s lamp of thick green glass, cracked across one pane and cold for a long time. The wick is a stub. It weighs more than it looks.' },
  sackcloth_mantle: { name: 'Sackcloth Mantle', slot: 'body', defence: 6, light: 0.5, value: 120, glyph: 'M', text: 'Wenna stitched it from Kindle\'s empty flour sacks, with birch bark at the shoulders. It smells of the mill, and a little of peat smoke.' },
  wennas_lantern: { name: 'Wenna\'s Lantern', stack: true, value: 0, glyph: 'i', text: 'A carrier\'s lantern of thick green glass, empty and cold. The handle is wrapped in birch bark.' },

  // ---------- Tag 8: The Stone Road (Abstimmung „north-road-fires“) und die Hollow Wardens (Bogen) ----------
  peat_brick: { name: 'Peat Brick', stack: true, value: 8, glyph: '#', text: 'A brick of cut peat from the bogs along the Stone Road. It burns slow and smoky. Somebody up north burns nothing else.' },
  moth_dust: { name: 'Moth Dust', stack: true, value: 9, glyph: '%', text: 'Grey dust off an ash moth\'s wings. It glows faintly when it is near a flame, as if it remembers being drawn to one.' },
  hollow_bead: { name: 'Hollow Bead', stack: true, value: 6, glyph: 'o', text: 'A small bead of thick green glass on a loop of birch twine. Every Hollow Warden carries a string of them.' },
  chalked_log: { name: 'Chalked Log', stack: true, value: 0, glyph: '=', text: 'A split log, bark up, with a chalk line on the end. Ama\'s chalk. Ama\'s line.' },
  cairnwalker_cloak: { name: 'Cairnwalker Cloak', slot: 'body', defence: 9, light: 1, value: 360, glyph: 'M', text: 'Brindle\'s spare cloak, oiled grey wool with a pocket for a flask of oil and a hook for a lamp. The hem is still muddy from the first stone.' },
  road_lamp: { name: 'Road Lamp', slot: 'lantern', light: 4, burn: 0.4, value: 420, glyph: 'i', text: 'Green grit glass dusted inside with moth dust, in a cinder-iron cage. It glows a little even before you light it, and moths follow it home.' },
  peat_oil: { name: 'Peat Oil', stack: true, use: { oil: 60 }, value: 22, glyph: '!', text: 'Dark oil rendered from peat over a slow fire. It smells of somebody else\'s hearth. A good long pour for a lantern on a long road.' },
  moth_draught: { name: 'Moth Draught', stack: true, use: { glow: 400, oil: 50 }, value: 36, glyph: '!', text: 'Moth dust stirred into nightcap tea. You glow for a long time, and every moth for a mile knows where you are.' },
  culvert_draught: { name: 'Culvert Draught', stack: true, use: { heal: 220, oil: 30 }, value: 60, glyph: '!', text: 'Verdigris, lily and a crumb of peat, boiled down black. Tastes of the Sumps and a stranger\'s hearth. Works.' },
  peat_tonic: { name: 'Peat Tonic', stack: true, use: { heal: 280, oil: 40 }, value: 80, glyph: '!', text: 'Greyglass ground into peat broth. It warms from the inside out, the way a peat fire does: slowly, and for a long time.' },
  heron_plume: { name: 'Heron Plume', stack: true, value: 20, glyph: '/', text: 'A long grey feather that is mostly fog. It stays dry in the rain and cold in the hand.' },
  heron_hood: { name: 'Heron Hood', slot: 'head', defence: 6, light: 1, value: 320, glyph: '^', text: 'A hood lined with heron plumes, fog-grey and very light. Rain runs off it, and so do most other things.' },
  hollow_string: { name: 'Hollow String', slot: 'head', defence: 5, light: 1, value: 240, glyph: '^', text: 'The Stranger tied three green beads onto a band of birch twine. "One for each house that still has its fire," he said. Wear it on your brow; it catches the lamplight.' },
};

// Ausrüstungsplätze in der Reihenfolge, in der das Fenster sie zeigt.
// delay: Waffentempo in Takten (300 ms) für den automatischen Angriff. Ohne Waffe: UNARMED_DELAY.
export const UNARMED_DELAY = 8;

export const SLOTS = ['main', 'head', 'body', 'feet', 'lantern'];
export const SLOT_NAMES = { main: 'HAND', head: 'HEAD', body: 'BODY', feet: 'FEET', lantern: 'LANTERN' };
// Seit 2026-11-13 (Gebet 3): doppelt so groß wie am Anfang.
export const BAG_SIZE = 48;
