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
//       refill, shop ('<händler>'), bet (['<schnecke>', gold], Schneckenrennen in shared/races.js),
//       invest / grantShare ('<geschäft>'), dividend, ledger (Counting House, shared/ventures.js)
// Seiten werden nur gezeigt, wenn mindestens eine Antwort übrig bleibt (sonst endet das Gespräch).

import { PROFESSIONS } from './professions.js';
import { CLASSES, UNLOCK_LEVEL } from './classes.js';
import { RACE } from './races.js';
import { INN } from './tavern.js';
import { VENTURES, SHARE_MAX } from './ventures.js';

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
        { text: 'There is a carrier hiding in the old mill.', to: 'ls_ama', if: { quest: { the_last_sack: 'active' } } },
        { text: 'Wenna says their fire is going hungry.', to: 'ls_ama_after', if: { quest: { the_last_sack: 'done' } } },
        ...t.options,
        { text: 'Can I fill my lantern?', to: 'oil', do: [{ refill: true }] },
        { text: 'What is out there?', to: 'grey' },
        { text: 'What does a Warden carry, besides a shield?', to: 'sb_ama', if: { quest: { old_strongbox: 1 } } },
      { text: 'Did Brindle tell you about the carriers?', to: 'ama_carriers', if: { quest: { carriers_dark: 'done' } } },
        { text: 'The Stranger has no shadow by the Beacon.', to: 'ama_shadow', if: { quest: { catch_a_shadow: 'done' } } },
        { text: 'How is the Beacon?', to: 'ama_fuel' },
      BYE,
      ],
    },
    ama_carriers: { text: 'She shouted it up the road, so the whole village knows. Lamps, walking, with nothing to carry. Ama looks at the Beacon for a long moment. "If somebody out there is short of fire, they will come looking for ours. Feed the Beacon. Every night. I am not asking."', options: [BYE] },
    ama_shadow: { text: 'Ama keeps her eyes on the fire. "Some people do not have much light to spare. Maybe his is somewhere else." She throws on a log harder than it needs. "Fen told me. Fen tells everybody. I would rather Fen drew geese."', options: [BYE] },
    ama_fuel: { text: '"Hungry." She taps the tally board by the woodpile. "It ate more last night than the night before, and the night before that. No wind, no rain, nothing to blame. Just hungrier." She looks north. "Feed it every evening. I have a feeling we will need every log by next week."', options: [BYE] },
    sb_ama: { text: 'A shield, and a lantern. Always both. A shield without a light is a door in the dark. A light without a shield is a target. Why, is Coyne setting riddles again? Abel used to do that.', options: [BYE] },
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
    ls_ama: { text: 'Ama does not look surprised. She looks like somebody adding a number to a column she does not like. "Feed her. Let her rest. Do not let Pell near her, he will put her in the morning news." She looks at the Beacon. "If they walk south with fewer lamps every week, whatever they keep alight up there is getting less. And ours eats more every night. I do not like two things being true at the same time."', options: [BYE] },
    ls_ama_after: { text: 'Ama stops counting logs. "Hungry." She says it the way she says "rain". "Then the glow up north is a fire running out of wood, and it is pulling at every light in the Grey to stay alive, ours too." She picks the log back up. "Tell everybody to bring wood. Not today. Every day."', options: [BYE] },
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
        { text: 'Wenna asks about a prayer under a white stone.', to: 'ls_tallow', if: { quest: { the_last_sack: 3 } }, do: [{ advance: 'the_last_sack' }] },
        { text: 'Do you know of a lamp under the hill?', to: 'lh_tallow', if: { quest: { lamp_under_the_hill: 2 } }, do: [{ advance: 'lamp_under_the_hill' }] },
        { text: 'Anything new at the altar?', to: 'po_offer', if: { quest: { kindling: 'done', prayer_not_ours: 'none' } }, do: [{ start: 'prayer_not_ours' }] },
        { text: 'About the folded prayer...', to: 'po_done', if: { quest: { prayer_not_ours: 3 }, has: { prayer_slip: 1 } }, do: [{ take: { prayer_slip: 1 } }, { advance: 'prayer_not_ours' }] },
        { text: 'I brought your chalk back.', to: 'cs_back', if: { quest: { catch_a_shadow: 'done' }, has: { chapel_chalk: 1 } }, do: [{ take: { chapel_chalk: 1 } }, { give: { lamp_oil: 2 } }] },
        { text: 'Fen needs chalk.', to: 'cs_chalk', if: { quest: { catch_a_shadow: 0 } }, do: [{ give: { chapel_chalk: 1 } }, { advance: 'catch_a_shadow' }] },
        ...t.options, ...f.options, ...a.options, { text: 'I want to pray.', to: 'pray' }, { text: 'Does it ever answer?', to: 'answer' },
        { text: 'How did the drowned choir end a hymn?', to: 'sb_tallow', if: { quest: { old_strongbox: 1 } } },
        BYE,
      ],
    },
    cs_back: { text: 'Tallow stares at the chalk, then at you. "Nobody has ever brought the chalk back. Not once, in twenty years." He puts it on the hymn board with great ceremony. "Take some oil. And do not tell anybody, or they will all start doing it, and then where will the miracle be?"', options: [BYE] },
    cs_chalk: { text: 'He sighs and hands over a stick of chalk from the hymn board. "For shadows? Fen asked me last week if the Nightwright has a shadow. I said I would have to see him first." He smiles. "Bring the chalk back. You will not. Nobody does."', options: [BYE] },
    sb_tallow: { text: 'With a bell. Every hymn, forty voices, and then one small bell, so the singers knew to stop. I keep it here. I do not ring it.', options: [BYE] },
    op_offer: { text: 'People say there is an older chapel under the Sinkmarsh ruins. Older than ours. Built for someone else. There is a shrine in the ruins; if there is a prayer left on it, I would like to read it.', options: [{ text: 'I will look.' }] },
    op_done: { text: '"To the one who holds the lamp." Not the Nightwright, then. The stairs under the ruins, they will let you down now. Take a light. Take two.', options: [{ text: 'I will be careful.' }] },
    dc_offer: { text: 'It said there was a choir. Forty voices, singing to "the one who holds the lamp". The pilgrims down there are still singing, I think. The Mire Lurkers in the deep marsh swallow their books. Bring me three. I want to read what they sang.', options: [{ text: 'Three wet books. Fine.' }] },
    dc_early: { text: 'It did. Something about a choir. But the deep marsh is no place for you yet. Come back when you have more years on you. (Level 28)', options: [BYE] },
    dc_books: { text: 'He reads for a long time. "They sang to keep something lit. Every hymn ends with a bell." There is an old bell frame sunk in the south-west of the marsh. Find the bell, take it down the stairs, and ring it. Then quiet them. Gently, if you can. Six should break the song.', options: [{ text: 'A bell. Then quiet.' }] },
    dc_done: { text: 'He holds the bell and does not ring it. "Forty voices, and none of them for us." He gives you a mantle that was drying behind the altar. "One of theirs. It still hums the low part. It will keep you warm down there, when you go for the light."', options: [{ text: 'Thank you, Brother.' }] },
    pray: { text: 'Kneel at the altar, say what the world is missing, and be patient. Some prayers are answered by morning. Some take longer. Drop a white stone in the box while you are there.', options: [BYE] },
    wraiths: { text: 'Mostly. The pilgrims are. But some nights I still hear the low part, all the way up here. A few of the singers stayed in the side aisles, the ones who sang loudest. If you are down there, sing them out. Gently.', options: [BYE] },
    ls_tallow: { text: 'Tallow lifts the white stone on the altar. The birch-bark prayer is still under it, brown ink, very tidy: "To the hearth that feeds us. We are feeding you what we have left." He reads it again as if it might have changed. "Tell her it was read. Every morning. Tell her I do not know who hears what is said in here, but it is kept safe under a stone, where no wind can take it." He puts the stone back, very gently.', options: [{ text: 'I will tell her.' }] },
    lh_tallow: { text: 'Tallow sits down on the altar step, which he never does. "A lamp, held by somebody, that keeps the Grey out." He looks up at the chapel roof. "The drowned chapel sang to the one who holds the lamp. The quarrymen lit niches for the lamp under the hill. We pray to the Nightwright, who pushes the Grey back every night." He is quiet for a while. "Tell Hesk the chapel thinks it is the same light, seen through different doors. Tell him the chapel is not sure. Tell him I would like to see a niche."', options: [{ text: 'I will tell him.' }] },
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
        { text: 'Flint needs a cart wheel.', to: 'tw_rook', if: { quest: { three_wheels: 1 }, has: { scrap: 5 } }, do: [{ take: { scrap: 5 } }, { give: { cart_wheel: 1 } }, { advance: 'three_wheels' }] },
        { text: 'Teach me masterwork.', to: 'mw_offer', if: { quest: { rook_masterwork: 'none' }, profLevel: { tinkering: 30 } }, do: [{ start: 'rook_masterwork' }] },
        { text: 'Teach me masterwork.', to: 'mw_early', if: { quest: { rook_masterwork: 'none' }, profBelow: { tinkering: 30 } } },
        { text: 'Three bars of cinder iron.', to: 'mw_iron', if: { quest: { rook_masterwork: 1 }, has: { cinder_iron: 3 } }, do: [{ take: { cinder_iron: 3 } }, { advance: 'rook_masterwork' }] },
        { text: 'My first masterwork. And your tongs.', to: 'mw_done', if: { quest: { rook_masterwork: 4 }, has: { rooks_tongs: 1 } }, do: [{ take: { rooks_tongs: 1 } }, { advance: 'rook_masterwork' }] },
        { text: 'You are inside now?', to: 'mw_inside', if: { quest: { rook_masterwork: 'done' } } },
        { text: 'Fen needs a horrible tin face.', to: 'cb_rook', if: { quest: { crows_in_the_barley: 2 } }, do: [{ give: { tin_face: 1 } }, { advance: 'crows_in_the_barley' }] },
        { text: 'Can you use this verdigris?', to: 'rook_verdigris', if: { has: { verdigris: 1 } } },
        ...s.options, ...k.options, BYE,
      ],
    },
    tw_rook: { text: '"Flint? Under the hill, three wheels, owes me for brass?" Rook takes the scrap and disappears into the yard. There is a great deal of hammering and some words. He comes back with a wheel. "Best wheel in the Grey. Tell him we are not square. Tell him we will never be square."', options: [{ text: 'I will tell him.' }] },
    mw_offer: { text: '"Masterwork." He says it like a swear word he is fond of. "Anyone can bend brass. Masterwork is iron that has been told what to be and believes it. Kindle iron is soft as butter. Under the hill in Cinderford they dig cinder iron. Bring me three bars and I will show you. At my good bench. Inside." He looks at the workshop as if it owes him money.', options: [{ text: 'Three bars of cinder iron.' }] },
    mw_early: { text: '"Masterwork? You still bend brass like it is bread. Come back when your tinkering has a few more years in it. (Tinkering 30)"', options: [BYE] },
    mw_iron: { text: 'He weighs a bar in his hand, taps it on the anvil and listens. It rings for a long time. "Good. It remembers." He picks up his hammer, looks at the yard, looks at the workshop door, and sighs. "Masterwork needs a roof. And a vise that does not wobble. Fine. Inside. Tansy has my old tongs; she hid them so I would have to come in for them."', options: [{ text: 'Inside, then.' }] },
    mw_done: { text: 'He hangs the tongs back on his belt, then turns your piece over three times, holds it up to the light and bites it, which nobody expected. "Hm. It is not bad. It is better than not bad." From Rook that is a parade. "The bench is yours whenever you need it. I will be in here. It is warmer. Do not tell Tansy I said so."', options: [{ text: 'Thanks, Rook.' }] },
    mw_inside: { text: '"For masterwork. When it rains. When Tansy is not moving my things." He bangs a rivet flat. "The rest of the time I am out here. A man needs a yard to shout in, and you need someone to show your work to."', options: [BYE] },
    r_offer: { text: 'Busy? I am out of scrap, out of tea, and out of patience. Six scrap. The heaps east of town have plenty, if you know how. Greylings drop some too.', options: [{ text: 'Six. Got it.' }] },
    r_done: { text: 'Six. Hm. Two are good. Here, a coat I was saving for someone better. Do not tell them.', options: [{ text: 'Thanks, Rook.' }] },
    cb_rook: { text: 'Rook takes a tin plate and a hammer and does not ask a single question. Thirty seconds later there is a face on it, with eyebrows. "Horrible enough?" It is. It looks a lot like Rook. Nobody says so.', options: [{ text: 'Perfect.' }] },
    rook_verdigris: { text: 'He scrapes the green crust with a thumbnail and sniffs it. "Brass that sat in the wet for a hundred years and got clever about it. Keeps the damp out of iron." He points at the workbench. "Three of that and two cinder iron make boots that walk through a sewer and come out dry. More for a hood, more again for a coat. Sumpwalker gear, Cinderford calls it. Tinkering 38 and up. Do not bring it inside, Tansy will smell it."', options: [BYE] },
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
        { text: 'Brindle saw people on the north edge.', to: 'fen_carriers', if: { quest: { carriers_dark: 'done' } } },
        { text: 'What are you drawing on the ground?', to: 'cs_offer', if: { quest: { kindling: 'done', catch_a_shadow: 'none' } }, do: [{ start: 'catch_a_shadow' }] },
        { text: 'The Stranger has no shadow.', to: 'cs_done', if: { quest: { catch_a_shadow: 3 } }, do: [{ advance: 'catch_a_shadow' }] },
        { text: 'Still catching shadows?', to: 'cs_after', if: { quest: { catch_a_shadow: 'done' } } },
        { text: 'There is a carrier in the old mill.', to: 'fen_wenna', if: { quest: { the_last_sack: 'active' } } },
        { text: 'You look like you are plotting.', to: 'cb_offer', if: { quest: { kindling: 'done', crows_in_the_barley: 'none' }, classLevel: 2 }, do: [{ start: 'crows_in_the_barley' }] },
        { text: 'Feathers, and a tin face from Rook.', to: 'cb_done', if: { quest: { crows_in_the_barley: 3 }, has: { crow_feather: 3, tin_face: 1 } }, do: [{ take: { crow_feather: 3, tin_face: 1 } }, { advance: 'crows_in_the_barley' }] },
        { text: 'Whose is the empty house by the well?', to: 'mc_offer', if: { quest: { not_from_here: 'done', map_of_crosses: 'none' } }, do: [{ start: 'map_of_crosses' }] },
        { text: 'I found a map full of crosses.', to: 'mc_fen', if: { quest: { map_of_crosses: 1 }, has: { crossed_map: 1 } }, do: [{ advance: 'map_of_crosses' }] },
        { text: 'A bit scary.', to: 'scary' }, BYE,
      ],
    },
    fen_carriers: { text: '\"PEOPLE? With lamps? Walking? Then there is a road up there, and if there is a road, it goes somewhere!" Fen is already drawing it on the map. "I am putting a dotted line. Dotted means maybe. Do not tell Ama I drew a road. She will make me un-draw it.', options: [BYE] },
    f_offer: { text: 'Quills! For maps! Crows have the best feathers and they will not share. Four, please. Four is a good number.', options: [{ text: 'Four feathers.' }] },
    f_done: { text: 'These are perfect. Here, my best survey notes. I measured a goose. It moved.', options: [{ text: 'Thanks, Fen.' }] },
    mc_offer: { text: '"Nobody\'s. Somebody\'s. Somebody lived there before I was born, and they had a MAP." Fen lowers their voice. "Ama will not let me in. You are bigger. Go and look at the map on the wall, and bring it to me, carefully. Maps tear. I know. I have torn lots."', options: [{ text: 'I will look.' }] },
    mc_fen: { text: 'Fen spreads the map on the ground and goes very quiet. "Everything is crossed out. The meadow, Hushwood, the mines, the marsh. Like somebody looked everywhere for something." A grubby finger finds a little circle, far up at the top, past the North Watch. "Except there. That is not a cross. That is a CIRCLE." Fen looks up. "Climb the Watch at night and look where the circle is. Then ask Brindle. Brindle writes down everything."', options: [{ text: 'At night, then.' }] },
    cs_offer: { text: '"SHADOWS. At night the Beacon makes everybody\'s shadow really long, so I draw round them in chalk. I have a cat, a goose and Pell. Pell moved." Fen holds up an empty hand. "I ran out of chalk. Brother Tallow has chalk for the hymn numbers. Get me some, then draw yours. And then, then, get the Stranger to stand in the ring. I want his. He always walks away when I ask."', options: [{ text: 'Chalk, then shadows.' }] },
    cs_done: { text: 'Fen stares at you. Then at the ring. Then at the Beacon. "Everybody has a shadow. The goose has a shadow." Fen is quiet for a whole three seconds, which is a record. "I am not scared. I am writing it down. In pencil, in case it comes back." Fen hands over a bread roll that has been in a pocket a long time, and the glow draught Tallow gave for emergencies. "This is an emergency."', options: [{ text: 'Do not follow him, Fen.' }] },
    cs_after: { text: '"Every night. The cat, the goose, Pell, you. And one empty space." Fen has drawn a little circle round the empty space. "I asked Ama. Ama said some people do not have much light to spare. That is not an answer. That is an Ama answer."', options: [BYE] },
    fen_wenna: { text: '"A REAL one? From the light?" Fen is already halfway to the mill road before you catch the collar. "Does she have a shadow? Can I carry something for her? I am very strong. I carried the goose once." Fen thinks. "The goose did not like it."', options: [BYE] },
    cb_offer: { text: '"Plotting? No. Planning." Fen whispers. "The crows are eating all the barley by the Old Mill. There is a scarecrow, but it is wearing Pell\'s old coat, and the crows think it is Pell. Nobody is scared of Pell." Fen counts on muddy fingers. "Shoo some crows. Get feathers, crows hate seeing their own feathers. And Rook has to make it a face. A horrible one."', options: [{ text: 'A horrible face. Got it.' }] },
    cb_done: { text: 'Fen runs off toward the mill and comes back much later, muddy and delighted. "Feather collar. Tin face. I made it wave." Fen shows you how it waves. "Three crows fell over. One of them was Pell\'s favourite." Fen presses bread and barley into your hands. "From Hollis, for the mill. I said you did most of it. You did some of it."', options: [{ text: 'Good scarecrow, Fen.' }] },
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
        { text: 'What do you make of cinder iron?', to: 'cinder', if: { has: { cinder_iron: 1 } } },
        { text: 'Wenna says this grit makes lanterns.', to: 'grit', if: { has: { glass_grit: 1 } } },
        { text: 'What do you make of this glass?', to: 'nf_glass', if: { quest: { not_from_here: 1 }, has: { cold_glass: 1 } }, do: [{ advance: 'not_from_here' }] },
        { text: 'Can you read this tally stick?', to: 'cd_tally', if: { quest: { carriers_dark: 3 }, has: { tally_stick: 1 } }, do: [{ advance: 'carriers_dark' }] },
        ...t.options, ...l.options, BYE,
      ],
    },
    grit: { text: 'Wren pours a little into her palm and tilts it to the light. "Ground glass, green, fine as flour. You do not grind glass for fun. You grind it to pour it again, thicker." She is already reaching for a crucible. "Two of this, brass, and a page of survey notes for the reflector, and I can teach any lampwright to pour a lantern like the cold one on the north edge. Lampwright 22. And tell nobody I was excited."', options: [BYE] },
    cinder: { text: '"Iron that holds heat." Wren taps the bar on the bench and listens to it ring. "Put a wisp core behind good glass, wrap it in this, and the oil lasts half again as long. I made one last night. I have not slept. Then a staff and a lens, because why stop. Lampwrights can make all three, if they have the hands for it."', options: [BYE] },
    green: { text: 'Wren holds the shard to the light for a long time. "Same hand as the cold lantern. Poured thick, cooled fast." A pause. "Three of these and a bit of brass make a decent lens, if you are a lampwright. If you are not, sell them to one. Or to Fen, Fen pays in drawings."', options: [BYE] },
    en_lens: { text: 'Wren takes a lump of good Kindle glass off the shelf and grinds for a long, dusty while, then rubs it with the wisps until they give up. "There. It does not make things bigger. It makes them closer, which is worse. Tell Brindle not to drop it."', options: [{ text: 'Thanks, Wren.' }] },
    en_wisps: { text: 'A spyglass? Fine. Glass I have. To polish it I need grey wisps, three of them. They hate the light so much that they rub every speck of it smooth.', options: [{ text: 'Three wisps.' }] },
    nf_glass: { text: 'Green, poured thick, full of tiny bubbles. Nobody in Kindle pours glass like this, and I would know. Whoever made it had sand, a hot fire and no patience. Show the Stranger. He looks at lanterns like he misses one.', options: [{ text: 'I will.' }] },
    cd_tally: { text: 'Wren runs a thumb down the notches. "Forty to a row. Forty, forty, forty, for years of rows. A carrier\'s tally: one notch for every load that arrived." Wren turns it over. "And then the rows get short. Twenty. Twelve. The last one has eight." The stick comes back to you. "Somebody used to carry forty of something, every time. Now they carry what they can find."', options: [{ text: 'Forty. Like the crates in the ledger.' }] },
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
        { text: 'The carriers dropped this bread.', to: 'cd_bread', if: { quest: { carriers_dark: 4 }, has: { hollow_ration: 1 } }, do: [{ take: { hollow_ration: 1 } }, { advance: 'carriers_dark' }] },
        { text: 'Fen wants your shadow. Stand in the ring?', to: 'cs_ring', if: { quest: { catch_a_shadow: 2 }, night: true }, do: [{ advance: 'catch_a_shadow' }] },
        { text: 'Fen wants your shadow. Stand in the ring?', to: 'cs_day', if: { quest: { catch_a_shadow: 2 }, day: true } },
        { text: 'You have no shadow.', to: 'cs_none', if: { quest: { catch_a_shadow: 'done' } } },
        { text: 'There is a carrier called Wenna in the old mill.', to: 'ls_stranger', if: { quest: { the_last_sack: 'active' } } },
        { text: 'Wenna is going home, north.', to: 'ls_stranger_after', if: { quest: { the_last_sack: 'done' } } },
        ...t.options, { text: 'Where are you from?', to: 'from' }, BYE,
      ],
    },
    fl_offer: { text: '"I know. I followed it here." A long pause. "It goes out, or this village does. Take friends. When he puts the lights out, put them back."', options: [{ text: 'We will.' }] },
    fl_done: { text: '"Good." For the first time, the Stranger smiles. It does not help. "There are more lamps out there. This was the nearest."', options: [{ text: '...more?' }] },
    nf_hungry: { text: 'The Stranger turns the glass in his fingers for a long time. "There is a fire out there that is hungry. This held a little of it, once." He keeps the glass. "Tell the child to stay home."', options: [{ text: '...hungry?' }] },
    prayer: { text: '"Did they." The Stranger looks at his hands. There is brown ink in the creases of his fingers, or maybe it is only dirt. "Then somebody still thinks it helps."', options: [{ text: '...' }] },
    hollow: { text: 'The Stranger is very still. "Where did you hear that?" You tell him about the ledger. "Crates of glimmer, every week." He almost laughs. "Then somebody here used to remember." He turns away. "Keep your wick trimmed."', options: [{ text: '...' }] },
    from: { text: 'Further out than you have been. There is another light out there. Keep your wick trimmed.', options: [BYE] },
    cd_bread: { text: 'The Stranger takes the bread and breaks off a corner. He eats it slowly, with his eyes shut. "Peat," he says. "You can only bake it over peat." He looks at the tally stick in your hand and does not ask to hold it. "They are not carrying it to you. They are walking the old way south, the way the glimmer used to go north. With almost nothing." He pockets the rest of the bread. "Tell the girl on the tower to keep counting."', options: [{ text: 'Who are they?', to: 'cd_who' }, BYE] },
    cs_ring: { text: 'The Stranger looks at you for a long time. Then he walks to the chalk ring, stands in it with his back to the Beacon, and waits. The Beacon roars. Your shadow stretches to the well. His does not. There is nothing on the cobbles at his feet at all. "Satisfied?" He steps out of the ring and the light goes on without him. "Tell the child it is a trick of the fire. It is not a lie. Not exactly."', options: [{ text: '...' }] },
    cs_day: { text: '"In daylight?" The Stranger almost smiles. "Everybody has a shadow in daylight. Ask me again by the fire, after dark."', options: [BYE] },
    cs_none: { text: '"I have one." He holds up his hand to the Beacon and looks at the ground where it should fall. "It is at home. Where the light is mine." He puts the hand in his pocket. "Keep your wick trimmed."', options: [BYE] },
    ls_stranger: { text: 'He goes very still. "Wenna." He says the name the way you would pick up something hot. "Still carrying, then. Good." He looks at the mill road and does not move toward it. "Do not tell her I am here. She would ask me why I have not gone home yet, and I would have to answer."', options: [BYE] },
    ls_stranger_after: { text: '"North, along the stones that point." He turns his hand over in the Beacon light, where the shadow ought to be. "She will tell them your fire still lights other fires. That will matter more than you think." He does not say to whom.', options: [BYE] },
    cd_who: { text: '"People who remember a road you have forgotten." He says it gently, which is worse.', options: [BYE] },
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
      { text: 'A carrier from the north is in the old mill.', to: 'h_wenna', if: { quest: { the_last_sack: 'active' } } },
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
  h_wenna: { text: 'Haskel puts down his axe. "In the mill? Then the smoke I smelled on the wolves was hers. Peat." He scratches his head. "Tell her the wolves are scared of her people, not the other way round. And tell her the north road is still there. Overgrown, but there. I cut it back as far as the stones, every spring. Nobody asked me to. Seemed rude not to."', options: [BYE] },
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
      { text: 'Flint asks about the deep seam.', to: 'ds_brack', if: { quest: { deep_seam: 1 } }, do: [{ advance: 'deep_seam' }] },
      { text: 'Look at this miller\'s ledger.', to: 'ml_brack', if: { quest: { millers_ledger: 2 }, has: { millers_ledger: 1 } }, do: [{ advance: 'millers_ledger' }] },
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
  ml_brack: { text: 'Brack holds the miller\'s ledger next to the Foreman\'s in his head and whistles. "Glass grit from the mill, glimmer from the mine, iron from the deep seam. All up the north road, all for the Hollow." He hands the book back. "Somebody up there was building something out of all of Kindle, a little every month. And then everyone down here forgot. That is not forgetting. That is being made to forget." He spits in the fire. "Or I need a nap."', options: [{ text: 'Take a nap, Brack.' }] },
  ds_brack: { text: '"Flint? From under the hill?" Brack scratches his beard. "The deep seam. My grandfather dug it, before the Grey covered the far end. Black iron, east of the old shaft. The Foreman\'s ledger says it went north with the glimmer, some years." He looks east, then north, and frowns at both. "Tell Flint the seam is his if he wants it. Tell him to bring his own beetles."', options: [{ text: 'I will tell him.' }] },
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
      { text: 'Anything new up north?', to: 'cd_offer', if: { quest: { eyes_north: 'done', carriers_dark: 'none' }, classLevel: 16 }, do: [{ start: 'carriers_dark' }] },
      { text: 'Anything new up north?', to: 'cd_early', if: { quest: { eyes_north: 'done', carriers_dark: 'none' }, below: 16 } },
      { text: 'I followed the carriers.', to: 'cd_done', if: { quest: { carriers_dark: 5 } }, do: [{ advance: 'carriers_dark' }] },
      { text: 'Seen the carriers again?', to: 'cd_after', if: { quest: { carriers_dark: 'done' } } },
      { text: 'One of the carriers is in the old mill.', to: 'br_wenna', if: { quest: { the_last_sack: 'active' } } },
      { text: 'What is out there, where this circle is?', to: 'mc_done', if: { quest: { map_of_crosses: 3 } }, do: [{ take: { crossed_map: 1 } }, { advance: 'map_of_crosses' }] },
      { text: 'What do you see up there?', to: 'see' },
      { text: 'Can I read your book?', to: 'book', if: { quest: { eyes_north: 'done' } } },
      { text: 'Why a lookout?', to: 'why' },
      BYE,
    ],
  },
  cd_offer: { text: '"Lights. Small ones, five or six, walking in a line along the edge of the trees, west to east. Not wolves, not wisps. People, carrying lamps and something heavy." She taps her book. "They stopped by the stream west of the cold lantern, and then the gnawers came and they ran. Go and see what they left behind. Take a big stick. The gnawers have a lot of teeth and no manners."', options: [{ text: 'I will look.' }] },
  cd_early: { text: '"Lights on the edge of the trees, walking. I want somebody to go and look, but the things that came after them would eat you. Come back with a few more levels. (Level 16)"', options: [BYE] },
  cd_done: { text: 'She writes it all down: the frame, the tally, the bread, what Wren said, what the Stranger said, and underlines "the old way south" three times. "So the glow up north has people under it. Hungry people, walking." She closes the book. "Here: the wraps one of them dropped, and Haskel\'s salve. I will keep counting. Tell Ama. No, I will tell Ama. She listens to me when I shout."', options: [{ text: 'Thanks, Brindle.' }] },
  cd_after: { text: '"Twice more. Always at night, always heading east along the trees, always fewer lamps than the time before. Last night, three." She does not look up from her book.', options: [BYE] },
  br_wenna: { text: 'Brindle\'s pencil stops. "One of the lamps." She flips back through her book. "Five, four, three, two. I thought the missing ones had gone home." She writes something and underlines it. "They did not go home. They got lost, or they stopped." She closes the book hard. "Feed her. And ask her, gently, how many there were when they set out."', options: [BYE] },
  en_hello: { text: 'Good, hands. The tower is up, more or less. The wind up there could peel an apple. I need three wolf pelts for a windbreak, and the wolves are, helpfully, all around us. After that, a proper glass.', options: [{ text: 'Three pelts.' }] },
  en_pelts: { text: 'She nails them up along the rail, fur side in. "Better. Now I can stay up there long enough to see something. What I need next is a spyglass. Wren in Kindle grinds lenses. Wren will want something for it. Wren always does."', options: [{ text: 'I will ask Wren.' }] },
  en_glass: { text: 'She fits the lens into a brass tube and squints through it at a tree. "Hah. That tree has a beetle on it." She hands you the tube back. "You did the work, you get the first look. Wait for dark, climb up and look north. Then come and tell me I am not mad."', options: [{ text: 'After dark, then.' }] },
  en_done: { text: '"A fire, then. Not a woodfire. A big one, low and steady, like a hearth." She writes it down in a little book full of dates. "It was smaller last week. I will keep watching. Here, my spare hood, it has a lamp on it. And salve. Haskel says it fixes everything but manners."', options: [{ text: 'Thanks, Brindle.' }] },
  mc_done: { text: 'Brindle holds the map against her book and turns pages for a long time. "There. Every night the glow sits low on the horizon, just there. Every night the lamps walk toward it, or away from it." She taps the circle. "Whoever drew this crossed out every place around Kindle, looking for something. Then they found it, and drew a circle, and left." She keeps the map. "I will copy it. Here, take my notes, and something warm. And do not tell Fen it has a circle on it. Fen will want to go."', options: [{ text: 'Too late.' }] },
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
  // Seit Tag 3: am Cup Day (Wochenende) der hohe Einsatz
  const cupBets = Object.entries(S).map(([id, sn]) => ({ text: `${RACE.cup.stake} gold on ${sn.name}, for the Cup. (pays ${RACE.cup.stake * sn.odds})`, if: { gold: RACE.cup.stake, cupDay: true }, do: [{ bet: [id, RACE.cup.stake] }] }));
  const odds = Object.values(S).map((sn) => `${sn.name} pays ${sn.odds} to 1`).join(', ');
  return {
    start: {
      text: 'Mabb. I keep snails. Racing snails. Do not laugh, they can hear you.',
      options: [
        { text: 'You look like you could use a hand.', to: 'q_offer', if: { quest: { kindling: 'done', off_to_races: 'none' } }, do: [{ start: 'off_to_races' }] },
        { text: 'I watched my snail race.', to: 'q_done', if: { quest: { off_to_races: 2 } }, do: [{ advance: 'off_to_races' }] },
        { text: 'Is that a trophy?', to: 'cup_offer', if: { quest: { off_to_races: 'done', snail_cup: 'none' } }, do: [{ start: 'snail_cup' }] },
        { text: 'Three wins. About that cup...', to: 'cup_done', if: { quest: { snail_cup: 3 } }, do: [{ advance: 'snail_cup' }] },
        { text: 'Did you write this letter?', to: 'ul_mabb', if: { quest: { unsent_letter: 1 }, has: { unsent_letter: 1 } }, do: [{ advance: 'unsent_letter' }] },
        { text: 'Your mother got your letter.', to: 'ul_done', if: { quest: { unsent_letter: 3 } }, do: [{ advance: 'unsent_letter' }] },
        { text: 'Your mother sent you a map.', to: 'ir_done', if: { quest: { ivys_reply: 0 }, has: { ivys_map: 1 } }, do: [{ take: { ivys_map: 1 } }, { advance: 'ivys_reply' }] },
        { text: 'Do you remember the miller?', to: 'ml_mabb', if: { quest: { millers_ledger: 1 } }, do: [{ advance: 'millers_ledger' }] },
        { text: 'I want to place a bet.', to: 'stake', if: { gold: Math.min(...RACE.stakes) } },
        { text: 'Who is racing?', to: 'field' },
        { text: 'What is Cup Day?', to: 'cupday' },
        { text: 'How does this work?', to: 'how' },
        BYE,
      ],
    },
    ul_mabb: { text: 'Mabb goes red to the ears. "The one in the hat is Duchess. Of course it is Duchess." He looks at the letter, not at you. "I lodged with Abel, before. My mother is down in Cinderford. I wrote that the week the Grey ate the road, and then there was no road to send it down." He pushes it back. "It is open again. Take it to her? I cannot leave the snails. She is the one who draws maps all day. She will say they are wrong. They are always wrong."', options: [{ text: 'To Cinderford.' }] },
    ir_done: { text: 'Mabb unrolls the map, finds his own little house on it, and has to turn round for a moment to look at the snails very hard. "Right in the evening. Hah." He pins it to the race board. "Here. Duchess has a spare hat. She does not know I am giving it away. She will not mind. She will mind a bit."', options: [{ text: 'Thank you, Mabb.' }] },
    ml_mabb: { text: '"The miller. Dunnock." Mabb says it as if he had been waiting years for somebody to ask. "Whistled all day, terrible at it. Every month he took a cart of something heavy north, and every month he came back with peat-smoked bread for the snails. They loved it." He looks at the empty track. "Then the Grey took the road west, and the north road went quiet, and one morning the mill was turning and Dunnock was gone. Took the north road, people said. Nobody went to look."', options: [{ text: 'Thank you, Mabb.' }] },
    ul_done: { text: '"She read it? What did she say?" You tell him. He sits down on the race fence and does not say anything for a while. Duchess, in her hat, looks pleased with herself. "Cakes. She sent cakes. She always sends cakes." He gives you some. "When the Cup is over I am going down there. Somebody has to tell her the maps are fine."', options: [{ text: 'Go and see her, Mabb.' }] },
    q_offer: { text: 'Business is slow. The snails think nobody believes in them. Put a bet on one, any one, and watch the race to the end. It does wonders for their confidence.', options: [{ text: 'I will place a bet.', to: 'stake', if: { gold: Math.min(...RACE.stakes) } }, { text: 'Later.' }] },
    q_done: { text: 'There. Did you see Bramble\'s face? Neither did I, but I could tell. Here, for your trouble. Come back any time, the snails always run.', options: [{ text: 'Thanks, Mabb.' }] },
    stake: { text: `Who do you fancy? ${odds}. One bet a race.`, options: [...cupBets, ...bets, { text: 'Not today.' }] },
    field: { text: Object.values(S).map((sn) => `${sn.name}: ${sn.text}`).join(' '), options: [{ text: 'I want to bet.', to: 'stake', if: { gold: Math.min(...RACE.stakes) } }, BYE] },
    how: { text: 'A race every few minutes, from the stones to the grass line. Bet before the bell, watch them crawl, collect if you were right. If you were wrong, the snails thank you for your support.', options: [BYE] },
    cupday: { text: `Saturdays and Sundays are Cup Day. Same snails, same track, but I take ${RACE.cup.stake} gold a bet as well, for the serious people. And the Cup sits on the barrel where everyone can see it.`, options: [BYE] },
    cup_offer: { text: 'The Kindle Snail Cup! Hammered out of an old kettle by Rook, who says he did not. Two new runners came down the west road for it: Duchess, in a hatbox, and Thistle, in a sock. Win three bets, any day, any snail, and the Cup is yours. I have a spare. I have several spares. Do not tell the snails.', options: [{ text: 'Three wins. I am in.' }] },
    cup_done: { text: 'Three! He holds the Cup up to the light, polishes it with his sleeve and puts it on your head. "It fits. They always fit. That is the secret of the Cup." The snails do not look up. They are very proud of you, in their way.', options: [{ text: 'Thanks, Mabb.' }] },
  };
})();

const snail = (id) => ({
  start: { text: `${RACE.snails[id].name}. ${RACE.snails[id].text}`, options: [{ text: 'Good luck.' }] },
});

// Tag 3 (Gebet): Rooks Werkstatt ist größer geworden. Tansy, sein Lehrling, steht drinnen an der guten Werkbank
// und bringt Salvage und Tinkering bei wie Rook selbst (Rook bleibt draußen in seinem Hof).
const tansy = (() => {
  const s = teaches('salvage', 'Rook says: heaps, wrecks, anything the Grey spat out. I say: gloves. Rook does not wear gloves. Rook has nine fingers.');
  const k = teaches('tinkering', 'The good bench is right here, inside, out of the rain. Rook built it for himself and then decided he likes the yard better. His loss.');
  return {
    start: {
      text: 'Tansy. Rook\'s apprentice. He made the workshop twice as big and then went back to work in the yard. I keep the inside.',
      options: [
        ...s.options, ...k.options,
        { text: 'Rook says you have his old tongs.', to: 'mw_tongs', if: { quest: { rook_masterwork: 2 } }, do: [{ give: { rooks_tongs: 1 } }, { advance: 'rook_masterwork' }] },
        { text: 'I need another pair of Rook\'s tongs.', to: 'mw_spare', if: { quest: { rook_masterwork: 4 } }, do: [{ give: { rooks_tongs: 1 } }] },
        { text: 'Rook came inside!', to: 'mw_tansy', if: { quest: { rook_masterwork: 'done' } } },
        { text: 'Why is Rook outside?', to: 'yard', if: { quest: { rook_masterwork: 'none' } } },
        { text: 'Rook says not to bring verdigris inside.', to: 'ts_verdigris', if: { has: { verdigris: 1 } } },
        { text: 'What is this bench?', to: 'bench' },
        BYE,
      ],
    },
    yard: { text: '"He says he can hear the scrap better out there. I think he likes shouting at people who walk past. He comes in when it rains, and complains that I moved things. I did move things. Now you can find them."', options: [BYE] },
    mw_tongs: { text: 'Tansy takes a pair of tongs from behind a loose brick. "He leaves them in the yard and then shouts that somebody stole them. Now he has to come in." She hands them over. "Masterwork goes on the good bench, right here. Cinder iron, a bit of greyglass, and patience. You can make it at this bench and no other, he says. He is right, which he will not let me forget."', options: [{ text: 'Thanks, Tansy.' }] },
    mw_spare: { text: '"Another pair?" Tansy pulls a second set of tongs out from under the coal bin. "I hide one pair for him to find and one pair for when he loses those. Take them to him."', options: [BYE] },
    mw_tansy: { text: '"He came in, he sat down at the good bench, he said \'hm\' and he stayed for two hours." She looks quietly delighted. "He has already complained about the light, the draught and my shelves. Now he comes in for every masterwork and goes back out to shout at the weather. It is progress."', options: [BYE] },
    ts_verdigris: { text: 'Tansy sniffs, and steps back. "He is right, for once. It smells like the bottom of a well that has been thinking about things." She points at the door with a spanner. "Workbench outside. Sumpwalker gear is a yard job. Rook will pretend he taught you. Let him."', options: [BYE] },
    bench: { text: '"Rook\'s good bench. Same as the one in the yard, but with a roof and a lamp, and nobody stepping on your fingers. Anything you can make out there, you can make in here. Warmer, too. And masterwork, which you can only make here. Ask Rook about that, if you are brave."', options: [BYE] },
    ...s.pages, ...k.pages,
  };
})();

// Tag 3 (Gebete): Coyne im Counting House. Anteile an den Geschäften von Kindle (content/ventures.js) und
// Abels alte Truhe mit drei Symbolrädern (Rätsel-Quest „The Old Strongbox“). Die Räder sind Seiten:
// Nur wer alle drei richtig stellt (Lantern, Bell, Moth), landet auf der Seite, die die Quest abschließt.
// Die Seiten mit x am Ende sehen gleich aus, führen aber sicher ins Leere.
const coyne = (() => {
  const SYMBOLS = ['Lantern', 'Shield', 'Bell', 'Moth', 'Snail', 'Wolf'];
  const ANSWER = ['Lantern', 'Bell', 'Moth'];
  const box = { quest: { old_strongbox: 1 } };
  const dial = (n, right, wrong, last = false) => SYMBOLS.map((sym) => ({
    text: `Turn it to the ${sym.toLowerCase()}.`, if: box,
    to: sym === ANSWER[n] && right !== null ? right : wrong,
    ...(last && sym === ANSWER[n] && right !== null ? { do: [{ take: { abels_riddle: 1 } }, { advance: 'old_strongbox' }, { grantShare: 'marrow' }] } : {}),
  }));
  const ventures = Object.entries(VENTURES).map(([id, v]) => ({
    text: `A share in ${v.name}. (${v.price} gold, pays ${v.dividend} a day)`, if: { canInvest: id }, to: 'bought', do: [{ invest: id }],
  }));
  const RIDDLE = 'One: every Warden carries two things, and one of them is a shield. Turn to the other. Two: forty voices sang under the marsh. Turn to what ended every hymn. Three: turn to what the keeper of the Night Market is named for.';
  return {
    start: {
      text: 'Coyne. I count things. Mostly other people\'s money, which is the best kind of thing to count.',
      options: [
        { text: 'A counting house, in Kindle?', to: 'stake_offer', if: { quest: { kindling: 'done', stake_in_kindle: 'none' } }, do: [{ start: 'stake_in_kindle' }] },
        { text: 'I would like to buy a share.', to: 'ventures' },
        { text: 'I have come for my share of the takings.', to: 'paid', if: { partner: true, dividendDue: true }, do: [{ dividend: true }] },
        { text: 'What is in that iron box?', to: 'box_offer', if: { quest: { kindling: 'done', old_strongbox: 'none' } }, do: [{ start: 'old_strongbox' }] },
        { text: 'I found Abel\'s note. Let me try the dials.', to: 'dial1', if: { quest: { old_strongbox: 1 }, has: { abels_riddle: 1 } } },
        { text: 'Any idea where Abel kept his notes?', to: 'box_where', if: { quest: { old_strongbox: 0 } } },
        { text: 'Was there anything else in the box?', to: 'cache_offer', if: { quest: { old_strongbox: 'done', abels_caches: 'none' }, classLevel: 12 }, do: [{ start: 'abels_caches' }] },
        { text: 'Was there anything else in the box?', to: 'cache_early', if: { quest: { old_strongbox: 'done', abels_caches: 'none' }, below: 12 } },
        { text: 'Three purses, with knots.', to: 'cache_done', if: { quest: { abels_caches: 3 }, has: { abels_purse_1: 1, abels_purse_2: 1, abels_purse_3: 1 } }, do: [{ take: { abels_purse_1: 1, abels_purse_2: 1, abels_purse_3: 1 } }, { advance: 'abels_caches' }] },
        { text: 'What do I own?', if: { partner: true }, do: [{ ledger: true }] },
        { text: 'Anything I can do for a partner?', to: 'cl_offer', if: { partner: true, quest: { cinderford_ledger: 'none' } }, do: [{ start: 'cinderford_ledger' }, { give: { sealed_ledger: 1 } }] },
        { text: 'Hesk sends his regards. And chalk dust.', to: 'cl_done', if: { quest: { cinderford_ledger: 3 } }, do: [{ advance: 'cinderford_ledger' }] },
        { text: 'How do shares work?', to: 'how' },
        { text: 'Could I buy a share in the old mill?', to: 'cy_mill', if: { quest: { who_grinds: 'done' } } },
        BYE,
      ],
    },
    stake_offer: { text: 'In Kindle, yes. Since the west road opened, coin moves again: Cinderford buys, Kindle sells, and somebody has to write it down. Buy a share in one of the businesses here. They get a new roof, you get a little of the takings every day. Then tell Marrow. He hates owing people.', options: [{ text: 'Show me what I can buy.', to: 'ventures' }, { text: 'Later.' }] },
    ventures: {
      text: `${Object.keys(VENTURES).length} businesses take partners, one of them in Cinderford. Up to ${SHARE_MAX} shares each. A share pays a little every day, and partners can buy what the shop keeps under the counter.`,
      options: [...ventures, { text: 'What do they want the gold for?', to: 'plans' }, { text: 'Not today.', to: 'start' }],
    },
    plans: { text: Object.values(VENTURES).map((v) => v.text).join(' '), options: [{ text: 'Back to the shares.', to: 'ventures' }, BYE] },
    bought: { text: 'She writes your name in the ledger in very small, very permanent letters. "Congratulations, partner. Come and see me once a day. The takings do not collect themselves. Well. They do. I collect them."', options: [{ text: 'Another share.', to: 'ventures' }, BYE] },
    paid: { text: 'She slides a little stack of coins across the table, counts them again, and lets go of them with visible effort. "Your share. Come back tomorrow. The shops do not sleep, and neither, apparently, do I."', options: [BYE] },
    cy_mill: { text: 'Coyne looks up from three columns at once. "The mill? It has no owner. A thing with no owner cannot pay anyone." She taps the ledger. "Abel kept an account for the miller, Dunnock. Flour in, glass out, north. Closed the week the north road went quiet, balance owing: one cart of barley, to Kindle." She smiles thinly. "If anybody ever comes back for that mill, they owe us barley. Until then it grinds for free, and I find that very hard to watch."', options: [BYE] },
    how: { text: `You buy a share for gold. The shop uses the gold, and from then on pays you a little every day: come here and I hand it over, once a day. Partners can buy the extra goods a shopkeeper keeps for friends. ${SHARE_MAX} shares in one business is the most I sell. Nobody owns Marrow. Not even Marrow.`, options: [{ text: 'Thanks.', to: 'start' }] },
    box_offer: { text: '"That? Abel\'s strongbox. Abel counted Kindle\'s money before me, and he loved two things: coins and riddles. He set the dials before he died, and nobody has opened it since. His old house is the one by the campfire. If he wrote the answer down, it is somewhere in there. He never threw anything away."', options: [{ text: 'I will look.' }] },
    box_where: { text: '"Abel? In his house, probably under something. He did not trust drawers. He said drawers are the first place a thief looks, and the floor is the last."', options: [BYE] },
    dial1: { text: `${RIDDLE} She folds her arms. "Go on. The first dial."`, options: [...dial(0, 'dial2', 'dial2x'), { text: 'Any hints?', to: 'hint' }, { text: 'Not yet.' }] },
    dial2: { text: 'Click. The second dial.', options: dial(1, 'dial3', 'dial3x') },
    dial2x: { text: 'Click. The second dial.', options: dial(1, null, 'dial3x') },
    dial3: { text: 'Click. The last dial.', options: dial(2, 'opened', 'stuck', true) },
    dial3x: { text: 'Click. The last dial.', options: dial(2, null, 'stuck') },
    cl_offer: { text: '"As it happens. My cousin keeps Hesk\'s books down in Cinderford, and he adds like a man counting sheep in his sleep. Take him these corrections. Well. Take them to Hesk. My cousin will only lose them."', options: [{ text: 'To Cinderford.' }] },
    cl_done: { text: '"Regards I can count. Chalk dust I cannot." She opens the returned ledger and nods at every page. "Better. He only lost seven coins this month. Here, for the walk. Partners who run errands get paid. Partners who do not, also get paid, but less."', options: [{ text: 'Thanks, Coyne.' }] },
    cache_offer: { text: '"One more note, at the very bottom. Three hiding places, in the order he counted them, each one a riddle. One in Hushwood, one at the far end of the old road west, one at the mines." She hands you the note. "Abel never put all his coins in one place. He never put all his riddles in one place either. Bring me what you find. I will count it. Then we will see."', options: [{ text: 'Three caches.' }] },
    cache_early: { text: '"There is another note. Three hiding places, one of them in Hushwood and one at the mines, where the wolves and beetles are. Come back when you have a few more levels. (Level 12)"', options: [BYE] },
    cache_done: { text: 'She unties the knots one by one, with a patience you did not know a person could have, and counts. And counts again. "Ninety, and a bit. Abel\'s rainy-day money." She pushes it over. "The bit is mine. Commission. He would have wanted it that way. He would have charged more."', options: [{ text: 'Thank you, Coyne.' }] },
    stuck: { text: 'The last dial clicks home. The lid does not move. Coyne pretends she was not watching, and writes something down.', options: [{ text: 'Try again.', to: 'dial1' }, { text: 'Any hints?', to: 'hint' }, BYE] },
    hint: { text: '"Abel liked his riddles plain. Ask the people who would know. Warden Ama about Wardens. Brother Tallow about the drowned choir. And for the last one, go and say hello to the Night Market after dark."', options: [{ text: 'Back to the dials.', to: 'dial1', if: box }, BYE] },
    opened: { text: 'The lid sighs open. Inside: a purse of old coins, two glow draughts wrapped in a sock, and a paper with a seal. Coyne reads it and laughs. "Abel\'s share in Marrow\'s stall. He left it to whoever opened the box." She writes your name over his. "Welcome, partner. Abel would have liked you. He liked anybody who could count to three."', options: [{ text: 'Thank you, Coyne.' }] },
  };
})();

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
      { text: 'Was the woman with the green lantern called Wenna?', to: 'mw_wenna', if: { night: true, quest: { the_last_sack: 'done' } } },
      { text: 'Why are you called Mothwick?', to: 'sb_moth', if: { quest: { old_strongbox: 1 } } },
      { text: 'I hear you take partners now.', to: 'partner_moth', if: { night: true, partner: 'mothwick' } },
      BYE,
    ],
  },
  sb_moth: { text: '"Because moths and I want the same thing, dear: the nearest lamp. My mother said I flew into the first one I saw. I have been following lights ever since."', options: [BYE] },
    partner_moth: { text: 'She lifts a cloth under the counter. "For partners, wisp cores and dusk draughts. Do not tell the others. The others are also partners. Tell nobody anything."', options: [{ text: 'Show me.', do: [{ shop: 'mothwick' }] }, BYE] },
  po_moth: { text: 'She rubs the paper between two fingers. "Birch bark, boiled and pressed. Nobody makes it this side of Hushwood. I bought a sheaf of it once, years ago, from a woman with a green lantern." She hands it back, a little too quickly. "Paper is paper, dear. Take it home to your priest."', options: [{ text: 'A green lantern?', to: 'po_green' }, { text: 'Thanks.' }] },
  po_green: { text: '"Green glass, thick as a thumb. She said her village poured it." Mothwick shrugs. "Lots of villages pour glass. Lots of villages go quiet. I do not ask which."', options: [BYE] },
  mw_wenna: { text: 'Mothwick goes quiet, which is rare. "Wenna? No, dear. The one I bought paper from was older, and she whistled." She turns one of her little lanterns until it faces north. "But the same green glass, the same birch bark on the handle. If they are sending the young ones now, with empty lamps, then the old ones have stopped walking." She does not try to sell you anything for a whole minute.', options: [BYE] },
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
      { text: 'Coyne says you take partners.', to: 'partner_hollis', if: { partner: 'hollis' } },
      { text: 'Is this your flour?', to: 'wg_hollis', if: { quest: { who_grinds: 2 }, has: { mill_flour: 1 } }, do: [{ take: { mill_flour: 1 } }, { give: { millbread: 2 } }, { advance: 'who_grinds' }] },
      { text: 'Could you bake this flour?', to: 'bake', if: { quest: { who_grinds: 'done' }, has: { mill_flour: 1 } }, do: [{ take: { mill_flour: 1 } }, { give: { millbread: 2 } }] },
      { text: 'Who was the miller?', to: 'ml_offer', if: { quest: { who_grinds: 'done', millers_ledger: 'none' }, classLevel: 6 }, do: [{ start: 'millers_ledger' }] },
      { text: 'The miller\'s ledger.', to: 'ml_done', if: { quest: { millers_ledger: 3 }, has: { millers_ledger: 1 } }, do: [{ take: { millers_ledger: 1 } }, { advance: 'millers_ledger' }] },
      BYE,
    ],
  },
  ml_offer: { text: '"The miller?" Hollis stops polishing. "My grandmother bought flour there every week, and she never once said his name. That is odd, for her. She said everybody\'s name, mostly loudly." He thinks. "Millers keep books. Millers hide books. Try round the door, under whatever looks too neat."', options: [{ text: 'I will look.' }] },
  ml_done: { text: 'Hollis turns the pages slowly, leaving floury thumbprints. "Glass, up the north road, every month. And names on the last page, crossed out." He closes it. "Then the mill was not only ours. It was half of a road, and the other half is up north, under the glow." He puts the ledger behind the bar, next to his grandmother\'s jig. "Some things you keep where people can ask about them. Here, bread. You have earned it twice."', options: [{ text: 'Thanks, Hollis.' }] },
  wg_hollis: { text: 'He rubs a pinch between finger and thumb. "Not mine, not Marrow\'s. This is stone-ground, fresh, from the old mill by the stream. Nobody has milled there since my grandmother was a girl." He has two loaves in the oven before you can argue. "On the house. And listen: three mornings now there have been little bags of flour on doorsteps. Grey flour, smoky. Somebody grinds at night. Go and look in the hopper after dark."', options: [{ text: 'After dark, then.' }] },
  bake: { text: '"One sack, two loaves. I do it for the smell." He takes the flour and comes back with bread so warm it steams. "Millbread. Keeps a lamp going a little, if you eat it out there. Do not ask me how. Bread is mysterious."', options: [{ text: 'Thanks, Hollis.', to: 'start' }, BYE] },
  partner_hollis: { text: '"Partner! Then you get the good shelf: lily oil and moon candles, at the price I pay myself. Nearly." He polishes the bar where you are leaning. "The roof thanks you. So do the buckets."', options: [BYE] },
  beds: { text: `${INN.price} gold a night, behind the curtain at the back. Sleep there and you wake up with a full lamp and a clear head. For the next ${INN.rested} fights you will learn ${Math.round(INN.bonus * 100)}% more from them. Tired people learn nothing, rested people learn everything.`, options: [{ text: 'Good to know.', to: 'start' }, BYE] },
  chests: { text: 'One for every regular. Leave what you do not want to carry, take it back when you need it. Any chest opens to your own things. I stopped asking why. So should you.', options: [{ text: 'Thanks.', to: 'start' }, BYE] },
  rumour: { text: 'Woodcutters come in at night talking about a glow up north. Mothwick says it is a hearth that nobody feeds. Tallow has been in here twice this week, and Tallow does not drink. Something is going on.', options: [{ text: 'Anything else?', to: 'rumour2' }, { text: 'Interesting.', to: 'start' }, BYE] },
  rumour3: { text: 'There is a woman in the old moneylender\'s house counting everybody\'s coins, and Marrow has started saying "partner" like it is a swear word. And the woodcutters say they saw lamps walking along the north edge, in a line, with nobody they knew under them.', options: [{ text: 'Anything newer?', to: 'rumour4' }, { text: 'Interesting.', to: 'start' }, BYE] },
  rumour4: { text: 'Rook came in for a pint and said "hm" about the roof. Rook, indoors, on purpose. A miner from Cinderford called Flint sold Marrow a cart of brass and they argued for an hour about who robbed whom. And Fen has drawn chalk shadows all round the Beacon. Fen says one of them is missing. Fen says a lot of things.', options: [{ text: 'And?', to: 'rumour5' }, { text: 'Interesting.', to: 'start' }, BYE] },
  rumour5: { text: 'Somebody has been leaving little bags of flour on doorsteps, grey and smoky, and the old mill by the stream turns all night with nobody in it. And Hesk from Cinderford says the water under his stall is "talking". Hesk never says anything is talking.', options: [{ text: 'Interesting.', to: 'start' }, BYE] },
  rumour2: { text: 'Brindle came down for stew and would not stop writing in her little book. Marrow is buying up every drop of oil in Kindle. And Brack swears the Old Foreman tipped his helmet at him once. Brack also swears at beetles, so.', options: [{ text: 'And?', to: 'rumour3' }, { text: 'Interesting.', to: 'start' }, BYE] },
};

const band_corra = {
  start: {
    text: 'Corra puts down her fiddle. "Requests cost one ale. Complaints cost two."',
    options: [
      { text: 'Who are you lot?', to: 'who' }, { text: 'What is that tune?', to: 'tune' },
      // Seit 2026-11-13: der alte Weg ist zurück, Corra kennt das Dorf an seinem Ende
      { text: 'The old road is back, they say.', to: 'road', if: { quest: { old_road_west: 'none' } }, do: [{ start: 'old_road_west' }] },
      { text: 'Tell me about Cinderford.', to: 'cinder', if: { quest: { old_road_west: 'done' } } },
      BYE,
    ],
  },
  who: { text: '"We are the Damp Socks. Me on fiddle, Oswin on drum, Pip on the pipe. We played every village on the old road until the Grey ate the road. Now we play here, and the Beacon claps."', options: [BYE] },
  tune: { text: '"The Lark\'s Jig. Hollis\'s grandmother wrote it. Or stole it. In Kindle that is the same thing."', options: [BYE] },
  road: { text: 'Corra goes very still. "The west road? Back?" She grins. "Then Cinderford is still at the end of it. A town in a quarry, under the hill, full of people who go down into a maze for fun. Go and see. Ask for Sorrel, the Delvemaster. Tell her I still owe her a song."', options: [{ text: 'West, to Cinderford.' }] },
  cinder: { text: '"They live under the hill, where the Grey cannot get a good grip. They dug for stone and found a maze that rebuilds itself every night. They think that is normal. They are lovely people. Never play cards with them."', options: [BYE] },
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
  song: { text: '"A song about the light in the north. I have two lines now! \'There is a light in the north, and Brindle is watching it.\' The rest depends on what it is. And on what rhymes with Brindle."', options: [{ text: 'Any new lines?', to: 'song2' }, BYE] },
  song2: { text: '"Two more! \'Lamps walk by in the dark, three where there used to be five. And one by the fire throws no shadow at all.\' Corra says it is too sad for a jig. I say it is a slow jig." Pip plays it. It is quite sad.', options: [BYE] },
};

// ---------- Cinderford (seit 2026-11-13, Gebet 4) ----------
// Sorrel schickt einen an Einstiegs-Stockwerke: das erste, und jedes nach einem großen Keeper (6, 11, 16, …),
// das man schon erreicht hat. Sichtbar sind nur die drei tiefsten, damit die Liste kurz bleibt.
const ORDINAL = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
const DESCENT = [{ text: 'The first turn.', do: [{ descend: 1 }] }];
for (let f = 6; f <= 96; f += 5) DESCENT.push({ text: `The ${ORDINAL(f)} turn.`, if: { maze: f, mazeBelow: f + 15 }, do: [{ descend: f }] });

const sorrel = {
  start: {
    text: 'Sorrel taps a long brass key against her palm. "Delvemaster. I count who goes down and who comes back up. The second number is the important one."',
    options: [
      { text: 'Corra sent me, from Kindle.', to: 'orw_done', if: { quest: { old_road_west: 0 } }, do: [{ advance: 'old_road_west' }] },
      { text: 'What is down there?', to: 'maze' },
      { text: 'Send me down.', to: 'down' },
      { text: 'Any work for me?', to: 'ft_offer', if: { quest: { first_turn: 'none' }, classLevel: 5 }, do: [{ start: 'first_turn' }] },
      { text: 'Any work for me?', to: 'ft_early', if: { quest: { first_turn: 'none' }, below: 5 } },
      { text: 'The Keeper fell.', to: 'ft_done', if: { quest: { first_turn: 1 } }, do: [{ advance: 'first_turn' }] },
      { text: 'Any more work?', to: 'ds_offer', if: { quest: { first_turn: 'done', deeper_still: 'none' }, classLevel: 12 }, do: [{ start: 'deeper_still' }] },
      { text: 'Any more work?', to: 'ds_early', if: { quest: { first_turn: 'done', deeper_still: 'none' }, below: 12 } },
      { text: 'The great Keeper fell.', to: 'ds_done', if: { quest: { deeper_still: 1 } }, do: [{ advance: 'deeper_still' }] },
      { text: 'What is the lamp under the hill?', to: 'lh_sorrel', if: { quest: { lamp_under_the_hill: 0 } }, do: [{ advance: 'lamp_under_the_hill' }] },
      { text: 'Do you count the Sumps too?', to: 'so_sumps', if: { quest: { the_drains: 'active' } } },
      BYE,
    ],
  },
  orw_done: { text: '"Corra? With the fiddle? She owes me a song." Sorrel looks you up and down. "Welcome to Cinderford, Kindle. We thought the Grey had eaten you all. Turns out it only ate the road."', options: [{ text: 'What is this place?', to: 'maze' }, BYE] },
  maze: { text: '"The Unending Maze. The quarrymen cut into it two hundred years ago looking for good stone, and found corridors instead. Every night the walls turn, and every morning it is a different maze. At the bottom of every turn sits a Keeper, guarding the stairs down. Nobody has found the last stair."', options: [{ text: 'Why go down at all?', to: 'why' }, BYE] },
  why: { text: '"Turnstones. Every Keeper carries a few, and Hesk turns them into the best gear this side of the Grey. And the stairs only open for those who stood against the Keeper. Some of us like to see how far they go." She shrugs. "Mostly the turnstones."', options: [BYE] },
  down: { text: '"Where to? The first turn, or any turn just past a great Keeper you stood against. Every fifth Keeper is a great one. Take oil. The Maze is dark, and the Lost Lamps are thirsty."', options: [...DESCENT, { text: 'Not yet.' }] },
  so_sumps: { text: '"The Sumps are Hesk\'s." She does not stop tapping. "The Maze moves and the Sumps do not, so I count the Maze and Hesk counts rats. Fair division." A pause. "Tell him I am counting him, though. Down the grate and back up. The second number is the important one."', options: [BYE] },
  lh_sorrel: { text: 'Sorrel stops tapping her key. "The quarrymen did not have a chapel. They had niches. Before every shift you lit one, and you said it: light one for the lamp under the hill, and it will light one for you." She looks down the Maze Mouth. "They believed there was a light somewhere under all this rock that kept the Grey out of Cinderford. Not a fire. A lamp, held by somebody. My mother said it was nonsense. My mother also lit a niche every morning." She goes back to tapping. "The crawlers drink the oil. Start there."', options: [{ text: 'Thank you, Sorrel.' }] },
  ft_offer: { text: '"Good. Down the Maze Mouth, find your way to the bottom of the first turn, and stand against its Keeper. It will be something strange. It always is. Come back and tell me what it was."', options: [{ text: 'Down I go.' }] },
  ft_early: { text: '"Not yet. Even the first turn has teeth. Get some experience in the fields around Kindle and come back. (Level 5)"', options: [BYE] },
  ft_done: { text: '"Hah. They never look the same twice." She chalks a mark on the Turn Board. "The stairs will open for you now. Here: turnstones and cake. Hesk will tell you what the stones are worth."', options: [{ text: 'Thanks, Sorrel.' }] },
  ds_offer: { text: '"Every fifth turn the Keeper is a great one: bigger, angrier and stranger. Get down to the fifth turn and bring its great Keeper down. Take friends. I mean it."', options: [{ text: 'The fifth turn.' }] },
  ds_early: { text: '"You did the first turn. Good. The fifth one would eat you. Come back with a few more levels. (Level 12)"', options: [BYE] },
  ds_done: { text: 'Sorrel writes your name on the Turn Board, low down, in small letters. "A great Keeper. Not bad, Kindle." She hands you a pouch. "From now on I can send you straight down to the sixth turn. Go and see how far it goes."', options: [{ text: 'Thanks, Sorrel.' }] },
};

// Tag 4 (Gebet 7): Flint, der Bergmann in Cinderford. Verkauft Schrott, Messing und Glimmer; Teilhaber zahlen weniger
// (discount in content/ventures.js) und bekommen Cinder Iron. Quests „A Share of the Cart“ und „The Deep Seam“.
const flint = {
  start: {
    text: 'A short, broad miner with a candle on his helmet leans on an ore cart. "Flint. I dig. Scrap, brass, glimmer, whatever the hill coughs up. Want some?"',
    options: [
      { text: 'Show me what you dug.', do: [{ shop: 'flint' }] },
      { text: 'Why so expensive?', to: 'fp_offer', if: { quest: { flints_partner: 'none' } }, do: [{ start: 'flints_partner' }] },
      { text: 'You have a partner now. Me.', to: 'fp_done', if: { quest: { flints_partner: 0 }, partner: 'flint' }, do: [{ advance: 'flints_partner' }, { advance: 'flints_partner' }] },
      { text: 'You have a partner now. Me.', to: 'fp_done', if: { quest: { flints_partner: 1 } }, do: [{ advance: 'flints_partner' }] },
      { text: 'Partner prices, please.', to: 'partner_flint', if: { partner: 'flint' } },
      { text: 'Your cart wobbles.', to: 'tw_offer', if: { quest: { three_wheels: 'none' }, classLevel: 4 }, do: [{ start: 'three_wheels' }] },
      { text: 'A fourth wheel, from Rook.', to: 'tw_done', if: { quest: { three_wheels: 2 }, has: { cart_wheel: 1 } }, do: [{ take: { cart_wheel: 1 } }, { advance: 'three_wheels' }] },
      { text: 'Where does the good iron come from?', to: 'ds_offer', if: { quest: { deep_seam: 'none' }, classLevel: 36 }, do: [{ start: 'deep_seam' }] },
      { text: 'Where does the good iron come from?', to: 'ds_early', if: { quest: { deep_seam: 'none' }, below: 36 } },
      { text: 'Two bars, from the lurkers.', to: 'ds_done', if: { quest: { deep_seam: 3 }, has: { cinder_iron: 2 } }, do: [{ take: { cinder_iron: 2 } }, { advance: 'deep_seam' }] },
      { text: 'What is cinder iron?', to: 'iron' },
      { text: 'Where does the ford go?', to: 'fl_sumps' },
      BYE,
    ],
  },
  tw_offer: { text: '"Wobbles? It has three wheels. It is a miracle it rolls at all." He pats it fondly. "There is an old man in Kindle who makes wheels out of scrap and bad temper. Rook. Bring him five scrap and say it is for Flint. He owes me for a crate of brass. He will say he does not."', options: [{ text: 'A wheel from Rook.' }] },
  tw_done: { text: 'Flint fits the wheel, kicks the cart, and nothing wobbles. He looks almost disappointed. "Four wheels. I will have to find something else to kick." He presses brass and bread on you. "Tell Rook we are square. He will say we are not."', options: [{ text: 'Thanks, Flint.' }] },
  fp_offer: { text: '"Because I carry every crumb of it up a hundred steps on my own back, and my cart has three wheels." He kicks it. It wobbles. "Coyne up in Kindle sells shares in carts like mine. Buy one in mine, and I knock a tenth off everything for you. Three shares, three tenths. And partners get the good iron from the bottom of the cart."', options: [{ text: 'A share in your cart.' }] },
  fp_done: { text: '"Coyne wrote it down? Then it is true." He shakes your hand with a hand like a shovel. "Partner prices from now on. And here, the first bar of cinder iron is a gift. Rook in Kindle would kill for it. Do not let him."', options: [{ text: 'Thanks, Flint.' }] },
  partner_flint: { text: '"Partner." He pulls a sack of black bars out from under the scrap. "Cinder iron, and everything else a tenth cheaper for every share you hold. Do not tell Hesk. He thinks he is my favourite."', options: [{ text: 'Show me what you dug.', do: [{ shop: 'flint' }] }, BYE] },
  iron: { text: '"Black iron from under the hill. It rings when you drop it and it does not bend unless you mean it. The quarrymen used to dig a seam of it that ran all the way east, under the Grey, to the copper mines. Then something started eating it."', options: [BYE] },
  fl_sumps: { text: '"Under the east wall, into the old sumps. Hesk sends people down there now, with a lot of lamps." He pats his cart. "I stay up here. Carts do not float, and neither do I."', options: [BYE] },
  ds_offer: { text: '"East. The seam runs under the Grey all the way to Copperdeep, past the old shaft where nobody digs. And something down there eats it: flat things, like rocks that got hungry. I hear them chewing through the wall at night." He shudders. "Clear four of them. Ask Brack what he knows; he is the foreman over there. And bring me two bars back from their bellies, so I know I am not mad."', options: [{ text: 'Four lurkers, two bars.' }] },
  ds_early: { text: '"Under the Grey, east, where things eat iron. Not you, not yet. Come back with a lot more behind you. (Level 36)"', options: [BYE] },
  ds_done: { text: 'He holds a bar up to his candle. "Half chewed. They eat the best of it, of course they do." He grins anyway. "Four fewer of them, and the seam is singing again. Brack will say I am making it up. Brack can come and listen." He hands you cakes and salves. "Down here we pay in food. Food does not get stolen by Keepers."', options: [{ text: 'Thanks, Flint.' }] },
};

const GEAR = [['delvers_hood', 4, 'Hood'], ['delvers_boots', 6, 'Boots'], ['delvers_coat', 10, 'Coat'], ['keepers_lantern', 25, 'Keeper\'s Lantern']];
const hesk = {
  start: {
    text: 'Hesk is counting rope. "Oil, chalk, cake, rope. And gear, for turnstones. Gold is for people who stay upstairs."',
    options: [
      { text: 'Show me your wares.', do: [{ shop: 'hesk' }] },
      { text: 'What do turnstones buy?', to: 'gear' },
      { text: 'What are turnstones?', to: 'stones' },
      { text: 'Coyne sent this ledger.', to: 'cl_hesk', if: { quest: { cinderford_ledger: 0 }, has: { sealed_ledger: 1 } }, do: [{ take: { sealed_ledger: 1 } }, { advance: 'cinderford_ledger' }] },
      { text: 'Five sticks of turn chalk.', to: 'cl_chalk', if: { quest: { cinderford_ledger: 2 }, has: { turn_chalk: 5 } }, do: [{ take: { turn_chalk: 5 } }, { advance: 'cinderford_ledger' }] },
      { text: 'Coyne says I own a bit of your stall.', to: 'partner_hesk', if: { partner: 'hesk' } },
      { text: 'Where does the ford go?', to: 'dr_offer', if: { quest: { the_drains: 'none' }, classLevel: 38 }, do: [{ start: 'the_drains' }] },
      { text: 'Where does the ford go?', to: 'dr_early', if: { quest: { the_drains: 'none' }, below: 38 } },
      { text: 'The water runs again.', to: 'dr_done', if: { quest: { the_drains: 3 } }, do: [{ take: { sluice_handle: 1 } }, { advance: 'the_drains' }] },
      { text: 'What is verdigris good for?', to: 'verdigris', if: { has: { verdigris: 1 } } },
      { text: 'What is in the old locker under your stall?', to: 'gl_offer', if: { quest: { the_drains: 'done', grans_locker: 'none' } }, do: [{ start: 'grans_locker' }] },
      { text: 'Let me try Gran\'s dials.', to: 'gl_1', if: { quest: { grans_locker: 0 } } },
      { text: 'Light one for the lamp under the hill?', to: 'lh_offer', if: { quest: { the_drains: 'done', lamp_under_the_hill: 'none' } }, do: [{ start: 'lamp_under_the_hill' }] },
      { text: 'The chapel has an answer, of sorts.', to: 'lh_done', if: { quest: { lamp_under_the_hill: 3 } }, do: [{ advance: 'lamp_under_the_hill' }] },
      BYE,
    ],
  },
  cl_hesk: { text: 'He breaks the seal, reads one page and groans. "She is right. She is always right. It is very annoying." He tucks the ledger under the rope. "I will send it back corrected. Postage is five sticks of turn chalk: the Maze is full of it, and I am out. Go on, down you go."', options: [{ text: 'Five sticks.' }] },
  cl_chalk: { text: 'He weighs the chalk in his hand and scribbles a note in the margin of his own book, in a second, worse handwriting. "Tell Coyne the sums are fixed. Tell her the rope is still mine."', options: [{ text: 'I will.' }] },
  partner_hesk: { text: '"Coyne. Her cousin keeps my books, and he is worse." He sighs and lifts a crate from under the stall. "Partners get chalk and lily oil off the bottom shelf. The rope stays mine."', options: [{ text: 'Show me your wares.', do: [{ shop: 'hesk' }] }, BYE] },
  dr_offer: { text: '"Down. Under the east wall, through the sumps the quarrymen cut, to a weir where the water used to fall into the Grey. Now it does not fall. It backs up, and the rats come up with it, bigger every week." He pushes a coil of rope at you. "Clear the rats. Find the sluice handle the old keepers left in their niche. Then see what is sitting in the weir. Take lamps. Take more lamps than that."', options: [{ text: 'Down the grate, then.' }] },
  dr_early: { text: '"Into the dark under the east wall, where the rats are the size of dogs and the water bites. Not for you yet. (Level 38)"', options: [BYE] },
  dr_done: { text: 'Hesk holds up a hand. Under the floor, faintly, water is running. "Hear that? The ford is talking again." He hangs the sluice handle on a hook over his stall, next to the rope. "\'Light one for the lamp under the hill.\' My gran said that every time she went down. I thought it was a rhyme." He pays you in gold, not stones, which for Hesk is a speech.', options: [{ text: 'Glad to help.' }] },
  gl_offer: { text: '"Gran\'s locker." He nudges a dented iron box under the stall with his boot. "She kept the sluice for forty years. Three number dials. She said the answer was on the slate, and then she laughed, and then she never told anybody which slate." He shrugs. "The keepers had one by the ladder, down there. If you are going down anyway."', options: [{ text: 'I will read the slate.' }] },
  gl_1: { text: 'Three brass dials on a dented iron locker, each numbered 1 to 15. The first one is stiff.', options: [{ text: 'Turn it to 4.', to: 'gl_2' }, { text: 'Turn it to 7.', to: 'gl_wrong1' }, { text: 'Turn it to 9.', to: 'gl_wrong1' }, { text: 'Turn it to 12.', to: 'gl_wrong1' }, { text: 'Turn it to 13.', to: 'gl_wrong1' }, { text: 'Leave it.' }] },
  gl_2: { text: 'The first dial clicks into place. The second one turns easily.', options: [{ text: 'Turn it to 4.', to: 'gl_wrong2' }, { text: 'Turn it to 7.', to: 'gl_wrong2' }, { text: 'Turn it to 9.', to: 'gl_3' }, { text: 'Turn it to 12.', to: 'gl_wrong2' }, { text: 'Turn it to 13.', to: 'gl_wrong2' }, { text: 'Leave it.' }] },
  gl_3: { text: 'The second dial clicks into place. The third one is stiff with old chalk dust.', options: [{ text: 'Turn it to 4.', to: 'gl_stuck' }, { text: 'Turn it to 7.', to: 'gl_stuck' }, { text: 'Turn it to 9.', to: 'gl_stuck' }, { text: 'Turn it to 12.', to: 'gl_stuck' }, { text: 'Turn it to 13.', to: 'gl_done', do: [{ advance: 'grans_locker' }] }, { text: 'Leave it.' }] },
  gl_wrong1: { text: 'The first dial clicks into place. The second one turns easily.', options: [{ text: 'Turn it to 4.', to: 'gl_wrong2' }, { text: 'Turn it to 7.', to: 'gl_wrong2' }, { text: 'Turn it to 9.', to: 'gl_wrong2' }, { text: 'Turn it to 12.', to: 'gl_wrong2' }, { text: 'Turn it to 13.', to: 'gl_wrong2' }, { text: 'Leave it.' }] },
  gl_wrong2: { text: 'The second dial clicks into place. The third one is stiff with old chalk dust.', options: [{ text: 'Turn it to 4.', to: 'gl_stuck' }, { text: 'Turn it to 7.', to: 'gl_stuck' }, { text: 'Turn it to 9.', to: 'gl_stuck' }, { text: 'Turn it to 12.', to: 'gl_stuck' }, { text: 'Turn it to 13.', to: 'gl_stuck' }, { text: 'Leave it.' }] },
  gl_stuck: { text: 'The last dial clicks. Nothing happens. The locker sits there being a locker. Hesk pretends not to have watched.', options: [{ text: 'Try again.', to: 'gl_1' }, { text: 'Leave it.' }] },
  gl_done: { text: 'The third dial clicks, and the lid springs up with a puff of chalk. Inside, wrapped in oilskin: a green brass lamp with thick glass, and a note in a big round hand: "For whoever reads slates." Hesk reads it twice. "Four, nine, thirteen. The last three days she kept the sluice." He pushes the lamp at you. "She would want it to go back down. Take it."', options: [{ text: 'Thank you, Hesk.' }] },
  lh_offer: { text: '"My gran said it every time she went down. I thought it was a rhyme, like mind the step." He turns the sluice handle on its hook. "But somebody carved it over a niche and kept the lamps burning for a hundred years. That is not a rhyme. That is a prayer." He looks at you sideways. "Sorrel is old enough to know. And the crawlers keep drinking the niche lamps dry. Somebody should mind them."', options: [{ text: 'I will ask Sorrel.' }] },
  lh_done: { text: 'Hesk listens with his hands flat on the stall. "Same light, different door." He says it twice, as if trying it on. Then he takes a stub of candle from the shelf and lights it, for no reason he will admit to. "Here. The keepers\' draught, from my gran\'s recipe. Light one for the lamp under the hill. And mind the step."', options: [{ text: 'Mind the step, Hesk.' }] },
  verdigris: { text: '"Brass that sat in the wet and thought about it. Keeps the damp out of anything." He taps his own boots. "Rook in Kindle could hammer it into iron. Sumpwalker gear, the keepers called it. Boots, hood, coat."', options: [BYE] },
  stones: { text: '"Little stones the Keepers carry. Warm on one side. The warm side always faces the way out, wherever you are. Delvers sew them into their coats so they never get lost." He taps his chest. "I have nine."', options: [{ text: 'And you trade gear for them?', to: 'gear' }, BYE] },
  gear: {
    text: '"Hood, four stones. Boots, six. Coat, ten. And if you ever bring me twenty-five, the Keeper\'s Lantern. I only made one. I will make another."',
    options: [
      ...GEAR.map(([id, n, name]) => ({ text: `The ${name}, for ${n} turnstones.`, to: 'bought', if: { has: { turnstone: n } }, do: [{ take: { turnstone: n } }, { give: { [id]: 1 } }] })),
      { text: 'Not yet.' },
    ],
  },
  bought: { text: 'He drops the stones into a jar one at a time, listening to each. "Good stones. Wear it well, and come back up in it."', options: [{ text: 'What else?', to: 'gear' }, BYE] },
};

const ivy = {
  start: {
    text: 'Old Ivy does not look up from her maps. "Wrong. Wrong. Also wrong. Oh. Hello."',
    options: [
      { text: 'Can I help?', to: 'cs_offer', if: { quest: { chalk_and_string: 'none' }, classLevel: 6 }, do: [{ start: 'chalk_and_string' }] },
      { text: 'Can I help?', to: 'cs_early', if: { quest: { chalk_and_string: 'none' }, below: 6 } },
      { text: 'Five sticks of turn chalk.', to: 'cs_done', if: { quest: { chalk_and_string: 1 }, has: { turn_chalk: 5 } }, do: [{ take: { turn_chalk: 5 } }, { advance: 'chalk_and_string' }] },
      { text: 'A letter from Kindle. From your son, I think.', to: 'ul_ivy', if: { quest: { unsent_letter: 2 }, has: { unsent_letter: 1 } }, do: [{ take: { unsent_letter: 1 } }, { advance: 'unsent_letter' }] },
      { text: 'Anything to send back to Mabb?', to: 'ir_offer', if: { quest: { unsent_letter: 'done', ivys_reply: 'none' } }, do: [{ start: 'ivys_reply' }, { give: { ivys_map: 1 } }] },
      { text: 'Why map it, if it changes?', to: 'why' },
      { text: 'The Sumps under the town do not move.', to: 'iv_sumps', if: { quest: { the_drains: 'done' } } },
      BYE,
    ],
  },
  ir_offer: { text: 'Ivy rolls up a sheet she has clearly been working on all night. "A map of Kindle. From memory. Kindle does not move, so for once it is right." She ties it with string. "Give it to Mabb. Tell him it is the only map I ever drew that is right in the evening, and it is of the place he lives. He will understand. Or he will cry. Either is fine."', options: [{ text: 'I will take it.' }] },
  ul_ivy: { text: 'Ivy puts down her pen for the first time since you met her. She reads the letter twice. "Mabb. The road closed and he wrote anyway." She smooths it flat on today\'s map, right over the Maze. "Tell him the maps are still wrong by evening. Tell him I am glad. And tell him to bring the snail in the hat. I have heard about that hat." She presses a parcel of cinder cakes on you for him.', options: [{ text: 'I will tell him.' }] },
  iv_sumps: { text: 'Ivy puts her pen down very slowly. "They do not move?" She pulls a clean sheet toward her. "Fifty years of maps that are wrong by evening, and under my own floor there were tunnels that just stay put." She is already drawing: a ladder, a long channel, a round cistern. "I am going to draw a map that is right tomorrow. And the day after. I may cry. Go away."', options: [BYE] },
  why: { text: '"Because it does not change all of it. The rooms move, the walls turn, but some things stay: Keepers at the bottom, the rope at the top. One day I will find the rule." She taps a map. "Fifty years now. Any day."', options: [BYE] },
  cs_offer: { text: '"I need chalk. Not any chalk: turn chalk, the stuff the things down there carry around. It holds a mark in the Maze until morning, which is longer than mine does. Five sticks. The Turnlings drop it, and the Crawlers, and the Lamps."', options: [{ text: 'Five sticks of turn chalk.' }] },
  cs_early: { text: '"Help? You would get lost on the stairs. Come back with a bit more experience. (Level 6)"', options: [BYE] },
  cs_done: { text: 'She snaps a stick and draws a long line on today\'s map. It does not fade. "Ha! There. Here: my old lamp. It was made for corners. It does not light far, but it lights round them."', options: [{ text: 'Thank you, Ivy.' }] },
};

// Tag 5 (Bogen „The Second Light“): Wenna, eine Trägerin aus dem Norden, hat sich im Grey verirrt und schläft
// tagsüber in der Old Mill. Nachts mahlt sie dort ihr letztes Korn. Quest „The Last Sack“.
const wenna = {
  start: {
    text: 'A thin woman in a peat-brown coat, sitting on a half-empty sack by the millstones.',
    options: [
      { text: 'Hello?', to: 'w_day', if: { day: true } },
      { text: 'You are the one who grinds at night.', to: 'w_offer', if: { night: true, quest: { who_grinds: 'done', the_last_sack: 'none' } }, do: [{ start: 'the_last_sack' }] },
      { text: 'Who are you?', to: 'w_shy', if: { night: true, quest: { the_last_sack: 'none' } } },
      { text: 'Bread, from this mill\'s own flour.', to: 'w_bread', if: { night: true, quest: { the_last_sack: 1 }, has: { millbread: 2 } }, do: [{ take: { millbread: 2 } }, { advance: 'the_last_sack' }, { give: { wennas_lantern: 1 } }] },
      { text: 'Your lantern, lit. And an answer from the chapel.', to: 'w_done', if: { night: true, quest: { the_last_sack: 4 }, has: { wennas_lantern: 1 } }, do: [{ take: { wennas_lantern: 1 } }, { advance: 'the_last_sack' }] },
      { text: 'Where will you go?', to: 'w_after', if: { night: true, quest: { the_last_sack: 'done' } } },
      { text: 'Could you bake with this barley?', to: 'w_bake', if: { night: true, quest: { the_last_sack: 'done' }, has: { barley: 3 } }, do: [{ take: { barley: 3 } }, { give: { hollow_ration: 1 } }] },
      { text: 'Brindle asks how many of you set out.', to: 'w_count', if: { night: true, quest: { the_last_sack: 'active' } } },
      { text: 'Where are you from?', to: 'w_from', if: { night: true } },
      BYE,
    ],
  },
  w_count: { text: 'Wenna counts on her fingers, the way the tally stick counts in notches. "Forty, when my mother carried. Twenty, when I started. This time, five." She looks at her lantern. "We do not send fewer because fewer are needed. We send fewer because fewer can walk." She puts her hands back in her lap. "Tell your watcher she counted right."', options: [BYE] },
  w_day: { text: 'Under a heap of empty sacks by the millstones, somebody is asleep: a woman in a peat-brown coat, boots worn through, a cold green lantern hugged to her chest. She does not wake. Better come back after dark.', options: [BYE] },
  w_shy: { text: '"Nobody." She steps back into the shadow of the wheel, one hand on the sack. "A carrier. I lost the others in the trees. I will be gone before your sun is." She does not move to go.', options: [BYE] },
  w_offer: { text: 'She sits down on the sack as if her legs decided for her. "Wenna. I carry, for home, up north." She looks at the stones. "The others went on. I got lost, and found this place still turning, as if somebody kept it for us. That barley is the last we had. I grind it so it weighs less, and leave what I cannot carry on your doorsteps." Her hands are shaking. "I have not eaten since the trees. My lamp went out three nights ago. In the Grey, that is a long time."', options: [{ text: 'I will bring you something warm.' }] },
  w_bread: { text: 'She eats the first loaf without a word and holds the second in her lap like something alive. "Your bread tastes of sun. Ours tastes of smoke." Then she pushes her lantern into your hands. "Your fire, the big one in the middle of the village. Would it light ours? We were told it might. We were told you used to." She hesitates. "And on the way, we left a prayer in the box at your chapel. Did anybody read it?"', options: [{ text: 'I will fill it at the Beacon, and ask.' }] },
  w_done: { text: 'She holds the lantern up. Green light spills over the millstones, and for the first time she smiles. "It took. It took from your fire." When you tell her what Tallow said, she closes her eyes. "Read. Every morning. Under a stone." She presses a bundle of brown bread on you, and a twist of green grit. "Peat-smoked, the way we bake it. And glass, ground on these stones: this mill ground glass for us once, before the road closed. Your lampwright will know what to do with it. When my feet let me, I will walk north and tell them your fire is still lit, and still kind." At the door she turns. "Tell your Warden that ours is going hungry. She will know what that means."', options: [{ text: 'Keep your wick trimmed, Wenna.' }] },
  w_bake: { text: 'Wenna grinds the barley on the old stones, wets it, and bakes it flat on a hot tile over the mill lamp, with a pinch of peat from her pocket. It comes out brown and smoky and wrapped in birch bark. "The way we do it at home. Three handfuls of yours for one of ours. Fair, your Marrow would say. He would be wrong, but he would say it."', options: [{ text: 'Thank you, Wenna.' }] },
  w_after: { text: '"North, when my feet let me. Along the stones that point, the old way." She taps the green glass. "This will last me. Your fire burns long." She does not say when.', options: [BYE] },
  w_from: { text: '"North. Past the trees, past the stones that point. There is a light there, and it is ours, and it is hungry." She will not say more than that.', options: [BYE] },
};

export const TALK = {
  ama, tallow, rook, fen, wren, stranger, haskel, brack, brindle, mabb, mothwick, hollis, band_corra, band_oswin, band_pip,
  sorrel, hesk, ivy, coyne, tansy, flint, wenna,
  snail_bramble: snail('bramble'), snail_pebble: snail('pebble'), snail_tom: snail('tom'),
  snail_duchess: snail('duchess'), snail_thistle: snail('thistle'),
  pell: {
    start: { text: 'HEAR YE! The OLD MILL by the stream turns again, and anybody may grind there! Under Cinderford, Hesk wants the old drains cleared, and something lives in the weir! Rook says the green crust from down there makes iron better than masterwork! Wardens and Menders learned to heal while they hit! And Marrow wants to know who leaves flour on our doorsteps!', options: [
      { text: 'Whose hand is this?', to: 'po_pell', if: { quest: { prayer_not_ours: 1 }, has: { prayer_slip: 1 } }, do: [{ advance: 'prayer_not_ours' }] },
      { text: 'Anything I can help with?', to: 'ul_offer', if: { quest: { kindling: 'done', unsent_letter: 'none' } }, do: [{ start: 'unsent_letter' }] },
      { text: 'Anything else?', to: 'more' }, BYE] },
    ul_offer: { text: '"Help? Me? Well." He lowers his bell. "There is a letter on the table in Abel\'s old house, by the campfire. Half a letter. I read every notice and every scrap in Kindle, but a letter to somebody\'s mother, no. Even I have rules. One rule. Find out whose it is and get it where it is going. Unsigned letters keep me up at night."', options: [{ text: 'I will find out.' }] },
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
        { text: 'I am a partner now. Coyne sold me a share.', to: 'partner_news', if: { quest: { stake_in_kindle: 1 } }, do: [{ advance: 'stake_in_kindle' }] },
        { text: 'About the goods under the counter...', to: 'partner_marrow', if: { partner: 'marrow' } },
        { text: 'Flour on doorsteps?', to: 'wg_offer', if: { quest: { kindling: 'done', who_grinds: 'none' } }, do: [{ start: 'who_grinds' }] },
        { text: 'This was in the mill hopper.', to: 'wg_done', if: { quest: { who_grinds: 4 }, has: { hollow_barley: 1 } }, do: [{ take: { hollow_barley: 1 } }, { advance: 'who_grinds' }] },
        { text: 'Bulbs, and fewer toads.', to: 'oil_done', if: { quest: { oil_rush: 2 }, has: { lily_bulb: 3 } }, do: [{ take: { lily_bulb: 3 } }, { advance: 'oil_rush' }] },
        BYE,
      ],
    },
    wg_offer: { text: '"Flour. On doorsteps. Free." He says free like other people say rats. "Somebody is giving flour away in my village, and the old mill by the stream is turning again. Nobody has milled there since the miller left. Take some barley down there and see if the stones still work. Crows steal it from the fields, or I sell it, at a fair price. Fair to me."', options: [{ text: 'I will look into it.' }] },
    wg_done: { text: 'He tips the grains into his palm and sniffs. "Grey barley. Peat-smoked. Not ours, and not from anywhere I buy." He looks out toward the stream. "Somebody comes in the dark, grinds this, and leaves the flour on our doorsteps. That is either a very bad thief or a very good neighbour." He pays you anyway. "If you meet them, tell them I buy barley. Tell them not at that price."', options: [{ text: 'I will.' }] },
    partner_marrow: { text: '"Partner." He lifts a sack off the crate under the counter: moss salves and glow draughts. "At the honest price, which is still my price." He shakes your hand. Twice, to be sure.', options: [{ text: 'Show me your wares.', do: [{ shop: 'marrow' }] }, BYE] },
    partner_news: { text: '"A partner." He says it the way other people say "a toothache". Then he grins. "Fine. Good. Coyne has been talking about roofs all week, and now somebody is paying for them. If it is my stall, partners get the salves and draughts I keep under the counter. If it is not my stall, I will be sulking. Here. It is bread. It is not a bribe. It is a bit of a bribe."', options: [BYE] },
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
  strongbox: 'An iron box with three brass dials.',
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
