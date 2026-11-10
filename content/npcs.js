// Was die Figuren sagen. Jeder Eintrag ist ein Gespräch aus Seiten, Antworten führen zu anderen Seiten.
// action: besondere Wirkung, die das Spiel ausführt (refill, pray).
export const TALK = {
  ama: {
    start: { text: 'Warden Ama. I keep the Beacon lit, and I count every log that goes in.', options: [['Can I fill my lantern?', 'oil'], ['What is out there?', 'grey'], ['Bye.', null]] },
    oil: { text: 'Take what you need. The Beacon has more than you do. Come back before your wick goes blue.', action: 'refill', options: [['Thanks.', null]] },
    grey: { text: 'The Grey. Every night it pulls back a little and leaves something behind. Some of it bites.', options: [['Who pushes it back?', 'nw'], ['Bye.', null]] },
    nw: { text: 'Tallow says the Nightwright. I say someone should, and I am glad it is not me.', options: [['Bye.', null]] },
  },
  tallow: {
    start: { text: 'Brother Tallow, of the Chapel. The Nightwright listens here. Mostly, anyway.', options: [['I want to pray.', 'pray'], ['Does it ever answer?', 'answer'], ['Bye.', null]] },
    pray: { text: 'Kneel, say what the world is missing, and be patient. (Praying opens soon. The altar is still being carved.)', options: [['Bye.', null]] },
    answer: { text: 'Every morning. Not in words. In forests and doors and the odd surprised goose.', options: [['Bye.', null]] },
  },
  pell: {
    start: { text: 'HEAR YE! Last night the world began! That is all! It was a very big night!', options: [['Anything else?', 'more'], ['Bye.', null]] },
    more: { text: 'Tomorrow I will have more to shout. I can feel it in my bell.', options: [['Bye.', null]] },
  },
  fen: {
    start: { text: 'Have you been out there? In the Grey? Is it scary? I would not be scared.', options: [['A bit scary.', 'scary'], ['Bye.', null]] },
    scary: { text: 'Take me next time. I will hold the lantern. I am very good at holding things.', options: [['Maybe.', null]] },
  },
  stranger: {
    start: { text: '...', options: [['Where are you from?', 'from'], ['Bye.', null]] },
    from: { text: 'Further out than you have been. There is another light out there. Keep your wick trimmed.', options: [['Bye.', null]] },
  },
  rook: {
    start: { text: 'Old Rook. I fix things. Bring me scrap from the Grey, and I make it into something that is not scrap.', options: [['Later, then.', null]] },
  },
};

export const EXAMINE = {
  beacon: 'The Beacon. Warm, loud and hungry. The Grey keeps its distance.',
  chapel: 'A small chapel with a big door. Someone has polished the handle with hope.',
  house: 'A house. Someone lives here and would rather you did not look in the window.',
  workshop: 'Old Rook\'s workshop. Everything in it is half of something else.',
  stall: 'A market stall. Nothing for sale yet, but the awning is very confident.',
  campfire: 'The campfire. People wake up here when the Grey gets the better of them.',
  signal: 'A signal fire, stacked and waiting. Light it and the Grey has to stand back.',
  signalLit: 'A signal fire, burning. The Grey stands back, a little sulky.',
  tree: 'A tree. It has been here since last night, at least.',
  rock: 'A rock with copper streaks. Rook would like this.',
};
