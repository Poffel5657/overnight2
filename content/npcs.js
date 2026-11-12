// Was die Figuren sagen. Der Server führt die Gespräche (shared/talk.js), damit Belohnungen echt sind.
// Ein Gespräch besteht aus Seiten { text, options }. Jede Antwort ist { text, to, if, do }:
//   to: nächste Seite (fehlt = Gespräch endet)
//   if: Bedingungen, alle müssen stimmen:
//       quest: { id: 'none' | 'active' | 'done' | <Schrittnummer> }   noClass / hasClass: true
//       classLevel: n (beste Klasse mindestens n)   below: n (beste Klasse unter n)
//       unlocked / locked: '<klasse>'
//       prof / noProf: '<beruf>'   profSlot: true (noch ein Beruf frei)   has: { item: n }
//       gold: n (mindestens so viel Gold)   night / day: true (Tageszeit; der Browser prüft das nicht)
//   do: Wirkungen der Reihe nach: start, advance (Quest), chooseClass, give, take, learn, unlearn,
//       refill, shop ('<händler>'), bet (['<schnecke>', gold], Schneckenrennen in shared/races.js)
// Seiten werden nur gezeigt, wenn mindestens eine Antwort übrig bleibt (sonst endet das Gespräch).

import { PROFESSIONS } from './professions.js';
import { CLASSES, UNLOCK_LEVEL } from './classes.js';
import { RACE } from './races.js';
import { INN } from './tavern.js';

const BYE = { text: 'Bye.' };

// Antworten und Seiten, mit denen ein Lehrer einen Beruf beibringt oder verlernen lässt.
function teaches(prof, learnedText) {
  const name = PROFESSIONS[prof].name;
  return {
    options: [
      { text: `Teach me ${name.toLowerCase()}.`, to: `learn_${prof}`, if: { noProf: prof, profSlot: true }, do: [{ learn: prof }] },
      { text: `I want to forget ${name.toLowerCase()}.`, to: `forget_${prof}`, if: { prof } },
    ],
    pages: {
      [`learn_${prof}`]: { text: learnedText, options: [{ text: 'Thank you.', to: 'start' }] },
      [`forget_${prof}`]: {
        text: `Forgetting is easy. Learning it again is not. Everything you know of ${name.toLowerCase()} goes, and you start from nothing.`,
        options: [
          { text: `Forget ${name.toLowerCase()}.`, to: 'forgot', do: [{ unlearn: prof }] },
          { text: 'No, keep it.', to: 'start' },
        ],
      },
      forgot: { text: 'There. Gone, like a dream about a goose. You have room for something new.', options: [{ text: 'Thanks. I think.', to: 'start' }] },
    },
  };
}

// Antworten und Seiten für die Prüfung, mit der ein Lehrer seine Klasse freischaltet.
function trial(cls, offerText, doneText, handIn = []) {
  const q = CLASSES[cls].trial;
  return {
    options: [
      { text: `Teach me to be a ${CLASSES[cls].name}.`, to: `trial_offer`, if: { hasClass: true, locked: cls, classLevel: UNLOCK_LEVEL, quest: { [q]: 'none' } }, do: [{ start: q }] },
      { text: `Teach me to be a ${CLASSES[cls].name}.`, to: `trial_early`, if: { hasClass: true, locked: cls, quest: { [q]: 'none' }, below: UNLOCK_LEVEL } },
      { text: 'I did what you asked.', to: 'trial_done', if: { quest: { [q]: 1 }, ...(handIn.length ? { has: Object.fromEntries([handIn]) } : {}) }, do: [...(handIn.length ? [{ take: Object.fromEntries([handIn]) }] : []), { advance: q }] },
    ],
    pages: {
      trial_offer: { text: offerText, options: [{ text: 'I will.', to: 'start' }] },
      trial_early: { text: `Not yet. Get one calling to level ${UNLOCK_LEVEL} first. Then we talk.`, options: [{ text: 'Fair.', to: 'start' }] },
      trial_done: { text: doneText, options: [{ text: 'Thank you.', to: 'start' }] },
    },
  };
}

const ama = (() => {
  const t = trial('warden',
    'Ama looks at how you stand. "Six Greylings. Then come back, and we will see about a shield."',
    '"Fine. Shield up, lantern low." She hands you a scrap shield. You can take up the Warden\'s calling in Kindle now.');
  return {
    start: {
      text: 'Warden Ama. I keep the Beacon lit, and I count every log that goes in.',
      options: [
        { text: 'I am new here.', to: 'k_offer', if: { quest: { kindling: 'none' } }, do: [{ give: { tin_lantern: 1 } }, { start: 'kindling' }] },
        { text: 'About that calling...', to: 'k_choose', if: { quest: { kindling: 0 } } },
        { text: 'Three Greylings, gone.', to: 'k_done', if: { quest: { kindling: 4 } }, do: [{ advance: 'kindling' }] },
        ...t.options,
        { text: 'Can I fill my lantern?', to: 'oil', do: [{ refill: true }] },
        { text: 'What is out there?', to: 'grey' },
        BYE,
      ],
    },
    k_offer: {
      text: 'New, and no light of your own. Here, a tin lantern. Before you wander off with it, tell me what you are good for.',
      options: [{ text: 'Let me choose.', to: 'k_choose' }],
    },
    k_choose: {
      text: 'Pick a calling. You can learn the others later, once you have proved one. Nothing you learn is ever lost.',
      options: [
        { text: 'I stand in front. (Warden: shield, holds the line)', to: 'k_chosen', if: { noClass: true }, do: [{ chooseClass: 'warden' }, { advance: 'kindling' }] },
        { text: 'I keep people warm. (Mender: heals)', to: 'k_chosen', if: { noClass: true }, do: [{ chooseClass: 'mender' }, { advance: 'kindling' }] },
        { text: 'I like bright things. (Flarecaster: light from afar)', to: 'k_chosen', if: { noClass: true }, do: [{ chooseClass: 'flarecaster' }, { advance: 'kindling' }] },
        { text: 'I am quick and quiet. (Drifter: blades in the dark)', to: 'k_chosen', if: { noClass: true }, do: [{ chooseClass: 'drifter' }, { advance: 'kindling' }] },
        { text: 'Let me think.' },
      ],
    },
    k_chosen: {
      text: 'Good. Fill that lantern at the Beacon, light a signal fire out at the edge of the fields, then chase off three Greylings. In that order, if you like order.',
      options: [{ text: 'On my way.' }],
    },
    k_done: {
      text: 'Three. I counted. You will do. Talk to Old Rook if you can stand him, and Tallow if you need patching. And learn two trades. Nobody has time for more.',
      options: [{ text: 'Thanks, Ama.' }],
    },
    oil: { text: 'Take what you need. The Beacon has more than you do. Come back before your wick goes blue.', options: [{ text: 'Thanks.' }] },
    grey: { text: 'The Grey. Every night it pulls back a little and leaves something behind. Some of it bites.', options: [{ text: 'Who pushes it back?', to: 'nw' }, BYE] },
    nw: { text: 'Tallow says the Nightwright. I say someone should, and I am glad it is not me.', options: [BYE] },
    ...t.pages,
  };
})();

const tallow = (() => {
  const f = teaches('foraging', 'Look down, not ahead. Bitterleaf grows where people sigh, wax hives hum by the stream. Bring me what you find.');
  const a = teaches('alchemy', 'The still behind the chapel is yours to use. Bitterleaf makes tonic, wax makes lamp oil. Do not drink the lamp oil.');
  const t = trial('mender',
    '"Warmth starts with bitterleaf. Bring me three, and I will show you what to do with your hands."',
    '"There. Feel that? That is you, being warm at people." He gives you an ember staff.', ['bitterleaf', 3]);
  return {
    start: {
      text: 'Brother Tallow, of the Chapel. The Nightwright listens here. Mostly, anyway.',
      options: [
        { text: 'You look worried.', to: 'op_offer', if: { quest: { older_prayer: 'none' }, classLevel: 22 }, do: [{ start: 'older_prayer' }] },
        { text: 'I found a tablet in the ruins.', to: 'op_done', if: { quest: { older_prayer: 1 }, has: { prayer_tablet: 1 } }, do: [{ take: { prayer_tablet: 1 } }, { advance: 'older_prayer' }] },
        { text: 'Did the tablet say anything else?', to: 'dc_offer', if: { quest: { older_prayer: 'done', drowned_choir: 'none' }, classLevel: 28 }, do: [{ start: 'drowned_choir' }] },
        { text: 'Did the tablet say anything else?', to: 'dc_early', if: { quest: { older_prayer: 'done', drowned_choir: 'none' }, below: 28 } },
        { text: 'Three hymnals, very wet.', to: 'dc_books', if: { quest: { drowned_choir: 1 }, has: { sodden_hymnal: 3 } }, do: [{ take: { sodden_hymnal: 3 } }, { advance: 'drowned_choir' }] },
        { text: 'The choir is quiet.', to: 'dc_done', if: { quest: { drowned_choir: 4 } }, do: [{ take: { choir_bell: 1 } }, { advance: 'drowned_choir' }] },
        ...t.options, ...f.options, ...a.options, { text: 'I want to pray.', to: 'pray' }, { text: 'Does it ever answer?', to: 'answer' }, BYE,
      ],
    },
    op_offer: { text: 'People say there is an older chapel under the Sinkmarsh ruins. Older than ours. Built for someone else. There is a shrine in the ruins; if there is a prayer left on it, I would like to read it.', options: [{ text: 'I will look.' }] },
    op_done: { text: '"To the one who holds the lamp." Not the Nightwright, then. The stairs under the ruins, they will let you down now. Take a light. Take two.', options: [{ text: 'I will be careful.' }] },
    dc_offer: { text: 'It said there was a choir. Forty voices, singing to "the one who holds the lamp". The pilgrims down there are still singing, I think. The Mire Lurkers in the deep marsh swallow their books. Bring me three. I want to read what they sang.', options: [{ text: 'Three wet books. Fine.' }] },
    dc_early: { text: 'It did. Something about a choir. But the deep marsh is no place for you yet. Come back when you have more years on you. (Level 28)', options: [BYE] },
    dc_books: { text: 'He reads for a long time. "They sang to keep something lit. Every hymn ends with a bell." There is an old bell frame sunk in the south-west of the marsh. Find the bell, take it down the stairs, and ring it. Then quiet them. Gently, if you can. Six should break the song.', options: [{ text: 'A bell. Then quiet.' }] },
    dc_done: { text: 'He holds the bell and does not ring it. "Forty voices, and none of them for us." He gives you a mantle that was drying behind the altar. "One of theirs. It still hums the low part. It will keep you warm down there, when you go for the light."', options: [{ text: 'Thank you, Brother.' }] },
    pray: { text: 'Kneel, say what the world is missing, and be patient. (Praying opens soon. The altar is still being carved.)', options: [BYE] },
    answer: { text: 'Every morning. Not in words. In forests and doors and the odd surprised goose.', options: [BYE] },
    ...f.pages, ...a.pages, ...t.pages,
  };
})();

const rook = (() => {
  const s = teaches('salvage', 'Heaps, wrecks, anything the Grey spat out. Pull the good bits, leave the bad bits, and do not cut yourself. Much.');
  const k = teaches('tinkering', 'The workbench by my shop. Scrap in, something useful out. If it falls apart, that is a lesson.');
  return {
    start: {
      text: 'Old Rook. I fix things. Bring me scrap from the Grey, and I make it into something that is not scrap.',
      options: [
        { text: 'You look busy.', to: 'r_offer', if: { quest: { kindling: 'done', rooks_bad_week: 'none' } }, do: [{ start: 'rooks_bad_week' }] },
        { text: 'Here is your scrap.', to: 'r_done', if: { quest: { rooks_bad_week: 1 }, has: { scrap: 6 } }, do: [{ take: { scrap: 6 } }, { advance: 'rooks_bad_week' }] },
        ...s.options, ...k.options, BYE,
      ],
    },
    r_offer: { text: 'Busy? I am out of scrap, out of tea, and out of patience. Six scrap. The heaps east of town have plenty, if you know how. Greylings drop some too.', options: [{ text: 'Six. Got it.' }] },
    r_done: { text: 'Six. Hm. Two are good. Here, a coat I was saving for someone better. Do not tell them.', options: [{ text: 'Thanks, Rook.' }] },
    ...s.pages, ...k.pages,
  };
})();

const fen = (() => {
  const c = teaches('cartography', 'You find a waymark, you measure it, you write it down. Then the world is a bit less lost. Here, borrow my pencil. Give it back.');
  return {
    start: {
      text: 'Have you been out there? In the Grey? Is it scary? I would not be scared.',
      options: [
        { text: 'Do you need anything?', to: 'f_offer', if: { quest: { fens_quills: 'none' } }, do: [{ start: 'fens_quills' }] },
        { text: 'Feathers, as promised.', to: 'f_done', if: { quest: { fens_quills: 1 }, has: { crow_feather: 4 } }, do: [{ take: { crow_feather: 4 } }, { advance: 'fens_quills' }] },
        { text: 'You keep staring north.', to: 'nf_offer', if: { quest: { not_from_here: 'none' }, classLevel: 10 }, do: [{ start: 'not_from_here' }] },
        { text: 'You keep staring north.', to: 'nf_early', if: { quest: { not_from_here: 'none' }, below: 10 } },
        { text: 'About the light in the north...', to: 'nf_done', if: { quest: { not_from_here: 3 } }, do: [{ advance: 'not_from_here' }] },
        ...c.options,
        { text: 'A bit scary.', to: 'scary' }, BYE,
      ],
    },
    f_offer: { text: 'Quills! For maps! Crows have the best feathers and they will not share. Four, please. Four is a good number.', options: [{ text: 'Four feathers.' }] },
    f_done: { text: 'These are perfect. Here, my best survey notes. I measured a goose. It moved.', options: [{ text: 'Thanks, Fen.' }] },
    scary: { text: 'Take me next time. I will hold the lantern. I am very good at holding things.', options: [{ text: 'Maybe.' }] },
    nf_offer: { text: 'At night there is a light past Hushwood. Not ours. Haskel says it is a woodfire. Woodfires do not move. Go to the north edge, past the woodcutters. There is an old lantern on a post up there. If the light left anything behind, bring it back.', options: [{ text: 'I will look.' }] },
    nf_early: { text: 'There is something out there. In the north. I will tell you when you are bigger. Level 10 bigger.', options: [{ text: 'Fine.' }] },
    nf_done: { text: 'Wren says the glass is not ours, and the Stranger went all quiet? Then I am right. There is someone out there with a light. I am going to draw it on my map. In pencil, in case it moves.', options: [{ text: 'Stay home, Fen.' }] },
    ...c.pages,
  };
})();

const wren = (() => {
  const l = teaches('lampwright', 'Lanterns, lenses, staves. Light is lazy; you have to tell it where to go. The lamp bench in Rook\'s shop is mine, mostly.');
  const t = trial('flarecaster',
    '"Light hurts them. You have seen it. Bring me five grey wisps and I will show you why."',
    '"Look through this." The cracked lens burns a little dot onto your hand. "That. Do that to them."', ['grey_wisp', 5]);
  return {
    start: {
      text: 'Wren. I grind lenses. Mind the glass dust, it gets everywhere, including into opinions.',
      options: [
        { text: 'What do you make of this glass?', to: 'nf_glass', if: { quest: { not_from_here: 1 }, has: { cold_glass: 1 } }, do: [{ advance: 'not_from_here' }] },
        ...t.options, ...l.options, BYE,
      ],
    },
    nf_glass: { text: 'Green, poured thick, full of tiny bubbles. Nobody in Kindle pours glass like this, and I would know. Whoever made it had sand, a hot fire and no patience. Show the Stranger. He looks at lanterns like he misses one.', options: [{ text: 'I will.' }] },
    ...l.pages, ...t.pages,
  };
})();

const stranger = (() => {
  const t = trial('drifter',
    '"Go out after dark. Put down three of them. Do not run home to the fire after each one."',
    '"You came back. Most do, the first time." Two shivs, without a word about where they came from.');
  return {
    start: {
      text: '...',
      options: [
        { text: 'There is a lamp under the ruins.', to: 'fl_offer', if: { quest: { older_prayer: 'done', false_light: 'none' } }, do: [{ start: 'false_light' }] },
        { text: 'The False Light is out.', to: 'fl_done', if: { quest: { false_light: 1 } }, do: [{ advance: 'false_light' }] },
        { text: 'This glass came from the north.', to: 'nf_hungry', if: { quest: { not_from_here: 2 }, has: { cold_glass: 1 } }, do: [{ take: { cold_glass: 1 } }, { advance: 'not_from_here' }] },
        ...t.options, { text: 'Where are you from?', to: 'from' }, BYE,
      ],
    },
    fl_offer: { text: '"I know. I followed it here." A long pause. "It goes out, or this village does. Take friends. When he puts the lights out, put them back."', options: [{ text: 'We will.' }] },
    fl_done: { text: '"Good." For the first time, the Stranger smiles. It does not help. "There are more lamps out there. This was the nearest."', options: [{ text: '...more?' }] },
    nf_hungry: { text: 'The Stranger turns the glass in his fingers for a long time. "There is a fire out there that is hungry. This held a little of it, once." He keeps the glass. "Tell the child to stay home."', options: [{ text: '...hungry?' }] },
    from: { text: 'Further out than you have been. There is another light out there. Keep your wick trimmed.', options: [BYE] },
    ...t.pages,
  };
})();

const haskel = {
  start: {
    text: 'Haskel. I cut wood. Or I would, if the wood stopped biting.',
    options: [
      { text: 'What is biting?', to: 'h_offer', if: { quest: { wolves_woodline: 'none' }, classLevel: 8 }, do: [{ start: 'wolves_woodline' }] },
      { text: 'What is biting?', to: 'h_early', if: { quest: { wolves_woodline: 'none' }, below: 8 } },
      { text: 'The woodline is quiet.', to: 'h_done', if: { quest: { wolves_woodline: 1 } }, do: [{ advance: 'wolves_woodline' }] },
      { text: 'Why is it so quiet in here?', to: 'h_quiet' },
      { text: 'Seen anything odd lately?', to: 'h_light' },
      BYE,
    ],
  },
  h_offer: { text: 'Wolves. Grey ones, quiet ones. Six of them sit between me and the good trees. Make it zero.', options: [{ text: 'Six wolves.' }] },
  h_early: { text: 'You? No offence, but they would use you as a toothpick. Come back with a few more levels on you.', options: [{ text: 'Fair.' }] },
  h_done: { text: 'Quiet. Properly quiet, not Hushwood quiet. Here, salve from my sister. She says it fixes anything but manners.', options: [{ text: 'Thanks, Haskel.' }] },
  h_light: { text: 'Past the trees, at night, there is a glow. I tell myself it is somebody\'s woodfire. It is a big woodfire. And it was not there last week.', options: [BYE] },
  h_quiet: { text: 'Hushwood eats sound. Shout in here and nobody hears it, not even you. Handy for wolves. Less handy for me.', options: [BYE] },
};

const brack = {
  start: {
    text: 'Brack, foreman of Copperdeep. Which is to say, foreman of a hole and some very rude beetles.',
    options: [
      { text: 'Need a hand?', to: 'b_offer', if: { quest: { singing_seam: 'none' }, classLevel: 14 }, do: [{ start: 'singing_seam' }] },
      { text: 'Need a hand?', to: 'b_early', if: { quest: { singing_seam: 'none' }, below: 14 } },
      { text: 'Five beetles, cleared.', to: 'b_done', if: { quest: { singing_seam: 1 } }, do: [{ advance: 'singing_seam' }] },
      { text: 'What is down there?', to: 'b_deep' },
      BYE,
    ],
  },
  b_offer: { text: 'There is a seam that sings. Glimmer, I think. Five stone beetles sit on it like it owes them money. Shift them.', options: [{ text: 'Shifting beetles.' }] },
  b_early: { text: 'Those beetles have shells like doors. Come back when you hit harder than a door.', options: [{ text: 'Understood.' }] },
  b_done: { text: 'Listen. Hear it? The seam is singing again. Have some glimmer. Do not tell Rook I gave it away.', options: [{ text: 'Thanks, Brack.' }] },
  b_deep: { text: 'Brass, glimmer, the odd worm. Further in, the Grey. We do not dig that way.', options: [BYE] },
};

// Mabb und die Schneckenrennen (shared/races.js, Zahlen in content/races.js).
const mabb = (() => {
  const S = RACE.snails;
  const bets = [];
  for (const stake of RACE.stakes) {
    for (const [id, sn] of Object.entries(S)) {
      bets.push({ text: `${stake} gold on ${sn.name}. (pays ${stake * sn.odds})`, if: { gold: stake }, do: [{ bet: [id, stake] }] });
    }
  }
  return {
    start: {
      text: 'Mabb. I keep snails. Racing snails. Do not laugh, they can hear you.',
      options: [
        { text: 'You look like you could use a hand.', to: 'q_offer', if: { quest: { kindling: 'done', off_to_races: 'none' } }, do: [{ start: 'off_to_races' }] },
        { text: 'I watched my snail race.', to: 'q_done', if: { quest: { off_to_races: 2 } }, do: [{ advance: 'off_to_races' }] },
        { text: 'I want to place a bet.', to: 'stake', if: { gold: Math.min(...RACE.stakes) } },
        { text: 'Who is racing?', to: 'field' },
        { text: 'How does this work?', to: 'how' },
        BYE,
      ],
    },
    q_offer: { text: 'Business is slow. The snails think nobody believes in them. Put a bet on one, any one, and watch the race to the end. It does wonders for their confidence.', options: [{ text: 'I will place a bet.', to: 'stake', if: { gold: Math.min(...RACE.stakes) } }, { text: 'Later.' }] },
    q_done: { text: 'There. Did you see Bramble\'s face? Neither did I, but I could tell. Here, for your trouble. Come back any time, the snails always run.', options: [{ text: 'Thanks, Mabb.' }] },
    stake: { text: `Who do you fancy? ${S.bramble.name} pays double, ${S.pebble.name} three times, ${S.tom.name} four. One bet a race.`, options: [...bets, { text: 'Not today.' }] },
    field: { text: `${S.bramble.name}: ${S.bramble.text} ${S.pebble.name}: ${S.pebble.text} ${S.tom.name}: ${S.tom.text}`, options: [{ text: 'I want to bet.', to: 'stake', if: { gold: Math.min(...RACE.stakes) } }, BYE] },
    how: { text: 'A race every few minutes, from the stones to the grass line. Bet before the bell, watch them crawl, collect if you were right. If you were wrong, the snails thank you for your support.', options: [BYE] },
  };
})();

const snail = (id) => ({
  start: { text: `${RACE.snails[id].name}. ${RACE.snails[id].text}`, options: [{ text: 'Good luck.' }] },
});

// Der Nachtmarkt: Mothwick verkauft nur im Dunkeln (Händler mit night: true in content/shops.js).
const mothwick = {
  start: {
    text: 'Mothwick. The market opens when the lamps do.',
    options: [
      { text: 'Show me your wares.', if: { night: true }, do: [{ shop: 'mothwick' }] },
      { text: 'Show me your wares.', to: 'closed', if: { day: true } },
      { text: 'Do you need anything?', to: 'w_offer', if: { night: true, quest: { wisps_for_wicks: 'none' } }, do: [{ start: 'wisps_for_wicks' }] },
      { text: 'Three wisps, as asked.', to: 'w_done', if: { night: true, quest: { wisps_for_wicks: 1 }, has: { grey_wisp: 3 } }, do: [{ take: { grey_wisp: 3 } }, { advance: 'wisps_for_wicks' }] },
      { text: 'Where do you come from?', to: 'from' },
      BYE,
    ],
  },
  closed: { text: 'Not in daylight, dear. My goods do not like being looked at by the sun. Come back after dark, when the lamps are lit.', options: [BYE] },
  w_offer: { text: 'My moonwicks need a little Grey spun into them, or they burn like any old string. Three grey wisps. The Greylings carry them; ask them nicely, with a stick.', options: [{ text: 'Three wisps.' }] },
  w_done: { text: 'Lovely. Still wriggling. Here, two wicks of your own and a candle to go with them. A lampwright could do a lot with those.', options: [{ text: 'Thank you.' }] },
  from: { text: 'North, mostly. I follow lights, and lights bring customers. There is a new one past Hushwood these nights, brighter every week. I came here first. Nobody buys lanterns where it is that bright.', options: [{ text: 'A light in the north?', to: 'north' }, BYE] },
  north: { text: 'Big, and warm-coloured, and hungry-looking. Like a hearth that has not been fed. Ask the woodcutter, he sees it every night and pretends not to.', options: [BYE] },
};

// Die Taverne „The Lantern & Lark“: Hollis und die Band (Corra, Oswin, Pip). Regeln in content/tavern.js.
const hollis = {
  start: {
    text: 'Hollis, keeper of the Lantern & Lark. Sit anywhere that is not on fire.',
    options: [
      { text: 'What have you got?', do: [{ shop: 'hollis' }] },
      { text: 'Can I get a bed?', to: 'beds' },
      { text: 'What are the chests by the wall?', to: 'chests' },
      { text: 'Heard anything lately?', to: 'rumour' },
      BYE,
    ],
  },
  beds: { text: `${INN.price} gold a night, behind the curtain at the back. Sleep there and you wake up with a full lamp and a clear head. For the next ${INN.rested} fights you will learn ${Math.round(INN.bonus * 100)}% more from them. Tired people learn nothing, rested people learn everything.`, options: [{ text: 'Good to know.', to: 'start' }, BYE] },
  chests: { text: 'One for every regular. Leave what you do not want to carry, take it back when you need it. Any chest opens to your own things. I stopped asking why. So should you.', options: [{ text: 'Thanks.', to: 'start' }, BYE] },
  rumour: { text: 'Woodcutters come in at night talking about a glow up north. Mothwick says it is a hearth that nobody feeds. Tallow has been in here twice this week, and Tallow does not drink. Something is going on.', options: [{ text: 'Interesting.', to: 'start' }, BYE] },
};

const band_corra = {
  start: {
    text: 'Corra puts down her fiddle. "Requests cost one ale. Complaints cost two."',
    options: [{ text: 'Who are you lot?', to: 'who' }, { text: 'What is that tune?', to: 'tune' }, BYE],
  },
  who: { text: '"We are the Damp Socks. Me on fiddle, Oswin on drum, Pip on the pipe. We played every village on the old road until the Grey ate the road. Now we play here, and the Beacon claps."', options: [BYE] },
  tune: { text: '"The Lark\'s Jig. Hollis\'s grandmother wrote it. Or stole it. In Kindle that is the same thing."', options: [BYE] },
};

const band_oswin = {
  start: {
    text: 'Oswin is drumming on the table, because the drum has a hole in it.',
    options: [
      { text: 'What happened to your drum?', to: 'd_offer', if: { quest: { skin_for_the_drum: 'none' }, classLevel: 10 }, do: [{ start: 'skin_for_the_drum' }] },
      { text: 'What happened to your drum?', to: 'd_early', if: { quest: { skin_for_the_drum: 'none' }, below: 10 } },
      { text: 'Two wolf pelts.', to: 'd_done', if: { quest: { skin_for_the_drum: 1 }, has: { wolf_pelt: 2 } }, do: [{ take: { wolf_pelt: 2 } }, { advance: 'skin_for_the_drum' }] },
      { text: 'Play something!', to: 'play' },
      BYE,
    ],
  },
  d_offer: { text: '"Got excited during the chorus. Stick went straight through." He looks at you hopefully. "The wolves in Hushwood have the right kind of hide. Two pelts, and I make a skin that will outlive me."', options: [{ text: 'Two pelts. I will be back.' }] },
  d_early: { text: '"Got excited during the chorus." He sighs. "I would ask you to fetch a wolf pelt, but the wolves would fetch you. Come back when you are a bit tougher."', options: [BYE] },
  d_done: { text: 'He stretches the pelt over the frame and gives it a thump. The whole tavern cheers. "That is the sound! Here, ale and stew, on the band. Hollis will not mind. Hollis will mind a bit."', options: [{ text: 'Play it loud.' }] },
  play: { text: '"Always am." He plays a rattling roll on the table. Corra rolls her eyes. Pip joins in anyway.', options: [BYE] },
};

const band_pip = {
  start: {
    text: 'Pip lowers a little tin pipe. "Shh. I am composing."',
    options: [{ text: 'Composing what?', to: 'song' }, BYE],
  },
  song: { text: '"A song about the light in the north. I only have the first line. It goes: \'There is a light in the north.\' The rest depends on what it is."', options: [BYE] },
};

export const TALK = {
  ama, tallow, rook, fen, wren, stranger, haskel, brack, mabb, mothwick, hollis, band_corra, band_oswin, band_pip,
  snail_bramble: snail('bramble'), snail_pebble: snail('pebble'), snail_tom: snail('tom'),
  pell: {
    start: { text: 'HEAR YE! A market that only opens after dark! Snails that race for gold! Kindle has never been so exciting!', options: [{ text: 'Anything else?', to: 'more' }, BYE] },
    more: { text: 'Tomorrow I will have more to shout. I can feel it in my bell.', options: [BYE] },
  },
  marrow: {
    start: {
      text: 'Marrow. I buy, I sell, I do not ask where things came from, as long as it was not my stall.',
      options: [{ text: 'Show me your wares.', do: [{ shop: 'marrow' }] }, BYE],
    },
  },
};

export const EXAMINE = {
  beacon: 'The Beacon. Warm, loud and hungry. The Grey keeps its distance.',
  chapel: 'A small chapel with a big door. Someone has polished the handle with hope.',
  house: 'A house. Someone lives here and would rather you did not look in the window.',
  workshop: 'Old Rook\'s workshop. Everything in it is half of something else.',
  tavern: 'The Lantern & Lark. Warm windows, a crooked sign, and a fiddle you can hear from the Beacon.',
  stash: 'An iron-bound chest. It opens to your own things.',
  inn_bed: 'A rented bed behind a curtain.',
  stall: 'A market stall. The awning is very confident.',
  campfire: 'The campfire. People wake up here when the Grey gets the better of them.',
  signal: 'A signal fire, stacked and waiting. Light it and the Grey has to stand back.',
  signalLit: 'A signal fire, burning. The Grey stands back, a little sulky.',
  tree: 'A tree. It has been here since last night, at least.',
  rock: 'A rock with copper streaks. Rook would like this.',
  workbench: 'Rook\'s workbench. Tinkerers make things here.',
  still: 'A copper still that smells of bitterleaf. Alchemists brew here.',
  lampbench: 'A bench covered in glass dust. Lampwrights work here.',
  node: 'Something worth a closer look, for someone who knows how.',
  chest: 'An old chest. It might still have something in it.',
  shrine: 'A small shrine, half sunk in the marsh. Candles, long out.',
  depleted: 'Picked clean. Come back later.',
  door: 'A way somewhere else.',
  brazier: 'A brazier. Its light keeps the Grey, and the things in it, at a polite distance.',
  false_light: 'A lamp that burns without oil. The light is wrong somehow, like a smile with too many teeth.',
  board: 'The Notice Board. Favours, gossip, and a list of the brave.',
  track: 'A strip of short grass between two lines of pebbles. The snails call it home. The snails do not call it anything.',
  altar: 'A stone altar with a box of white stones. People pray here, and drop one stone a day for the idea they like.',
};
