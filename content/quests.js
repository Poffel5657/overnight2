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
};
