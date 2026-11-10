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
