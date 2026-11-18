// Rufe: Figuren sagen von selbst etwas, als Sprechblase über dem Kopf (nur im Browser, ohne Server).
// Bewusst sparsam, damit es nicht nervt:
// - Der Crier ruft regelmäßig (das ist sein Beruf). news: zuerst die letzte Nacht und das Leuchtfeuer.
// - Wer eine Quest für dich hat ("!"), ruft einmal, wenn du vorbeigehst (hail), dann lange Ruhe.
// range: Felder. every: Sekunden zwischen zwei Rufen (ungefähr). Der Nightwright kann Zeilen ergänzen.
// dayLines (Tag 5): andere Zeilen bei Tag (sonst gelten lines immer).

export const BARKS = {
  pell: {
    range: 14, every: 25, news: true, shout: true,
    lines: [
      'HEAR YE! Feed the Beacon before midnight!',
      'Bread for the north! The box is under the first stone! Brindle is counting!',
      'The Stranger has a SHADOW! Fen has drawn it! It points NORTH!',
      'The Old Mill turns again! Barley in, flour out! No miller required!',
      'Rats under Cinderford! Hesk pays for fewer!',
      'Flour on the doorsteps again! Marrow demands to know who! Marrow is not grateful!',
      'Fen\'s new scarecrow has a face like Old Rook! The crows agree!',
      'Favours on the notice board! Gold for honest work!',
      'Pray at the chapel, and the world may answer!',
      'The Night Market opens at dusk! Bring gold, and a lantern!',
      'Snail races by the west path! Mabb takes bets!',
      'The Lantern & Lark is open! Beds, stew and the Damp Socks!',
      'A lookout stands at the top of the north road! Brindle is watching!',
      'Wolves on the north-west fields! Warden Ama wants them sent home!',
      'Something new at the Night Market every night! Only after dark!',
      'Brack says the Old Foreman is still working! Somebody tell him!',
      'The old road west is back! Cinderford is at the end of it, and a maze under it!',
      'The Counting House is open! Coyne sells shares in Kindle! Your gold, working for you!',
      'The Snail Cup is here! Two new snails! Cup Day every weekend!',
      'Lights on the north edge at night! Brindle wants to know who is carrying them!',
      'Rook\'s workshop doubled in size! He still works in the yard!',
      'Old Rook teaches MASTERWORK! At his good bench, indoors! Bring cinder iron!',
      'Flint the Miner sells ore in Cinderford! Partners pay less!',
      'Fen draws shadows by the Beacon at night! Bring chalk!',
      'Hit them while they are down! Every calling has a new trick!',
      'New seams, new thickets, new stakes! Salvagers, foragers and mapmakers, get out there!',
      'Mabb got a letter delivered! Ask him, he will pretend he did not cry!',
      'Ama\'s WOODPILE stands by the Beacon! Everybody fills it! Deadfall along the woods!',
      'The Beacon is HUNGRY! Ama says bring wood every evening! Ama is not asking!',
      'Wardens swear to the light, or to iron! Ask Ama at fifty!',
      'The STONE ROAD is open! Seven stones, seven fires! Bring OIL!',
      'Ama is twenty logs short! The boot prints go NORTH!',
      'Moths on the Stone Road as big as crows! They drink LAMPS!',
    ],
  },
  // Tag 6: Ama am Holzstapel (ruft bei Abend, wer vorbeigeht, soll Holz bringen)
  ama: {
    range: 7, every: 45,
    lines: ['Bread north, wood here. That is the deal.', '*chalks a line on the tally board*', 'Bark up. Always bark up.', 'Deadfall along the woods. Any boot can break it.', 'It ate the whole pile last night.', '*weighs a log in her hand, frowns at the fire*', '*counts the pile, and counts it again*', 'Twenty short. Bark up. Somebody knew how.'],
  },
  band_corra: {
    range: 9, every: 20,
    lines: ['*fiddles a quick jig*', 'One more! One more!', '*the fiddle squeaks, on purpose*', 'This one is called The Lark\'s Jig!'],
  },
  // Tag 5 (Bogen): Wenna in der Old Mill (tagsüber schläft sie, die Rufe kommen trotzdem leise)
  wenna: {
    range: 6, every: 40,
    lines: ['*counts loaves on her fingers*', 'One carrier with nothing is a waste of a carrier.', '*grinds, slowly*', 'Less to carry. Less to carry.', '*holds her cold lantern close*', 'Your bread tastes of sun.', '*laces her boots, unlaces them, laces them again*', 'Four nights if the stones are where I left them.', '*looks north, counting under her breath: five, six, seven*'],
    dayLines: ['*snores, very quietly, under the sacks*', '*mumbles in her sleep: forty... twenty... twelve...*'],
  },
  band_oswin: {
    range: 9, every: 26,
    lines: ['*drums on whatever is nearest*', 'Ba-dum, tss.', 'Everybody clap! No? Fine.'],
  },
  band_pip: {
    range: 9, every: 31,
    lines: ['*a thin, happy tune on the pipe*', '*toot*', 'There is a light in the north... la la...', '...and Brindle is watching it... la la...', '...and lamps walk by in the dark... la la...', '...and the mill grinds all night... la la...', '...two lamps now, only two... la...', '...and the pile by the fire grows... la la...', '...seven fires up the old stone road... la la...'],
  },
  brindle: {
    range: 8, every: 50,
    lines: [
      'Another loaf in the box. Writing it down.',
      'Wind from the north again. Smells of smoke.',
      '*scribbles in a little book*',
      'Another wolf, running south. That makes nine today.',
      'Brighter than Tuesday. I am sure of it.',
      'Lamps on the tree line again. Five. No, four.',
      'Three lamps last night. And the glow is wider again.',
      'No lamps at all last night. Not one.',
      'One, two, three cairns. Then nothing.',
      'Fires on the stones! I count four. No, five.',
      'Something tall at the top of the road, with a green lamp.',
      'Take oil up the Stone Road. Lots of oil.',
    ],
  },
  hesk: {
    range: 8, every: 40,
    lines: ['North. To the Hollow. Gran never said a word.', 'Oil! Chalk! Cake! Rope!', 'Gear for turnstones, gold for everything else.', '*counts rope under his breath*', 'Hear that? Water. Under the floor. Where it should not be.', 'Lamps for the Sumps! More lamps than that!'],
  },
  coyne: {
    range: 6, every: 50,
    lines: ['*counts under her breath*', 'Forty-one, forty-two... who moved that coin?', 'Shares in Kindle! Gold that comes back!'],
  },
  tansy: {
    range: 6, every: 55,
    lines: ['*tightens something that did not need tightening*', 'Rook! It is raining! ...no? Fine.', 'Mind the gears, they are in order.', 'Masterwork goes on the good bench. Only the good bench.'],
  },
  flint: {
    range: 8, every: 45,
    lines: ['Scrap! Brass! Glimmer! Straight out of the hill!', '*kicks the cart. It wobbles.*', 'Partners pay less. Ask Coyne.', 'Something is chewing the east seam again.'],
  },
  fen: {
    range: 7, every: 60,
    lines: ['He HAS one now. A green one.', '*draws a very big goose for the bread box*', '*draws round a goose\'s shadow*', 'Stand still! You moved!', 'Everybody has a shadow. Everybody.', '*adds another goose to a map*', 'North is where the goose points.', 'SEVEN fires! I am going to light them ALL. When I am big.'],
  },
  sorrel: {
    range: 8, every: 45,
    lines: ['Who is going down?', 'Twelve down, eleven up. Where is number twelve?', 'The walls turned well last night. Lots of corners.'],
  },
  mabb: {
    range: 10, every: 45,
    lines: [
      'Bets on the snails! Five gold, twenty gold!',
      'Bramble is in fine form today. Probably.',
      'Old Tom is not asleep. He is thinking.',
      'Duchess will not race if anyone is rude about her hat.',
      'Thistle thinks she is a horse. Do not tell her.',
      'Win three and the Cup is yours! I have spares!',
    ],
  },
};

// Zuruf von Figuren mit einer Quest für dich: einmal beim Vorbeigehen.
export const HAIL_RANGE = 5;
export const HAIL_COOLDOWN = 120; // Sekunden pro Figur
export const HAILS = {
  ama: 'You there! The Beacon needs hands that hold a light.',
  tallow: 'Traveller! A word, if you have a moment.',
  rook: 'Psst. You look useful. Come here.',
  wren: 'Hey! Got a minute? I need something.',
  fen: 'You! Yes, you. I have a job for a pair of boots.',
  stranger: '...you. Come closer.',
  marrow: 'Oi! Business for you, if you want it.',
  haskel: 'Over here! I could use some help.',
  brack: 'Hold up, wanderer. I have work.',
  brindle: 'You! Got two hands and a head for heights?',
  mabb: 'You there! Fancy a flutter on a snail?',
  mothwick: 'Psst. Wicks, lanterns, night things. Only while it lasts.',
  sorrel: 'Kindle! Over here. The Maze is hiring.',
  ivy: 'You. Yes. Do you have steady hands?',
  band_corra: 'Psst! Did you hear about the west road?',
  coyne: 'You there. Yes, you, with the purse. A moment.',
  tansy: 'Hey! Want to learn the trade? Inside, where it is dry.',
  flint: 'You! Want ore cheap? Well. Cheaper.',
};
export const HAIL_DEFAULT = 'You there! A word?';
