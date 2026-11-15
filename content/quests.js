// Quests als Schritte. Ein Schritt ist erledigt, wenn sein Ereignis eintritt:
//   talk   Gespräch-Effekt { advance: '<quest>' } bei der Figur npc
//   action Spieler tut etwas (refill, light, rest, craft, gather)
//   kill   n Wesen der Art mob besiegen (night: nur nach Einbruch der Dunkelheit)
//   have   n Gegenstände item im Beutel haben (der folgende talk-Schritt nimmt sie)
//   flag   ein Gespräch setzt den Schritt (z. B. erste Klasse gewählt)
// reward: xp (aktive Klasse), gold, items { id: n }, unlock (Klasse freischalten + Startwaffe).
// Wer eine Quest anbietet, steht in den Gesprächen (content/npcs.js).

export const QUESTS = {
  kindling: {
    name: 'Kindling', giver: 'ama',
    text: 'Warden Ama wants you able to hold a light before she lets you wander.',
    steps: [
      { type: 'flag', text: 'Choose a calling with Warden Ama.' },
      { type: 'action', action: 'refill', text: 'Fill your lantern at the Beacon.' },
      { type: 'action', action: 'light', text: 'Light a signal fire at the edge of the fields.' },
      { type: 'kill', mob: 'greyling', n: 3, text: 'Drive off three Greylings.' },
      { type: 'talk', npc: 'ama', text: 'Tell Warden Ama.' },
    ],
    reward: { xp: 60, gold: 20, items: { bread: 3, lamp_oil: 2 } },
  },
  rooks_bad_week: {
    name: "Rook's Bad Week", giver: 'rook',
    text: 'Old Rook is out of scrap and out of patience.',
    steps: [
      { type: 'have', item: 'scrap', n: 6, text: 'Get six scrap (salvaged from heaps, or dropped by Greylings).' },
      { type: 'talk', npc: 'rook', text: 'Give the scrap to Old Rook.' },
    ],
    reward: { xp: 50, gold: 15, items: { scrap_coat: 1 } },
  },
  fens_quills: {
    name: "Fen's Quills", giver: 'fen',
    text: 'Fen needs quills to draw maps of places nobody is allowed to go.',
    steps: [
      { type: 'have', item: 'crow_feather', n: 4, text: 'Collect four crow feathers.' },
      { type: 'talk', npc: 'fen', text: 'Bring the feathers to Fen.' },
    ],
    reward: { xp: 40, gold: 10, items: { survey_notes: 2 } },
  },
  wolves_woodline: {
    name: 'Wolves at the Woodline', giver: 'haskel',
    text: 'Haskel cannot cut wood if the wood keeps biting back.',
    steps: [
      { type: 'kill', mob: 'wolf', n: 6, text: 'Drive off six Hushwood wolves.' },
      { type: 'talk', npc: 'haskel', text: 'Tell Haskel the woodline is quiet.' },
    ],
    reward: { xp: 300, gold: 40, items: { moss_salve: 3 } },
  },
  singing_seam: {
    name: 'The Singing Seam', giver: 'brack',
    text: 'Brack found a seam that hums. The beetles found it first.',
    steps: [
      { type: 'kill', mob: 'stone_beetle', n: 5, text: 'Clear five stone beetles from Copperdeep.' },
      { type: 'talk', npc: 'brack', text: 'Report to Brack at the mine camp.' },
    ],
    reward: { xp: 500, gold: 60, items: { glimmer: 3 } },
  },
  older_prayer: {
    name: 'The Older Prayer', giver: 'tallow',
    text: 'Tallow has heard there is an older chapel under the Sinkmarsh ruins, built for someone who is not the Nightwright.',
    steps: [
      { type: 'have', item: 'prayer_tablet', n: 1, text: 'Search the shrine in the Sinkmarsh ruins for a prayer tablet.' },
      { type: 'talk', npc: 'tallow', text: 'Bring the tablet to Brother Tallow.' },
    ],
    reward: { xp: 600, gold: 50 },
  },
  skin_for_the_drum: {
    name: 'A Skin for the Drum', giver: 'band_oswin',
    text: 'Oswin put his stick through the drum. Again. A wolf pelt would make a new skin, two would make a good one.',
    steps: [
      { type: 'have', item: 'wolf_pelt', n: 2, text: 'Get two wolf pelts (Hushwood wolves, north of Kindle).' },
      { type: 'talk', npc: 'band_oswin', text: 'Bring the pelts to Oswin in the Lantern & Lark.' },
    ],
    reward: { xp: 350, gold: 25, items: { ember_ale: 3, hearth_stew: 2 } },
  },
  drowned_choir: {
    name: 'The Drowned Choir', giver: 'tallow',
    text: 'The old chapel had a choir. Tallow wants to know what it sang, and how to make it stop.',
    steps: [
      { type: 'have', item: 'sodden_hymnal', n: 3, text: 'Get three sodden hymnals (Mire Lurkers in deep Sinkmarsh, or Drowned Pilgrims).' },
      { type: 'talk', npc: 'tallow', text: 'Bring the hymnals to Brother Tallow.' },
      { type: 'have', item: 'choir_bell', n: 1, text: 'Find the choir bell in the sunken bell frame, south-west in Sinkmarsh.' },
      { type: 'kill', mob: 'drowned_pilgrim', n: 6, text: 'Ring the bell in the Drowned Chapel and quiet six Drowned Pilgrims.' },
      { type: 'talk', npc: 'tallow', text: 'Tell Brother Tallow the choir is quiet.' },
    ],
    reward: { xp: 2400, gold: 90, items: { choir_mantle: 1, glow_draught: 3 } },
  },
  false_light: {
    name: 'The False Light', giver: 'stranger',
    text: 'The Stranger knows what burns under the ruins, and wants it put out.',
    steps: [
      { type: 'kill', mob: 'lamplighter', n: 1, text: 'Put out the False Light in the Drowned Chapel. Bring friends and oil.' },
      { type: 'talk', npc: 'stranger', text: 'Tell the Stranger.' },
    ],
    reward: { xp: 1500, gold: 150, items: { greyglass: 3 } },
  },
  off_to_races: {
    name: 'Off to the Races', giver: 'mabb',
    text: 'Mabb wants someone to bet on a snail, so the snails feel appreciated.',
    steps: [
      { type: 'action', action: 'bet', text: 'Put a bet on a snail with Mabb.' },
      { type: 'action', action: 'race', text: 'Watch your snail race to the end.' },
      { type: 'talk', npc: 'mabb', text: 'Tell Mabb how it went.' },
    ],
    reward: { xp: 45, gold: 10, items: { bread: 2 } },
  },
  // Tag 3 (Abstimmung): der Snail Cup
  snail_cup: {
    name: 'The Snail Cup', giver: 'mabb',
    text: 'Mabb has a trophy, two new snails and a lot of spare trophies.',
    steps: [
      { type: 'action', action: 'race_win', text: 'Win a bet on the snails with Mabb. (1 of 3)' },
      { type: 'action', action: 'race_win', text: 'Win another bet on the snails. (2 of 3)' },
      { type: 'action', action: 'race_win', text: 'Win one more bet on the snails. (3 of 3)' },
      { type: 'talk', npc: 'mabb', text: 'Tell Mabb you won three times.' },
    ],
    reward: { xp: 120, gold: 20, items: { snail_cup: 1 } },
  },
  // Tag 3 (Gebete): das Counting House
  stake_in_kindle: {
    name: 'A Stake in Kindle', giver: 'coyne',
    text: 'Coyne in the Counting House sells shares in the businesses of Kindle.',
    steps: [
      { type: 'action', action: 'invest', text: 'Buy a share from Coyne in the Counting House.' },
      { type: 'talk', npc: 'marrow', text: 'Tell Marrow you are a partner now. He will love that.' },
    ],
    reward: { xp: 70, gold: 15, items: { bread: 2 } },
  },
  old_strongbox: {
    name: 'The Old Strongbox', giver: 'coyne',
    text: 'Abel, who counted Kindle\'s money before Coyne, left a strongbox with three dials and a riddle somewhere in his old house.',
    steps: [
      { type: 'have', item: 'abels_riddle', n: 1, text: 'Search Abel\'s old house (the house by the campfire) for his note.' },
      { type: 'talk', npc: 'coyne', text: 'Solve Abel\'s riddle and set the three dials of the strongbox, in the Counting House.' },
    ],
    reward: { xp: 160, gold: 45, items: { glow_draught: 2 } },
  },
  // Tag 3 (Bogen „The Second Light“, Akt 1): Brindle sieht nachts Lichter, die am Nordrand entlangziehen
  carriers_dark: {
    name: 'Carriers in the Dark', giver: 'brindle',
    text: 'Brindle has seen small lights moving along the north edge at night, in a line, like people carrying something.',
    steps: [
      { type: 'have', item: 'tally_stick', n: 1, text: 'Search the north edge for whatever the carriers left. Brindle saw them stop by the stream, west of the cold lantern.' },
      { type: 'kill', mob: 'grey_gnawer', n: 4, text: 'Drive off four Grey Gnawers on the north edge. They are eating what the carriers dropped.' },
      { type: 'have', item: 'hollow_ration', n: 2, text: 'Save two rations from the gnawers.' },
      { type: 'talk', npc: 'wren', text: 'Show the tally stick to Wren in Kindle. Wren counts for a living.' },
      { type: 'talk', npc: 'stranger', text: 'Show a ration to the Stranger.' },
      { type: 'talk', npc: 'brindle', text: 'Tell Brindle what you found.' },
    ],
    reward: { xp: 650, gold: 40, items: { carriers_wraps: 1, moss_salve: 2 } },
  },
  // Tag 3, Nachschlag (Gebet 5, Rätsel): Abels drei Verstecke. Jeder Hinweis steht im Schritt, das Versteck
  // findet man nur, wenn man den Ort errät (ein shrine pro Schritt, content/regions/kindle.js).
  abels_caches: {
    name: "Abel's Three Caches", giver: 'coyne',
    text: 'At the bottom of Abel\'s strongbox was a second note: three hiding places, in the order he counted them.',
    steps: [
      { type: 'have', item: 'abels_purse_1', n: 1, text: 'Abel\'s note: "One. Where the axes rest and hands get warm, take three steps toward the cold." (Hushwood)' },
      { type: 'have', item: 'abels_purse_2', n: 1, text: 'Abel\'s note: "Two. Where the old road gave up and the Grey began, look for the stone that does not belong." (the far west)' },
      { type: 'have', item: 'abels_purse_3', n: 1, text: 'Abel\'s note: "Three. Where the diggers warm their beer, look uphill." (Copperdeep)' },
      { type: 'talk', npc: 'coyne', text: 'Bring Abel\'s three purses to Coyne in the Counting House.' },
    ],
    reward: { xp: 380, gold: 90, items: { glow_draught: 2, lamp_oil: 3 } },
  },
  // Tag 3, Nachschlag: Coyne schickt Teilhaber mit einem Hauptbuch nach Cinderford (Counting House, Hesk, Maze)
  cinderford_ledger: {
    name: 'The Cinderford Ledger', giver: 'coyne',
    text: 'Coyne\'s cousin keeps Hesk\'s books in Cinderford, badly. Coyne has corrections.',
    steps: [
      { type: 'talk', npc: 'hesk', text: 'Take Coyne\'s sealed ledger down the old road west to Hesk in Cinderford.' },
      { type: 'have', item: 'turn_chalk', n: 5, text: 'Hesk pays in kind: fetch five sticks of turn chalk from the Unending Maze.' },
      { type: 'talk', npc: 'hesk', text: 'Bring the turn chalk to Hesk.' },
      { type: 'talk', npc: 'coyne', text: 'Report back to Coyne in the Counting House.' },
    ],
    reward: { xp: 260, gold: 55, items: { cinder_cake: 2 } },
  },
  wisps_for_wicks: {
    name: 'Wisps for the Wicks', giver: 'mothwick',
    text: 'Mothwick spins wicks that burn at night. The secret ingredient is a little bit of the Grey.',
    steps: [
      { type: 'have', item: 'grey_wisp', n: 3, text: 'Get three grey wisps from Greylings.' },
      { type: 'talk', npc: 'mothwick', text: 'Bring them to Mothwick at the Night Market, after dark.' },
    ],
    reward: { xp: 70, gold: 12, items: { moonwick: 2, moon_candle: 1 } },
  },
  not_from_here: {
    name: 'Not From Here', giver: 'fen',
    text: 'At night Fen sees a light past Hushwood. Fen wants proof that it is real.',
    steps: [
      { type: 'have', item: 'cold_glass', n: 1, text: 'Search the cold lantern at the northern edge of Hushwood.' },
      { type: 'talk', npc: 'wren', text: 'Ask Wren about the glass.' },
      { type: 'talk', npc: 'stranger', text: 'Show the glass to the Stranger.' },
      { type: 'talk', npc: 'fen', text: 'Tell Fen what you found out.' },
    ],
    reward: { xp: 420, gold: 30, items: { dusk_draught: 2 } },
  },
  restless_pack: {
    name: 'The Restless Pack', giver: 'ama',
    text: 'From the Beacon, Ama has seen wolves at the edge of the fields. Wolves do not leave Hushwood. These ones did.',
    steps: [
      { type: 'kill', mob: 'restless_wolf', n: 5, text: 'Drive off five restless wolves at the woodline, north-west of the fields, across the stream.' },
      { type: 'have', item: 'singed_tuft', n: 3, text: 'Collect three singed tufts from the restless wolves.' },
      { type: 'talk', npc: 'haskel', text: 'Show the tufts to Haskel at the woodcutters\' fire, up the north road. Stay on the road.' },
      { type: 'talk', npc: 'ama', text: 'Tell Warden Ama what Haskel said.' },
    ],
    reward: { xp: 280, gold: 25, items: { brass_boots: 1, bread: 3 } },
  },
  oil_rush: {
    name: 'The Oil Rush', giver: 'marrow',
    text: 'Since the glow in the north appeared, everyone in Kindle is hoarding oil. Marrow has run out of tallow and wants bog lilies instead.',
    steps: [
      { type: 'kill', mob: 'bog_toad', n: 4, text: 'Shift four bog toads off the lily patches in Sinkmarsh.' },
      { type: 'have', item: 'lily_bulb', n: 3, text: 'Get three lily bulbs (bog lilies, or the toads drop them).' },
      { type: 'talk', npc: 'marrow', text: 'Bring the bulbs to Marrow at his stall in Kindle.' },
    ],
    reward: { xp: 1100, gold: 60, items: { lily_oil: 4 } },
  },
  marsh_lights: {
    name: 'Lights That Eat Lights', giver: 'mothwick',
    text: 'Mothwick says the will-o\'-wisps in Sinkmarsh have been eating more light than usual, and she wants to know what they are full of.',
    steps: [
      { type: 'kill', mob: 'will_o_wisp', n: 5, night: true, text: 'Put out five will-o\'-wisps in Sinkmarsh, after dark. Bring spare oil.' },
      { type: 'have', item: 'wisp_core', n: 3, text: 'Collect three wisp cores.' },
      { type: 'talk', npc: 'mothwick', text: 'Bring the cores to Mothwick at the Night Market, after dark.' },
    ],
    reward: { xp: 900, gold: 50, items: { lily_oil: 3, moon_candle: 2 } },
  },
  last_shift: {
    name: 'The Last Shift', giver: 'brack',
    text: 'Brack\'s miners will not go near the north-east seam. Somebody is still working it, and he has been working it for a very long time.',
    steps: [
      { type: 'kill', mob: 'old_foreman', n: 1, text: 'Put the Old Foreman to rest, in the north-east corner of Copperdeep. Bring potions.' },
      { type: 'have', item: 'foremans_ledger', n: 1, text: 'Take the Foreman\'s ledger.' },
      { type: 'talk', npc: 'brack', text: 'Bring the ledger to Brack at the mine camp.' },
    ],
    reward: { xp: 800, gold: 70, items: { glimmer: 2, moss_salve: 3 } },
  },
  eyes_north: {
    name: 'Eyes on the North', giver: 'haskel',
    text: 'Haskel\'s sister Brindle is putting up a lookout at the north edge of Hushwood, to watch the glow. She could use a hand.',
    steps: [
      { type: 'talk', npc: 'brindle', text: 'Find Brindle at the North Watch, at the top of the north road.' },
      { type: 'have', item: 'wolf_pelt', n: 3, text: 'Get three wolf pelts for a windbreak on the platform (Hushwood wolves).' },
      { type: 'talk', npc: 'brindle', text: 'Bring the pelts to Brindle.' },
      { type: 'have', item: 'grey_wisp', n: 3, text: 'Get three grey wisps. Wren polishes lenses with them.' },
      { type: 'talk', npc: 'wren', text: 'Ask Wren in Kindle to grind a spyglass lens.' },
      { type: 'have', item: 'spyglass_lens', n: 1, text: 'Carry the spyglass lens.' },
      { type: 'talk', npc: 'brindle', text: 'Take the lens up to Brindle at the North Watch.' },
      { type: 'action', action: 'watch', text: 'After dark, climb the North Watch and look north.' },
      { type: 'talk', npc: 'brindle', text: 'Tell Brindle what you saw.' },
    ],
    reward: { xp: 700, gold: 40, items: { watchers_hood: 1, moss_salve: 2 } },
  },
  prayer_not_ours: {
    name: 'A Prayer Not Ours', giver: 'tallow',
    text: 'Someone left a folded prayer in the chapel. Brother Tallow knows every hand in Kindle. He does not know this one.',
    steps: [
      { type: 'have', item: 'prayer_slip', n: 1, text: 'Search the offering box by the altar, inside the chapel.' },
      { type: 'talk', npc: 'pell', text: 'Show the folded prayer to Pell the Crier. Pell reads everything.' },
      { type: 'talk', npc: 'mothwick', text: 'Ask Mothwick about the paper, at the Night Market after dark.' },
      { type: 'talk', npc: 'tallow', text: 'Bring the prayer back to Brother Tallow.' },
    ],
    reward: { xp: 140, gold: 15, items: { glow_draught: 2 } },
  },
  trial_warden: {
    name: 'The Warden\'s Trial', giver: 'ama',
    text: 'Ama will teach you to stand in front, if you show you can stand at all.',
    steps: [
      { type: 'kill', mob: 'greyling', n: 6, text: 'Drive off six Greylings.' },
      { type: 'talk', npc: 'ama', text: 'Report to Warden Ama.' },
    ],
    reward: { unlock: 'warden', xp: 0 },
  },
  trial_mender: {
    name: 'The Mender\'s Trial', giver: 'tallow',
    text: 'Tallow teaches warmth to those who bring something warm.',
    steps: [
      { type: 'have', item: 'bitterleaf', n: 3, text: 'Get three bitterleaf (forage it, or trade with a forager).' },
      { type: 'talk', npc: 'tallow', text: 'Give them to Brother Tallow.' },
    ],
    reward: { unlock: 'mender', xp: 0 },
  },
  trial_flarecaster: {
    name: 'The Flarecaster\'s Trial', giver: 'wren',
    text: 'Wren wants proof that you understand what light does to Greylings.',
    steps: [
      { type: 'have', item: 'grey_wisp', n: 5, text: 'Get five grey wisps from Greylings.' },
      { type: 'talk', npc: 'wren', text: 'Show them to Wren.' },
    ],
    reward: { unlock: 'flarecaster', xp: 0 },
  },
  trial_drifter: {
    name: 'The Drifter\'s Trial', giver: 'stranger',
    text: 'The Stranger says the dark is a place you can live in. Prove it.',
    steps: [
      { type: 'kill', mob: 'greyling', n: 3, night: true, text: 'Drive off three Greylings after dark.' },
      { type: 'talk', npc: 'stranger', text: 'Return to the Stranger.' },
    ],
    reward: { unlock: 'drifter', xp: 0 },
  },
  // ---------- Cinderford und das Unending Maze (seit 2026-11-13, Gebet 4) ----------
  old_road_west: {
    name: 'The Old Road West', giver: 'band_corra',
    text: 'The Grey gave back the old road west. Corra says Cinderford is at the end of it.',
    steps: [
      { type: 'talk', npc: 'sorrel', text: 'Follow the old road west from Kindle to its end, go down to Cinderford and find Delvemaster Sorrel.' },
    ],
    reward: { xp: 80, gold: 20, items: { cinder_cake: 2 } },
  },
  first_turn: {
    name: 'The First Turn', giver: 'sorrel',
    text: 'Sorrel wants to know what the Keeper of the first turn looks like today.',
    steps: [
      { type: 'action', action: 'keeper', text: 'Go down the Maze Mouth in Cinderford and defeat the Keeper at the bottom of the first turn.' },
      { type: 'talk', npc: 'sorrel', text: 'Tell Sorrel what it was.' },
    ],
    reward: { xp: 250, gold: 30, items: { turnstone: 2, cinder_cake: 2 } },
  },
  chalk_and_string: {
    name: 'Chalk and String', giver: 'ivy',
    text: 'Old Ivy needs chalk that holds a mark in the Maze.',
    steps: [
      { type: 'have', item: 'turn_chalk', n: 5, text: 'Collect five sticks of turn chalk from the creatures of the Unending Maze.' },
      { type: 'talk', npc: 'ivy', text: 'Bring the chalk to Old Ivy in Cinderford.' },
    ],
    reward: { xp: 220, gold: 25, items: { delvers_lamp: 1 } },
  },
  deeper_still: {
    name: 'Deeper Still', giver: 'sorrel',
    text: 'Every fifth turn of the Maze has a great Keeper. Sorrel wants you to meet one.',
    steps: [
      { type: 'action', action: 'keeper_5', text: 'Reach the fifth turn of the Unending Maze and defeat its great Keeper. Take friends.' },
      { type: 'talk', npc: 'sorrel', text: 'Tell Sorrel.' },
    ],
    reward: { xp: 1200, gold: 120, items: { turnstone: 5 } },
  },
  // ---------- Tag 4 ----------
  // Abstimmung (rook-masterwork): Rook zeigt einem die Meisterstücke an seiner guten Bank in der Werkstatt.
  rook_masterwork: {
    name: "Rook's Masterwork", giver: 'rook',
    text: 'Old Rook has decided you can be trusted with his good bench. Mostly. He needs iron that Kindle does not have.',
    steps: [
      { type: 'have', item: 'cinder_iron', n: 3, text: 'Get three Cinder Iron. Flint the Miner sells it to his partners in Cinderford, the Seam Lurkers deep in Copperdeep swallow it, and salvagers can pull it from the deep seam there.' },
      { type: 'talk', npc: 'rook', text: 'Bring the iron to Old Rook in the workshop yard.' },
      { type: 'talk', npc: 'tansy', text: 'Rook has gone inside. Ask Tansy, in the workshop, for his old tongs.' },
      { type: 'action', action: 'masterwork', text: 'Make a masterwork piece at Rook\'s good bench, inside the workshop.' },
      { type: 'talk', npc: 'rook', text: 'Show your masterwork to Old Rook.' },
    ],
    reward: { xp: 1200, gold: 60, items: { cinder_iron: 2 } },
  },
  // Gebet 7: Flint, der Bergmann in Cinderford. Ein Anteil an seinem Karren macht seine Ware billiger.
  flints_partner: {
    name: 'A Share of the Cart', giver: 'flint',
    text: 'Flint the Miner sells scrap, brass and glimmer from a cart in Cinderford. He would sell it cheaper to partners, if he had any.',
    steps: [
      { type: 'action', action: 'invest_flint', text: 'Buy a share in Flint\'s Ore Cart from Coyne, in the Counting House in Kindle.' },
      { type: 'talk', npc: 'flint', text: 'Tell Flint he has a partner.' },
    ],
    reward: { xp: 120, gold: 0, items: { cinder_iron: 1, glimmer: 2 } },
  },
  // Nachschlag: Inhalt für Stufe 36 bis 40 in der Oberwelt
  deep_seam: {
    name: 'The Deep Seam', giver: 'flint',
    text: 'Flint says the best iron under the hill came from a seam that runs east, all the way to Copperdeep. Something down there is eating it.',
    steps: [
      { type: 'kill', mob: 'seam_lurker', n: 4, text: 'Drive off four Seam Lurkers in the deep seam east of the Old Shaft, in Copperdeep.' },
      { type: 'talk', npc: 'brack', text: 'Ask Brack at the Copperdeep camp what he knows about the deep seam.' },
      { type: 'have', item: 'cinder_iron', n: 2, text: 'Bring Flint two Cinder Iron from the lurkers, so he can see they eat the good stuff.' },
      { type: 'talk', npc: 'flint', text: 'Give the iron to Flint in Cinderford.' },
    ],
    reward: { xp: 3000, gold: 80, items: { cinder_cake: 3, moss_salve: 2 } },
  },
  // Bogen (Akt 1): Fen will Schatten fangen, und der Stranger hat keinen.
  catch_a_shadow: {
    name: 'Catch a Shadow', giver: 'fen',
    text: 'Fen has invented a game: at night, the Beacon throws long shadows, and Fen draws round them in chalk.',
    steps: [
      { type: 'talk', npc: 'tallow', text: 'Ask Brother Tallow for a stick of chapel chalk. Fen used all theirs on the well.' },
      { type: 'have', item: 'shadow_tracing', n: 1, text: 'After dark, trace your own shadow on Fen\'s chalk ring by the Beacon.' },
      { type: 'talk', npc: 'stranger', text: 'After dark, ask the Stranger to stand on the chalk ring by the Beacon.' },
      { type: 'talk', npc: 'fen', text: 'Tell Fen what you saw.' },
    ],
    reward: { xp: 320, gold: 20, items: { glow_draught: 1, bread: 2 } },
  },
  // Nachschlag (Gebet 5, Rätsel; Bogen am Rand): Die Karte voller Kreuze im leeren Haus südwestlich des Leuchtfeuers.
  map_of_crosses: {
    name: 'The Map of Crosses', giver: 'fen',
    text: 'Someone who once lived in the empty house south-west of the Beacon drew a map of everything, and crossed it all out.',
    steps: [
      { type: 'have', item: 'crossed_map', n: 1, text: 'Find the map full of crosses in the empty house south-west of the Beacon.' },
      { type: 'talk', npc: 'fen', text: 'Show the map to Fen. Fen knows every map in Kindle.' },
      { type: 'action', action: 'watch', text: 'After dark, climb the North Watch and look for the one place on the map that is circled, not crossed.' },
      { type: 'talk', npc: 'brindle', text: 'Ask Brindle what is out there, where the circle is.' },
    ],
    reward: { xp: 520, gold: 30, items: { survey_notes: 3, glow_draught: 1 } },
  },
  // Nachschlag (Gebet 5, Rätsel): Wer schrieb den halben Brief in Abels altem Haus? Die Hinweise stehen im Brief.
  unsent_letter: {
    name: 'The Unsent Letter', giver: 'pell',
    text: 'Pell reads every scrap of paper in Kindle, except one: a letter on a table in Abel\'s old house by the campfire. It is not his to read.',
    steps: [
      { type: 'have', item: 'unsent_letter', n: 1, text: 'Find the letter on the table in Abel\'s old house, by the campfire.' },
      { type: 'talk', npc: 'mabb', text: 'Find out who wrote it. The letter mentions someone in a hat, and a road that was closed. Read it again.' },
      { type: 'talk', npc: 'ivy', text: 'Take the letter to the writer\'s mother. Her maps are wrong by evening.' },
      { type: 'talk', npc: 'mabb', text: 'Tell Mabb his mother got the letter.' },
    ],
    reward: { xp: 240, gold: 25, items: { cinder_cake: 2 } },
  },
  ivys_reply: {
    name: "Ivy's Reply", giver: 'ivy',
    text: 'Old Ivy wants to send something back up the road to her son.',
    steps: [
      { type: 'talk', npc: 'mabb', text: 'Take Ivy\'s map of Kindle to Mabb, by the west path.' },
    ],
    reward: { xp: 120, gold: 10, items: { duchess_hat: 1 } },
  },
  // Gebet 7, für Neue in Cinderford: Flints Karren hat nur drei Räder.
  three_wheels: {
    name: 'Three Wheels', giver: 'flint',
    text: 'Flint\'s ore cart has three wheels and a lot of opinions. He wants a fourth wheel, and only one person makes them.',
    steps: [
      { type: 'have', item: 'scrap', n: 5, text: 'Get five scrap. Old Rook in Kindle makes wheels out of it.' },
      { type: 'talk', npc: 'rook', text: 'Ask Old Rook in Kindle for a cart wheel.' },
      { type: 'talk', npc: 'flint', text: 'Bring the wheel to Flint in Cinderford.' },
    ],
    reward: { xp: 160, gold: 15, items: { brass_bits: 3, bread: 2 } },
  },
  // Tag 5 (Gebet 9: Kanäle und Verliese unter der Stadt): Hesk schickt Delver ab Stufe 38 in die Sumps.
  the_drains: {
    name: 'The Drains', giver: 'hesk',
    text: 'Water is backing up under Cinderford, and the rats are coming up with it. Hesk wants the old drains cleared, all the way to the weir.',
    steps: [
      { type: 'kill', mob: 'drain_rat', n: 5, text: 'Go down the sump grate at the east end of the ford and drive off five Drain Rats.' },
      { type: 'have', item: 'sluice_handle', n: 1, text: 'Find the sluice handle. The sluice-keepers kept it in the quarrymen\'s niche, in the cistern.' },
      { type: 'kill', mob: 'the_undertow', n: 1, text: 'Something sits in the weir at the far end of the Sumps. Make it let go.' },
      { type: 'talk', npc: 'hesk', text: 'Tell Hesk the water runs again.' },
    ],
    reward: { xp: 4500, gold: 120, items: { seam_tonic: 2, verdigris: 3 } },
  },
  // Tag 5 (Abstimmung „old-mill“): Die Old Mill am Bach dreht sich von selbst. Wer mahlt dort nachts?
  who_grinds: {
    name: 'Who Grinds at Night', giver: 'marrow',
    text: 'Somebody has been leaving flour on doorsteps in Kindle, and Marrow did not sell it to them. The old mill by the stream is turning again.',
    steps: [
      { type: 'have', item: 'barley', n: 2, text: 'Get two handfuls of barley. The crows in the fields carry it, or Marrow sells it.' },
      { type: 'action', action: 'grind', text: 'Grind the barley at the Old Mill, by the stream west of the south road.' },
      { type: 'talk', npc: 'hollis', text: 'Take the flour to Hollis at the Lantern & Lark. Hollis knows flour.' },
      { type: 'have', item: 'hollow_barley', n: 1, text: 'After dark, look in the mill\'s hopper. Somebody grinds there when nobody is watching.' },
      { type: 'talk', npc: 'marrow', text: 'Show Marrow what was in the hopper.' },
    ],
    reward: { xp: 260, gold: 20, items: { mill_flour: 2, millbread: 2 } },
  },
  // Tag 5 (Bogen): Wenna, eine verirrte Trägerin, mahlt nachts in der Old Mill ihr letztes Korn.
  the_last_sack: {
    name: 'The Last Sack', giver: 'wenna',
    text: 'A carrier from the north is hiding in the Old Mill, grinding the last of her village\'s barley. She has not eaten in days, and her lantern is cold.',
    steps: [
      { type: 'have', item: 'millbread', n: 2, text: 'Bring Wenna two loaves of millbread. Hollis bakes them from mill flour.' },
      { type: 'talk', npc: 'wenna', text: 'Give Wenna the bread, at the mill, after dark.' },
      { type: 'action', action: 'refill', text: 'Fill Wenna\'s cold lantern at the Beacon.' },
      { type: 'talk', npc: 'tallow', text: 'Wenna asked about a prayer. Ask Brother Tallow about the one under the white stone.' },
      { type: 'talk', npc: 'wenna', text: 'Bring the lantern, and Tallow\'s answer, back to Wenna at the mill after dark.' },
    ],
    reward: { xp: 420, gold: 25, items: { hollow_ration: 2, glow_draught: 1, glass_grit: 2 } },
  },
  // Tag 5, Nachschlag (Gebet 9: Licht als Glaube): Die Quarrymen beteten unter dem Hügel zu einer Lampe.
  lamp_under_the_hill: {
    name: 'The Lamp Under the Hill', giver: 'hesk',
    text: 'The sluice-keepers lit their niches "for the lamp under the hill". Hesk always thought it was a rhyme. Now he is not sure.',
    steps: [
      { type: 'talk', npc: 'sorrel', text: 'Ask Delvemaster Sorrel what the quarrymen meant by the lamp under the hill.' },
      { type: 'kill', mob: 'silt_crawler', n: 3, text: 'Silt Crawlers drink the oil from the niche lamps in the Sumps. Drive off three.' },
      { type: 'talk', npc: 'tallow', text: 'Ask Brother Tallow in Kindle whether the chapel knows of a lamp under the hill.' },
      { type: 'talk', npc: 'hesk', text: 'Tell Hesk what the chapel said.' },
    ],
    reward: { xp: 3200, gold: 60, items: { sluice_draught: 2 } },
  },
  // Tag 5, Nachschlag (Old Mill): Wer war der Müller, und wohin ging sein Glas? Für alle ab Stufe 6.
  millers_ledger: {
    name: "The Miller's Ledger", giver: 'hollis',
    text: 'Hollis remembers flour from the old mill, but not the miller. Somebody must have kept accounts. (Level 6)',
    steps: [
      { type: 'have', item: 'millers_ledger', n: 1, text: 'Search the loose stone by the mill door for the miller\'s accounts.' },
      { type: 'talk', npc: 'mabb', text: 'Mabb has lived in Kindle longer than most. Ask him about the miller.' },
      { type: 'talk', npc: 'brack', text: 'The ledger mentions glass for "the north road", like the Foreman\'s crates. Show it to Brack at the Copperdeep camp.' },
      { type: 'talk', npc: 'hollis', text: 'Bring the ledger back to Hollis.' },
    ],
    reward: { xp: 240, gold: 20, items: { millbread: 3, mill_flour: 1 } },
  },
};
