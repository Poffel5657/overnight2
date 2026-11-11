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
};
