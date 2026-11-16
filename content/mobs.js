// Wesen. Zeiten in Takten (ein Takt = TICK_MS aus shared/sim.js). Erfahrung geht an die aktive Klasse.
//   ai: 'grey'   Nebelwesen: mutig im Dunkeln, meiden helles Licht wie eine Wand
//       'beast'  Raubtier: greift auch im Licht an, kommt aber nicht ins Dorf
//       'animal' wehrt sich nur, wenn man es angreift
//   level: grobe Stufe (Anzeige und Balance).  moveEvery: Takte pro Schritt (0 = bewegt sich nie).
//   special: angekündigter Angriff, markiert den Boden und trifft nach delay Takten, wer dann noch dort steht.
//            delay: Takte Vorwarnung (doppelt so lang wie früher), dafür trifft es hart: ausweichen lohnt.
//            pattern: plus (Kreuz um das Ziel), ring (alle Felder um das Wesen), line (drei Felder vom Wesen
//            zum Ziel), bigplus (Kreuz mit Reichweite 2 um das Ziel).
//   drainOil: Treffer stiehlt so viel Lampenöl.
//   specials: mehrere angekündigte Angriffe im Wechsel (statt special).
//   boss: { phase2At (Anteil HP), phase2Text, snuff (löscht alle Lichter im Gebiet), shroud (Schadensfaktor
//         im Dunkeln in Phase 2), deathText }. Bosse heilen und zünden die Lichter wieder an, wenn alle fliehen.
//   drops: [Gegenstand, Chance, min, max].  gold: [min, max].

export const MOBS = {
  crow: {
    name: 'Crow', sprite: 'crow', level: 1, ai: 'animal',
    hp: 6, hit: [1, 1], attackEvery: 5, aggro: 0, leash: 6, respawn: 25, xp: 3,
    drops: [['crow_feather', 0.7, 1, 2], ['barley', 0.6, 1, 2]], gold: [0, 1],
    examine: 'It is judging you. Crows judge everyone.',
  },
  greyling: {
    name: 'Greyling', sprite: 'greyling', level: 3, ai: 'grey',
    hp: 18, hit: [2, 3], attackEvery: 4, aggro: 5, leash: 9, respawn: 40, xp: 12,
    drops: [['grey_wisp', 0.6, 1, 1], ['scrap', 0.25, 1, 2]], gold: [1, 4],
    special: { every: 3, delay: 6, pattern: 'plus', hit: [10, 13], text: 'The Greyling gathers itself, low and grey.' },
    examine: 'A bit of the Grey that has decided to have a shape. It does not like your lantern.',
  },
  wolf: {
    name: 'Hushwood Wolf', sprite: 'wolf', level: 12, ai: 'beast',
    hp: 45, hit: [5, 7], attackEvery: 4, aggro: 6, leash: 10, respawn: 60, xp: 35,
    drops: [['wolf_pelt', 0.5, 1, 1], ['green_shard', 0.15, 1, 1]], gold: [3, 8],
    special: { every: 3, delay: 4, pattern: 'line', hit: [16, 21], text: 'The wolf drops low. It is going to charge.' },
    examine: 'It makes no sound on the needles. Neither does anything else in Hushwood.',
  },
  restless_wolf: {
    // Seit Tag 2: Wölfe, die aus Hushwood herauswandern und am Waldrand von Fernmeadow herumstreunen
    // (Stufe 6-9, füllt die Lücke zwischen Greylingen und Hushwood). Ihr Fell ist an den Spitzen versengt.
    name: 'Restless Wolf', sprite: 'restless_wolf', level: 7, ai: 'beast',
    hp: 36, hit: [4, 6], attackEvery: 4, aggro: 5, leash: 8, respawn: 45, xp: 22,
    drops: [['singed_tuft', 0.5, 1, 1], ['wolf_pelt', 0.2, 1, 1]], gold: [2, 5],
    special: { every: 3, delay: 5, pattern: 'line', hit: [9, 12], text: 'The wolf flattens its ears and bunches up. It is going to lunge.' },
    examine: 'Thin, jumpy, and far from the trees. The tips of its fur are singed, as if it ran past a fire.',
  },
  moss_spirit: {
    name: 'Moss Spirit', sprite: 'moss_spirit', level: 14, ai: 'grey',
    hp: 55, hit: [4, 6], attackEvery: 4, aggro: 5, leash: 8, respawn: 70, xp: 42,
    drops: [['moss_tuft', 0.4, 1, 2], ['grey_wisp', 0.3, 1, 1], ['green_shard', 0.2, 1, 1]], gold: [2, 6],
    special: { every: 3, delay: 6, pattern: 'ring', hit: [14, 19], text: 'The moss spirit swells. Spores drift around it.' },
    examine: 'Moss that has learned to walk, and has opinions about trespassers.',
  },
  grey_gnawer: {
    // Seit Tag 3 (Bogen): Nebelwesen am Nordrand von Hushwood, die an den Vorräten fremder Träger nagen.
    // Rolle: normal, Stufe 17 (zwischen Moosgeistern 14 und Steinkäfern 18).
    name: 'Grey Gnawer', sprite: 'grey_gnawer', level: 17, ai: 'grey',
    hp: 66, hit: [7, 9], attackEvery: 4, aggro: 5, leash: 8, respawn: 70, xp: 52,
    drops: [['hollow_ration', 0.5, 1, 1], ['grey_wisp', 0.3, 1, 1], ['scrap', 0.3, 1, 2]], gold: [4, 9],
    special: { every: 3, delay: 5, pattern: 'plus', hit: [18, 23], text: 'The gnawer hunches over, teeth first. It is about to lunge at you.' },
    examine: 'A low grey thing with too many teeth, chewing on something that is not its own.',
  },
  seam_lurker: {
    // Tag 4: Rolle normal, Stufe 38 (zwischen Choir Wraith 36 und Lamplighter 40). Lebt im tiefen Flöz östlich
    // des Old Shaft in Copperdeep und frisst Erz; in seinem Bauch findet man Cinder Iron (Rooks Meisterstücke).
    name: 'Seam Lurker', sprite: 'seam_lurker', level: 38, ai: 'beast', moveEvery: 0,
    hp: 400, hit: [21, 26], attackEvery: 4, aggro: 4, leash: 7, respawn: 110, xp: 190,
    drops: [['cinder_iron', 0.5, 1, 1], ['glimmer', 0.4, 1, 2], ['greyglass', 0.15, 1, 1]], gold: [14, 28],
    special: { every: 3, delay: 6, pattern: 'line', hit: [44, 54], text: 'The lurker flattens itself against the rock. The seam in front of it starts to glow.' },
    examine: 'A slab of rock that eats other rock. The glowing veins in its back are the ore it has not finished yet.',
  },
  stone_beetle: {
    name: 'Stone Beetle', sprite: 'stone_beetle', level: 18, ai: 'beast', moveEvery: 2,
    hp: 80, hit: [7, 9], attackEvery: 5, aggro: 4, leash: 8, respawn: 80, xp: 60,
    drops: [['beetle_shell', 0.5, 1, 1], ['scrap', 0.4, 1, 3]], gold: [5, 12],
    special: { every: 3, delay: 6, pattern: 'ring', hit: [22, 29], text: 'The beetle rears up. The ground around it is about to have a bad day.' },
    examine: 'Slow, heavy and mostly shell. The shell is the problem.',
  },
  pit_worm: {
    name: 'Pit Worm', sprite: 'pit_worm', level: 22, ai: 'beast', moveEvery: 0,
    hp: 70, hit: [9, 12], attackEvery: 4, aggro: 3, leash: 3, respawn: 70, xp: 70,
    drops: [['glimmer', 0.25, 1, 1], ['brass_bits', 0.4, 1, 2]], gold: [6, 12],
    special: { every: 2, delay: 4, pattern: 'plus', hit: [22, 29], text: 'The worm sinks back. Something is coming up under you.' },
    examine: 'It never leaves its hole. It does not need to.',
  },
  old_foreman: {
    // Seit Tag 2: der verlassene Vorarbeiter im Nordosten von Copperdeep. Einzel-Boss für Stufe 19-22:
    // allein mit Einsatz (Tränke, Ausweichen), zu zweit bequem. Er arbeitet noch an seiner letzten Schicht.
    name: 'The Old Foreman', sprite: 'old_foreman', level: 21, ai: 'grey', moveEvery: 2,
    hp: 900, hit: [16, 19], attackEvery: 4, aggro: 4, leash: 10, respawn: 600, xp: 420,
    drops: [['foremans_ledger', 1, 1, 1], ['foremans_lamp', 0.3, 1, 1], ['glimmer', 0.8, 1, 3], ['brass_bits', 0.8, 2, 4]], gold: [30, 55],
    specials: [
      { every: 1, delay: 6, pattern: 'ring', hit: [32, 38], text: 'The Old Foreman swings his pick round in a wide, tired arc.' },
      { every: 1, delay: 6, pattern: 'bigplus', hit: [28, 34], text: 'The Old Foreman stamps. Dust trickles down. The ground is going to give.' },
    ],
    specialEvery: 3,
    // Ohne Phase 2: heilt sich nur, wenn alle gehen (wie ein Boss), und meldet sein Ende.
    boss: { deathText: 'The Old Foreman sets down his pick. For the first time in a hundred years, his shift is over.' },
    examine: 'A miner, grey as the dust. He is still finishing his last shift, and he would like you off his seam.',
  },
  will_o_wisp: {
    name: 'Will-o\'-Wisp', sprite: 'will_o_wisp', level: 25, ai: 'grey', drainOil: 12,
    hp: 60, hit: [6, 8], attackEvery: 4, aggro: 6, leash: 10, respawn: 70, xp: 75,
    drops: [['grey_wisp', 0.8, 1, 2], ['glimmer', 0.2, 1, 1], ['wisp_core', 0.45, 1, 1]], gold: [4, 10],
    special: { every: 3, delay: 6, pattern: 'plus', hit: [19, 24], text: 'The wisp flickers. Your lantern flickers with it.' },
    examine: 'A light that eats light. It is very interested in your lantern.',
  },
  bog_toad: {
    name: 'Bog Toad', sprite: 'bog_toad', level: 28, ai: 'beast', moveEvery: 2,
    hp: 120, hit: [11, 14], attackEvery: 5, aggro: 4, leash: 8, respawn: 90, xp: 95,
    drops: [['lily_bulb', 0.3, 1, 1], ['scrap', 0.3, 1, 3]], gold: [8, 16],
    special: { every: 3, delay: 6, pattern: 'bigplus', hit: [32, 42], text: 'The toad inflates. Everyone nearby should not be.' },
    examine: 'About the size of a cart, and twice as smug.',
  },
  mire_lurker: {
    // Lauert im tiefen Sumpf am Südrand von Sinkmarsh (Stufe 30-34, Brücke zur Drowned Chapel).
    name: 'Mire Lurker', sprite: 'mire_lurker', level: 31, ai: 'beast', moveEvery: 2,
    hp: 200, hit: [12, 15], attackEvery: 4, aggro: 3, leash: 7, respawn: 100, xp: 115,
    drops: [['sodden_hymnal', 0.5, 1, 1], ['lily_bulb', 0.3, 1, 2], ['scrap', 0.3, 1, 3]], gold: [10, 18],
    special: { every: 3, delay: 6, pattern: 'line', hit: [34, 42], text: 'The mire bulges. Something long is coming up through it.' },
    examine: 'Mostly mouth, a little moss. It swallowed a choir book once and now it hums.',
  },
  lamplighter: {
    // Gruppen-Boss: gedacht für vier Spieler um Stufe 38 mit Ausrüstung (etwa zwei Minuten).
    // Wer ihn zu zweit langsam zermürben will, erlebt nach 4 Minuten seine Wut (enrage).
    name: 'The Lamplighter', sprite: 'lamplighter', level: 40, ai: 'beast',
    hp: 14000, hit: [24, 30], attackEvery: 5, aggro: 7, leash: 12, respawn: 900, xp: 4000,
    drops: [['lamp_shard', 1, 1, 1], ['greyglass', 0.8, 2, 3]], gold: [80, 140],
    specials: [
      { every: 1, delay: 6, pattern: 'ring', hit: [60, 72], text: 'The Lamplighter swings his lamp in a wide circle.' },
      { every: 1, delay: 6, pattern: 'bigplus', hit: [55, 68], text: 'The Lamplighter raises his lamp. Light pools around you.' },
    ],
    specialEvery: 3,
    boss: {
      phase2At: 0.5,
      phase2Text: 'The Lamplighter breathes in. Every light in the chapel goes out.',
      snuff: true,
      shroud: 0.5,
      // Nach enrage.after Takten Kampf schlägt er mult-mal so hart (normale Schläge und Flächen).
      enrage: { after: 800, mult: 2, text: 'The Lamplighter\'s lamp burns white. He is done being patient.' },
      deathText: 'The False Light goes out. Somewhere far off in the Grey, another light flickers.',
    },
    examine: 'Tall, thin, patient. He tends a light that should not be burning.',
  },
  choir_wraith: {
    // Seit Tag 2: Sänger des ertrunkenen Chors in den Seitenschiffen der Drowned Chapel (Stufe 36, normal).
    // Schließt die Lücke zwischen den Pilgern (32) und dem Lamplighter (40).
    name: 'Choir Wraith', sprite: 'choir_wraith', level: 36, ai: 'grey',
    hp: 170, hit: [15, 18], attackEvery: 4, aggro: 5, leash: 8, respawn: 120, xp: 160,
    drops: [['greyglass', 0.4, 1, 1], ['sodden_hymnal', 0.25, 1, 1], ['grey_wisp', 0.5, 1, 2]], gold: [14, 26],
    special: { every: 3, delay: 6, pattern: 'ring', hit: [40, 50], text: 'The wraith draws a long breath for the low note. The water around it shivers.' },
    examine: 'One of the forty voices. It still sings the low part, and it does not like being interrupted.',
  },
  drowned_pilgrim: {
    name: 'Drowned Pilgrim', sprite: 'drowned_pilgrim', level: 32, ai: 'grey',
    hp: 110, hit: [12, 15], attackEvery: 4, aggro: 5, leash: 9, respawn: 120, xp: 120,
    drops: [['greyglass', 0.35, 1, 1], ['grey_wisp', 0.5, 1, 2], ['sodden_hymnal', 0.3, 1, 1]], gold: [10, 20],
    special: { every: 3, delay: 6, pattern: 'ring', hit: [35, 45], text: 'The pilgrim lifts its lamp. Water rises around it.' },
    examine: 'It came here to pray a long time ago. It is still praying, to something else.',
  },
  // ---------- The Sumps unter Cinderford (Tag 5, Gebet 9) ----------
  drain_rat: {
    // Rolle nebenbei, Stufe 40. Kommen zu zweit oder dritt aus dem Rattennest; Lampen stören sie nicht (beast).
    name: 'Drain Rat', sprite: 'drain_rat', level: 40, ai: 'beast',
    hp: 230, hit: [17, 21], attackEvery: 4, aggro: 5, leash: 8, respawn: 90, xp: 160,
    drops: [['verdigris', 0.35, 1, 1], ['scrap', 0.4, 1, 3], ['brass_bits', 0.3, 1, 2]], gold: [12, 22],
    special: { every: 3, delay: 5, pattern: 'plus', hit: [36, 44], text: 'The rat rears up and shrieks. Its friends in the walls shriek back.' },
    examine: 'A rat the size of a dog, wearing a crust of green brass from the old pipes. It has opinions about lanterns.',
  },
  silt_crawler: {
    // Rolle normal, Stufe 43. Liegt im Schlamm der Zisterne und meidet die Lampen-Nischen (grey).
    name: 'Silt Crawler', sprite: 'silt_crawler', level: 43, ai: 'grey',
    hp: 520, hit: [20, 24], attackEvery: 4, aggro: 5, leash: 8, respawn: 120, xp: 250, drainOil: 2,
    drops: [['verdigris', 0.5, 1, 2], ['greyglass', 0.2, 1, 1], ['grey_wisp', 0.4, 1, 2]], gold: [16, 30],
    special: { every: 3, delay: 6, pattern: 'line', hit: [44, 52], text: 'The crawler sucks in a long breath of silt. Mud is about to come out of the other end, fast.' },
    examine: 'Mostly mud, partly eel, entirely unpleasant. It drinks lamp oil if you let it get close.',
  },
  the_undertow: {
    // Rolle Boss (allein mit Einsatz), Stufe 46. Sitzt im Wehr am Ende der Sumps und zieht alles hinunter.
    // Ohne Phase 2 (wie The Old Foreman): heilt sich, wenn alle gehen.
    name: 'The Undertow', sprite: 'the_undertow', level: 46, ai: 'beast', moveEvery: 2,
    hp: 3000, hit: [26, 31], attackEvery: 4, aggro: 5, leash: 10, respawn: 600, xp: 1600,
    drops: [['verdigris', 1, 2, 4], ['weir_lamp', 0.25, 1, 1], ['greyglass', 0.7, 1, 2]], gold: [60, 110],
    specials: [
      { every: 1, delay: 6, pattern: 'ring', hit: [70, 82], text: 'The Undertow sinks and turns. The water all around it starts to pull.' },
      { every: 1, delay: 6, pattern: 'bigplus', hit: [64, 76], text: 'The Undertow rises out of the weir. Four streams of black water lift toward you.' },
    ],
    specialEvery: 3,
    boss: { deathText: 'The Undertow lets go. Somewhere far below, the weir grinds open, and the water runs clear for the first time in years.' },
    examine: 'A knot of water that should not hold a shape, wrapped round a rusted sluice wheel. It pulls at your boots from three steps away.',
  },
  // ---------- Tag 6, Nachschlag: the Spillway unter der Zisterne der Sumps (Stufe 46 bis 50) ----------
  weir_eel: {
    // Rolle normal, Stufe 47. Lange, schnelle Aale aus dem Überlauf; meiden die Lampen-Nischen (grey).
    name: 'Weir Eel', sprite: 'weir_eel', level: 47, ai: 'grey',
    hp: 620, hit: [21, 25], attackEvery: 4, aggro: 5, leash: 8, respawn: 120, xp: 340, drainOil: 2,
    drops: [['verdigris', 0.5, 1, 2], ['greyglass', 0.3, 1, 1], ['lily_bulb', 0.3, 1, 1]], gold: [20, 34],
    special: { every: 3, delay: 6, pattern: 'line', hit: [44, 52], text: 'The eel coils back into the water. It is about to come out of it very fast, in a straight line.' },
    examine: 'An eel as long as a cart, black as the water, with a ridge of green brass along its back. It came up the overflow, and likes it here.',
  },
  old_sluicegate: {
    // Rolle Boss (allein mit Einsatz, zu zweit gut), Stufe 49. Das eiserne Schütz am Ende des Überlaufs, das die
    // Quarrymen gegen den Grey bauten. Irgendwann fing es an, sich zu bewegen. Ohne Phase 2, heilt sich, wenn alle gehen.
    name: 'The Old Sluicegate', sprite: 'old_sluicegate', level: 49, ai: 'beast', moveEvery: 3,
    hp: 3200, hit: [27, 31], attackEvery: 5, aggro: 5, leash: 8, respawn: 600, xp: 2000,
    drops: [['cinder_iron', 1, 1, 3], ['verdigris', 1, 2, 4], ['spillway_mail', 0.2, 1, 1]], gold: [80, 140],
    specials: [
      { every: 1, delay: 6, pattern: 'bigplus', hit: [66, 78], text: 'The Sluicegate lifts. Four channels of water rush out from under it.' },
      { every: 1, delay: 7, pattern: 'ring', hit: [70, 82], text: 'The Sluicegate slams down. The floor all around it shudders.' },
    ],
    specialEvery: 3,
    boss: { deathText: 'The Old Sluicegate grinds to a stop, half open. For a moment you hear water running far away, north, and then only the drip.' },
    examine: 'An iron sluice gate, taller than a door, standing on its own on three bent legs. Rust, verdigris, and a quarrymen\'s lamp carved into the crossbar.',
  },
  // ---------- The Unending Maze (seit 2026-11-13, Gebet 4) ----------
  // Vorlagen: Die echten Werte rechnet content/regions/maze.js nach dem Stockwerk aus (maze: Faktoren auf die
  // Grundwerte der Stufe). Die Zahlen hier gelten für das erste Stockwerk (Stufe 5).
  turnling: {
    name: 'Turnling', sprite: 'turnling', level: 5, ai: 'grey',
    hp: 39, hit: [3, 5], attackEvery: 4, aggro: 5, leash: 8, respawn: 150, xp: 17,
    drops: [['turn_chalk', 0.3, 1, 1]], gold: [1, 3],
    special: { every: 3, delay: 6, pattern: 'plus', hit: [10, 13], text: 'The Turnling folds itself into a corner, and the corner points at you.' },
    maze: { hp: 1, hit: 1, xp: 1 },
    examine: 'A Greyling that got lost in a corner of the Maze and grew corners of its own.',
  },
  wallcrawler: {
    name: 'Wallcrawler', sprite: 'wallcrawler', level: 7, ai: 'beast',
    hp: 60, hit: [4, 6], attackEvery: 4, aggro: 6, leash: 8, respawn: 150, xp: 25,
    drops: [['turn_chalk', 0.3, 1, 1], ['scrap', 0.3, 1, 2]], gold: [2, 4],
    special: { every: 3, delay: 6, pattern: 'line', hit: [12, 16], text: 'The Wallcrawler flattens itself against the stone. It is going to lunge.' },
    maze: { hp: 1.25, hit: 1.05, xp: 1.15 },
    examine: 'Long, flat and patient. It lives in the joins between the stones, where the walls turn at night.',
  },
  lostlamp: {
    name: 'Lost Lamp', sprite: 'lostlamp', level: 9, ai: 'grey',
    hp: 50, hit: [4, 6], attackEvery: 4, aggro: 6, leash: 8, respawn: 150, xp: 30, drainOil: 3,
    drops: [['turn_chalk', 0.3, 1, 1], ['lamp_oil', 0.4, 1, 1]], gold: [2, 5],
    special: { every: 3, delay: 6, pattern: 'ring', hit: [12, 15], text: 'The Lost Lamp flares. Its light turns hot and white.' },
    maze: { hp: 0.9, hit: 1.1, xp: 1.2 },
    examine: 'A lantern on thin brass legs, looking for whoever dropped it. It drinks the oil of anyone who is not them.',
  },
  maze_keeper: {
    // Vorlage für die zufälligen Bosse am Ende jedes Stockwerks (keeperFor in content/regions/maze.js).
    name: 'The Keeper', sprite: 'turnling', level: 7, ai: 'grey', moveEvery: 2,
    hp: 270, hit: [4, 6], attackEvery: 4, aggro: 5, leash: 9, respawn: 400, xp: 160,
    drops: [['turnstone', 1, 1, 1]], gold: [7, 17],
    boss: { deathText: 'The Keeper comes apart like wet paper. Somewhere below, stairs grind open.' },
    examine: 'Every turn of the Maze has a Keeper. No two are alike, and none of them are friendly.',
  },
};
