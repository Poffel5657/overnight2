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
        { text: 'You keep looking north.', to: 'rp_offer', if: { quest: { kindling: 'done', restless_pack: 'none' }, classLevel: 5 }, do: [{ start: 'restless_pack' }] },
        { text: 'You keep looking north.', to: 'rp_early', if: { quest: { kindling: 'done', restless_pack: 'none' }, below: 5 } },
        { text: 'Haskel smelled the fur.', to: 'rp_done', if: { quest: { restless_pack: 3 } }, do: [{ advance: 'restless_pack' }] },
        { text: 'Any more wolves?', to: 'rp_after', if: { quest: { restless_pack: 'done' } } },
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
    rp_offer: { text: 'From up by the Beacon you can see the fields. Last night there were wolves on them, out past the stream to the north-west. Wolves do not leave Hushwood; it is quiet in there and full of things to eat. Send five of them home, and bring me some of their fur. Something about them is wrong.', options: [{ text: 'Five wolves, and fur.' }] },
    rp_early: { text: 'There are wolves at the edge of the fields. Not a job for you yet. Chase a few more Greylings first. (Level 5)', options: [{ text: 'Fair.' }] },
    rp_done: { text: 'Smoke from a fire Haskel does not know, past a wood nobody walks through. She is quiet for a while. "Wolves run from fire. Whatever is up there is big enough to move a whole forest of them." She hands you a pair of boots. "Keep your wick trimmed. And keep one eye north."', options: [{ text: 'I will.' }] },
    rp_after: { text: 'Every night. I count them from up here, like logs. Brindle counts the light from up there. Between the two of us we will know exactly how worried to be.', options: [BYE] },
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
        { text: 'Is the choir really quiet?', to: 'wraiths', if: { quest: { drowned_choir: 'done' } } },
        { text: 'Anything new at the altar?', to: 'po_offer', if: { quest: { kindling: 'done', prayer_not_ours: 'none' } }, do: [{ start: 'prayer_not_ours' }] },
        { text: 'About the folded prayer...', to: 'po_done', if: { quest: { prayer_not_ours: 3 }, has: { prayer_slip: 1 } }, do: [{ take: { prayer_slip: 1 } }, { advance: 'prayer_not_ours' }] },
        ...t.options, ...f.options, ...a.options, { text: 'I want to pray.', to: 'pray' }, { text: 'Does it ever answer?', to: 'answer' }, BYE,
      ],
    },
    op_offer: { text: 'People say there is an older chapel under the Sinkmarsh ruins. Older than ours. Built for someone else. There is a shrine in the ruins; if there is a prayer left on it, I would like to read it.', options: [{ text: 'I will look.' }] },
    op_done: { text: '"To the one who holds the lamp." Not the Nightwright, then. The stairs under the ruins, they will let you down now. Take a light. Take two.', options: [{ text: 'I will be careful.' }] },
    dc_offer: { text: 'It said there was a choir. Forty voices, singing to "the one who holds the lamp". The pilgrims down there are still singing, I think. The Mire Lurkers in the deep marsh swallow their books. Bring me three. I want to read what they sang.', options: [{ text: 'Three wet books. Fine.' }] },
    dc_early: { text: 'It did. Something about a choir. But the deep marsh is no place for you yet. Come back when you have more years on you. (Level 28)', options: [BYE] },
    dc_books: { text: 'He reads for a long time. "They sang to keep something lit. Every hymn ends with a bell." There is an old bell frame sunk in the south-west of the marsh. Find the bell, take it down the stairs, and ring it. Then quiet them. Gently, if you can. Six should break the song.', options: [{ text: 'A bell. Then quiet.' }] },
    dc_done: { text: 'He holds the bell and does not ring it. "Forty voices, and none of them for us." He gives you a mantle that was drying behind the altar. "One of theirs. It still hums the low part. It will keep you warm down there, when you go for the light."', options: [{ text: 'Thank you, Brother.' }] },
    pray: { text: 'Kneel at the altar, say what the world is missing, and be patient. Some prayers are answered by morning. Some take longer. Drop a white stone in the box while you are there.', options: [BYE] },
    wraiths: { text: 'Mostly. The pilgrims are. But some nights I still hear the low part, all the way up here. A few of the singers stayed in the side aisles, the ones who sang loudest. If you are down there, sing them out. Gently.', options: [BYE] },
    po_offer: { text: '"There is a prayer in the offering box that is not ours. I know every hand in Kindle. Ama writes like she is chopping wood, Fen draws geese in the margins. This one is neat and brown and folded very small." He frowns. "It says: to the hearth that feeds us, we are feeding you what we have left. Go and look. Then show it to Pell. Pell reads everything in this village."', options: [{ text: 'I will look.' }] },
    po_done: { text: 'He listens, then folds the prayer up again. "Bark paper from the north, in a hand nobody here knows. Somebody out there prays to a fire, and the fire is still hungry." He sets it on the altar under a white stone. "The Nightwright can read it there. It is not ours to keep."', options: [{ text: 'Thank you, Brother.' }] },
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
        { text: 'There is a lookout up north now.', to: 'watch', if: { quest: { not_from_here: 'done' } } },
        { text: 'I found more green glass.', to: 'shards', if: { quest: { not_from_here: 'done' }, has: { green_shard: 1 } } },
        { text: 'A bit scary.', to: 'scary' }, BYE,
      ],
    },
    f_offer: { text: 'Quills! For maps! Crows have the best feathers and they will not share. Four, please. Four is a good number.', options: [{ text: 'Four feathers.' }] },
    f_done: { text: 'These are perfect. Here, my best survey notes. I measured a goose. It moved.', options: [{ text: 'Thanks, Fen.' }] },
    shards: { text: 'MORE? The wolves have it, and the moss spirits, like they walked past a lot of broken lanterns. Put two on the notice board for me some days, I am keeping count. And Wren can grind three into a lens, if you know lamps.', options: [BYE] },
    watch: { text: 'I KNOW. Brindle will not let me up. She says I would fall off, or worse, draw on her book. I would only draw a little goose.', options: [BYE] },
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
        { text: 'Brindle needs a spyglass lens.', to: 'en_lens', if: { quest: { eyes_north: 4 }, has: { grey_wisp: 3 } }, do: [{ take: { grey_wisp: 3 } }, { give: { spyglass_lens: 1 } }, { advance: 'eyes_north' }] },
        { text: 'Brindle needs a spyglass lens.', to: 'en_wisps', if: { quest: { eyes_north: 4 } } },
        { text: 'Can you work this green glass?', to: 'green', if: { has: { green_shard: 1 } } },
        { text: 'What do you make of this glass?', to: 'nf_glass', if: { quest: { not_from_here: 1 }, has: { cold_glass: 1 } }, do: [{ advance: 'not_from_here' }] },
        ...t.options, ...l.options, BYE,
      ],
    },
    green: { text: 'Wren holds the shard to the light for a long time. "Same hand as the cold lantern. Poured thick, cooled fast." A pause. "Three of these and a bit of brass make a decent lens, if you are a lampwright. If you are not, sell them to one. Or to Fen, Fen pays in drawings."', options: [BYE] },
    en_lens: { text: 'Wren takes a lump of good Kindle glass off the shelf and grinds for a long, dusty while, then rubs it with the wisps until they give up. "There. It does not make things bigger. It makes them closer, which is worse. Tell Brindle not to drop it."', options: [{ text: 'Thanks, Wren.' }] },
    en_wisps: { text: 'A spyglass? Fine. Glass I have. To polish it I need grey wisps, three of them. They hate the light so much that they rub every speck of it smooth.', options: [{ text: 'Three wisps.' }] },
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
        { text: 'Have you heard of the Hollow fire?', to: 'hollow', if: { quest: { last_shift: 'done' } } },
        { text: 'Someone left a prayer in the chapel.', to: 'prayer', if: { quest: { prayer_not_ours: 'done' } } },
        ...t.options, { text: 'Where are you from?', to: 'from' }, BYE,
      ],
    },
    fl_offer: { text: '"I know. I followed it here." A long pause. "It goes out, or this village does. Take friends. When he puts the lights out, put them back."', options: [{ text: 'We will.' }] },
    fl_done: { text: '"Good." For the first time, the Stranger smiles. It does not help. "There are more lamps out there. This was the nearest."', options: [{ text: '...more?' }] },
    nf_hungry: { text: 'The Stranger turns the glass in his fingers for a long time. "There is a fire out there that is hungry. This held a little of it, once." He keeps the glass. "Tell the child to stay home."', options: [{ text: '...hungry?' }] },
    prayer: { text: '"Did they." The Stranger looks at his hands. There is brown ink in the creases of his fingers, or maybe it is only dirt. "Then somebody still thinks it helps."', options: [{ text: '...' }] },
    hollow: { text: 'The Stranger is very still. "Where did you hear that?" You tell him about the ledger. "Crates of glimmer, every week." He almost laughs. "Then somebody here used to remember." He turns away. "Keep your wick trimmed."', options: [{ text: '...' }] },
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
      { text: 'Smell this fur.', to: 'rp_smell', if: { quest: { restless_pack: 2 }, has: { singed_tuft: 3 } }, do: [{ take: { singed_tuft: 3 } }, { advance: 'restless_pack' }] },
      { text: 'Wolves are out on the fields.', to: 'h_pack', if: { quest: { restless_pack: 'done' } } },
      { text: 'Is anyone watching that glow?', to: 'en_offer', if: { quest: { eyes_north: 'none' }, classLevel: 10 }, do: [{ start: 'eyes_north' }] },
      { text: 'Is anyone watching that glow?', to: 'en_early', if: { quest: { eyes_north: 'none' }, below: 10 } },
      { text: 'Why is it so quiet in here?', to: 'h_quiet' },
      { text: 'Seen anything odd lately?', to: 'h_light' },
      BYE,
    ],
  },
  h_offer: { text: 'Wolves. Grey ones, quiet ones. Six of them sit between me and the good trees. Make it zero.', options: [{ text: 'Six wolves.' }] },
  h_early: { text: 'You? No offence, but they would use you as a toothpick. Come back with a few more levels on you.', options: [{ text: 'Fair.' }] },
  h_done: { text: 'Quiet. Properly quiet, not Hushwood quiet. Here, salve from my sister. She says it fixes anything but manners.', options: [{ text: 'Thanks, Haskel.' }] },
  h_light: { text: 'Past the trees, at night, there is a glow. I tell myself it is somebody\'s woodfire. It is a big woodfire. And it was not there last week.', options: [BYE] },
  rp_smell: { text: 'He sniffs a tuft and frowns. "That is not my smoke. I burn pine and birch. This is oily. Peat, or fat. Nobody burns that in Hushwood." He looks north for a long moment. "They are not wandering out. They are running out. Tell Ama."', options: [{ text: 'I will.' }] },
  en_offer: { text: 'My sister is. Brindle. Ama asked for eyes on the north, and Brindle has the best eyes and the worst temper in the family. She is putting up a lookout at the top of the road. Go and help her before she builds it out of me.', options: [{ text: 'I will find her.' }] },
  en_early: { text: 'My sister Brindle is. She is building a lookout up at the north edge. It is wolf country up there, though. Come back with a few more levels. (Level 10)', options: [{ text: 'Fair.' }] },
  h_pack: { text: 'More every night. They come through the camp at a run and do not even look at my lunch. A wolf that ignores lunch is a frightened wolf.', options: [BYE] },
  h_quiet: { text: 'Hushwood eats sound. Shout in here and nobody hears it, not even you. Handy for wolves. Less handy for me.', options: [BYE] },
};

const brack = {
  start: {
    text: 'Brack, foreman of Copperdeep. Which is to say, foreman of a hole and some very rude beetles.',
    options: [
      { text: 'Need a hand?', to: 'b_offer', if: { quest: { singing_seam: 'none' }, classLevel: 14 }, do: [{ start: 'singing_seam' }] },
      { text: 'Need a hand?', to: 'b_early', if: { quest: { singing_seam: 'none' }, below: 14 } },
      { text: 'Five beetles, cleared.', to: 'b_done', if: { quest: { singing_seam: 1 } }, do: [{ advance: 'singing_seam' }] },
      { text: 'Why does nobody dig north-east?', to: 'ls_offer', if: { quest: { singing_seam: 'done', last_shift: 'none' }, classLevel: 18 }, do: [{ start: 'last_shift' }] },
      { text: 'Why does nobody dig north-east?', to: 'ls_early', if: { quest: { last_shift: 'none' }, below: 18 } },
      { text: 'The Foreman is resting.', to: 'ls_done', if: { quest: { last_shift: 2 }, has: { foremans_ledger: 1 } }, do: [{ take: { foremans_ledger: 1 } }, { advance: 'last_shift' }] },
      { text: 'What is down there?', to: 'b_deep' },
      BYE,
    ],
  },
  b_offer: { text: 'There is a seam that sings. Glimmer, I think. Five stone beetles sit on it like it owes them money. Shift them.', options: [{ text: 'Shifting beetles.' }] },
  b_early: { text: 'Those beetles have shells like doors. Come back when you hit harder than a door.', options: [{ text: 'Understood.' }] },
  b_done: { text: 'Listen. Hear it? The seam is singing again. Have some glimmer. Do not tell Rook I gave it away.', options: [{ text: 'Thanks, Brack.' }] },
  ls_offer: { text: 'Because the old foreman is still up there. Died before my time, before anybody\'s time, and nobody told him. He works the north-east seam all day and all night and does not like company. Put him to rest. Bring potions, he swings like a man who has done it for a hundred years. And bring me his ledger.', options: [{ text: 'I will.' }] },
  ls_early: { text: 'Because somebody up there swings a pick harder than you can. Come back when you are a lot tougher. (Level 18)', options: [BYE] },
  ls_done: { text: 'He turns the damp pages slowly. "Shifts. Wages. Crates of glimmer, forty at a time, every week, sent north. \'For the Hollow fire.\'" He looks up. "There is nothing north of Hushwood. There never was." He does not sound sure. "Keep the glimmer. And the salve. You earned a rest."', options: [{ text: 'For the Hollow fire?', to: 'ls_hollow' }, { text: 'Thanks, Brack.' }] },
  ls_hollow: { text: 'That is what it says. Every week, for years, and then nothing, the same week the shifts stop. Ask the Stranger, maybe. He looks like a man who knows where north goes.', options: [BYE] },
  b_deep: { text: 'Brass, glimmer, the odd worm. Further in, the Grey. We do not dig that way.', options: [BYE] },
};

// Der Ausguck am Nordrand von Hushwood (Tag 2, Abstimmung „north-lookout“): Brindle, Haskels Schwester.
const brindle = {
  start: {
    text: 'Brindle. Haskel\'s sister, the clever one. I watch the north, so the rest of you do not have to.',
    options: [
      { text: 'Haskel sent me.', to: 'en_hello', if: { quest: { eyes_north: 0 } }, do: [{ advance: 'eyes_north' }] },
      { text: 'Three wolf pelts.', to: 'en_pelts', if: { quest: { eyes_north: 2 }, has: { wolf_pelt: 3 } }, do: [{ take: { wolf_pelt: 3 } }, { advance: 'eyes_north' }] },
      { text: 'Here is the spyglass lens.', to: 'en_glass', if: { quest: { eyes_north: 6 }, has: { spyglass_lens: 1 } }, do: [{ take: { spyglass_lens: 1 } }, { advance: 'eyes_north' }] },
      { text: 'I saw it.', to: 'en_done', if: { quest: { eyes_north: 8 } }, do: [{ advance: 'eyes_north' }] },
      { text: 'What do you see up there?', to: 'see' },
      { text: 'Can I read your book?', to: 'book', if: { quest: { eyes_north: 'done' } } },
      { text: 'Why a lookout?', to: 'why' },
      BYE,
    ],
  },
  en_hello: { text: 'Good, hands. The tower is up, more or less. The wind up there could peel an apple. I need three wolf pelts for a windbreak, and the wolves are, helpfully, all around us. After that, a proper glass.', options: [{ text: 'Three pelts.' }] },
  en_pelts: { text: 'She nails them up along the rail, fur side in. "Better. Now I can stay up there long enough to see something. What I need next is a spyglass. Wren in Kindle grinds lenses. Wren will want something for it. Wren always does."', options: [{ text: 'I will ask Wren.' }] },
  en_glass: { text: 'She fits the lens into a brass tube and squints through it at a tree. "Hah. That tree has a beetle on it." She hands you the tube back. "You did the work, you get the first look. Wait for dark, climb up and look north. Then come and tell me I am not mad."', options: [{ text: 'After dark, then.' }] },
  en_done: { text: '"A fire, then. Not a woodfire. A big one, low and steady, like a hearth." She writes it down in a little book full of dates. "It was smaller last week. I will keep watching. Here, my spare hood, it has a lamp on it. And salve. Haskel says it fixes everything but manners."', options: [{ text: 'Thanks, Brindle.' }] },
  see: { text: 'Trees, mostly. Wolves running south, which they never used to do. And at night, a glow past the Grey. I write down how bright it is. It is getting brighter.', options: [{ text: 'Can I look?', to: 'look' }, BYE] },
  look: { text: 'Climb up whenever you like. After dark is when it is worth it. In daylight the Grey is just grey.', options: [BYE] },
  book: { text: 'She hands it over, reluctantly. Neat columns: dates, "glow: small", "glow: small", "glow: a bit less small". Wolves counted in fives. On the last page, underlined twice: "It does not flicker like wood. It flickers like somebody feeding it."', options: [{ text: 'Thanks, Brindle.' }] },
  why: { text: 'Because Ama asked, and because the wolves are leaving, and wolves are smarter than people about fire. Also because nobody else in this family can climb.', options: [BYE] },
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
      { text: 'Anything new tonight?', to: 'tonight', if: { night: true } },
      { text: 'You look worried, for once.', to: 'ml_offer', if: { night: true, quest: { marsh_lights: 'none' }, classLevel: 23 }, do: [{ start: 'marsh_lights' }] },
      { text: 'Three wisp cores.', to: 'ml_done', if: { night: true, quest: { marsh_lights: 2 }, has: { wisp_core: 3 } }, do: [{ take: { wisp_core: 3 } }, { advance: 'marsh_lights' }] },
      { text: 'Do you know this paper?', to: 'po_moth', if: { night: true, quest: { prayer_not_ours: 2 }, has: { prayer_slip: 1 } }, do: [{ advance: 'prayer_not_ours' }] },
      { text: 'Do you know this paper?', to: 'po_day', if: { day: true, quest: { prayer_not_ours: 2 }, has: { prayer_slip: 1 } } },
      { text: 'Where do you come from?', to: 'from' },
      BYE,
    ],
  },
  po_moth: { text: 'She rubs the paper between two fingers. "Birch bark, boiled and pressed. Nobody makes it this side of Hushwood. I bought a sheaf of it once, years ago, from a woman with a green lantern." She hands it back, a little too quickly. "Paper is paper, dear. Take it home to your priest."', options: [{ text: 'A green lantern?', to: 'po_green' }, { text: 'Thanks.' }] },
  po_green: { text: '"Green glass, thick as a thumb. She said her village poured it." Mothwick shrugs. "Lots of villages pour glass. Lots of villages go quiet. I do not ask which."', options: [BYE] },
  po_day: { text: 'Paper? Not by daylight, dear. Daylight is bad for paper, and worse for me. Come back after dark.', options: [BYE] },
  ml_offer: { text: 'Worried? Me? Business is fine. It is the will-o\'-wisps in the marsh. They used to nibble a lantern now and then. Now they gulp. Something has made them hungry. Put out five, after dark when they are greedy, and bring me what is left of them. I want to look inside.', options: [{ text: 'Five wisps, three cores.' }] },
  ml_done: { text: 'She holds a core up to her own lantern and the flame leans toward it. "Full of light, and all of it pointing the same way. North." She pockets two and gives you oil and candles. "Something up there is drawing every light in the Grey toward it, dear. Even the hungry ones."', options: [{ text: 'North again.' }] },
  tonight: { text: 'Always, dear. Every night two new things come down the road from the north with me, and every morning they are gone again. Have a look before the sun does.', options: [{ text: 'Show me.', do: [{ shop: 'mothwick' }] }, BYE] },
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
  rumour: { text: 'Woodcutters come in at night talking about a glow up north. Mothwick says it is a hearth that nobody feeds. Tallow has been in here twice this week, and Tallow does not drink. Something is going on.', options: [{ text: 'Anything else?', to: 'rumour2' }, { text: 'Interesting.', to: 'start' }, BYE] },
  rumour2: { text: 'Brindle came down for stew and would not stop writing in her little book. Marrow is buying up every drop of oil in Kindle. And Brack swears the Old Foreman tipped his helmet at him once. Brack also swears at beetles, so.', options: [{ text: 'Interesting.', to: 'start' }, BYE] },
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
  song: { text: '"A song about the light in the north. I have two lines now! \'There is a light in the north, and Brindle is watching it.\' The rest depends on what it is. And on what rhymes with Brindle."', options: [BYE] },
};

export const TALK = {
  ama, tallow, rook, fen, wren, stranger, haskel, brack, brindle, mabb, mothwick, hollis, band_corra, band_oswin, band_pip,
  snail_bramble: snail('bramble'), snail_pebble: snail('pebble'), snail_tom: snail('tom'),
  pell: {
    start: { text: 'HEAR YE! Wolves on the fields! Ama wants them sent home! And every calling has new tricks, and the Flarecasters set things on fire on purpose now!', options: [
      { text: 'Whose hand is this?', to: 'po_pell', if: { quest: { prayer_not_ours: 1 }, has: { prayer_slip: 1 } }, do: [{ advance: 'prayer_not_ours' }] },
      { text: 'Anything else?', to: 'more' }, BYE] },
    po_pell: { text: '"Not Kindle\'s! I read every notice on that board and every scrap nailed to every door. Kindle writes in charcoal. This is ink. Brown ink, and very tidy." He holds it up to the light. "And bark for paper! Mothwick sells paper things. At night, obviously."', options: [{ text: 'Thanks, Pell.' }] },
    more: { text: 'Tomorrow I will have more to shout. I can feel it in my bell.', options: [BYE] },
  },
  marrow: {
    start: {
      text: 'Marrow. I buy, I sell, I do not ask where things came from, as long as it was not my stall.',
      options: [
        { text: 'Show me your wares.', do: [{ shop: 'marrow' }] },
        { text: 'Business good?', to: 'oil_offer', if: { quest: { oil_rush: 'none' }, classLevel: 26 }, do: [{ start: 'oil_rush' }] },
        { text: 'Business good?', to: 'oil_early', if: { quest: { oil_rush: 'none' }, below: 26 } },
        { text: 'Bulbs, and fewer toads.', to: 'oil_done', if: { quest: { oil_rush: 2 }, has: { lily_bulb: 3 } }, do: [{ take: { lily_bulb: 3 } }, { advance: 'oil_rush' }] },
        BYE,
      ],
    },
    oil_offer: { text: 'Too good. Everybody wants oil since that glow showed up in the north. They buy it, they hide it under the bed, they come back for more. I am out of tallow. Lily bulbs from the Sinkmarsh press into good oil, but the bog toads sit on every patch. Four fewer toads and three bulbs, and I can keep the lamps of Kindle lit another week.', options: [{ text: 'Toads and bulbs.' }] },
    oil_early: { text: 'Busy. Everyone wants oil all of a sudden. I need somebody who can push bog toads around, and that is not you yet. (Level 26)', options: [BYE] },
    oil_done: { text: 'He squeezes a bulb and sniffs. "Good. Smells like next week." He counts coins into your hand, slowly, as if each one hurts. "If that light up north gets any brighter, I am raising prices. Do not tell Ama."', options: [{ text: 'My lips are sealed.' }] },
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
  lookout: 'The North Watch. A wooden tower with a windbreak of wolf pelts and a lamp at the top. It faces north, like everything up here.',
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
