// Fähigkeiten für die Leiste 1-9. Welche Klasse was lernt, steht in content/classes.js.
// cd und gcd in Takten (300 ms). oil: kostet Lampenöl. Wirkungen (kind):
//   melee   Ziel daneben, Schaden hit[]           ranged  Ziel bis range Felder entfernt
//   burst   alles im Umkreis radius, scare = flieht, dazzle = kann kurz nicht angreifen, hold = greift dich an
//   self    heal / brace (halber Schaden) auf sich
//   aura    Heilung/brace für sich und Verbündete im Umkreis   hot  Heilung über Zeit (heal pro 2 Takte)
//   taunt   Wesen im Umkreis greifen dich an      dash   springt dist Felder vom Ziel weg
//   snare   Ziel steckt fest (root Takte)          fade   Wesen verlieren dich (Takte), außer im Licht
//   zone    Fläche um das Ziel, Schaden an allem darin
// burst kann mend (Tag 5): Werfer und Verbündete im selben Umkreis heilen um mend (+ Heilung der Waffe).
// melee/ranged können dazzle (Takte) und burn { dmg, ticks } (brennt nach, alle 2 Takte, + Stufe/4).
// dark: Schadensfaktor, wenn der Werfer im Dunkeln steht (Nacht und kein festes Licht). burst kann root (Takte) und burn.
// ranged kann pull (zieht das Ziel neben den Werfer und bindet es, Bosse bleiben stehen).
// fade kann radius + dazzle (blendet alles um einen herum, bevor man verschwindet).
// desc: ein Satz Stimmung; die Zahlen erzeugt shared/describe.js aus den Daten.
// power: Waffe zählt mit (Schaden + Waffenkraft). dazzle: Ziel kann kurz nicht angreifen.

// Globale Abklingzeit: eine Handlung (Fähigkeit, Gegenstand oder normaler Schlag) pro GCD Takte.
export const GCD = 4;

export const ABILITIES = {
  punch: { name: 'Punch', desc: "Fists. Better than nothing, barely.", glyph: '·', kind: 'melee', hit: [1, 2], cd: 0, power: true },

  // Warden
  // Tag 4 (Gebet 8): Ein paar frühe Fähigkeiten haben ein kleines exploit (1,3 bis 1,4), damit Verketten schon
  // vor Stufe 36 etwas bringt: Sear nach Glare, Twin Cut nach Snare, Cinder Flick auf Brennendes (der Warden hat Anvil Blow).
  bash: { name: 'Bash', desc: "A plain shield blow. The Warden's bread and butter.", glyph: '/', kind: 'melee', hit: [3, 5], cd: 0, power: true },
  brace: { name: 'Brace', desc: "Plant your feet and let the shield take it.", glyph: '#', kind: 'self', brace: 10, cd: 30, text: 'You brace behind your shield.' },
  taunt: { name: 'Taunt', desc: "Bang the shield. Everything nearby forgets the others.", glyph: '!', kind: 'taunt', radius: 4, cd: 20, text: 'You bang your shield. Everything looks at you.' },
  lantern_ward: { name: 'Lantern Ward', desc: "Your lantern's steady light hardens everyone close.", glyph: 'O', kind: 'aura', radius: 3, brace: 8, oil: 6, cd: 40, text: 'Your lantern spreads a ring of steady light.' },
  // Tag 4 (Gebet 8: mehr zu tun im Kampf): Stufe 36. Der erste Schlag nagelt fest, der zweite trifft das festgenagelte Ziel härter.
  anvil_blow: { name: 'Anvil Blow', desc: "Bring the shield rim down like a smith's hammer. The first blow pins them. The second one is the one they remember.", glyph: 'T', kind: 'melee', hit: [9, 12], root: 16, exploit: { root: 1.7 }, cd: 10, power: true },
  // Tag 4, Nachschlag: Stufe 40. Alles im Umkreis sieht nur noch den Warden und kommt nicht vom Fleck: die Gruppe schlägt zu (exploit root).
  hold_the_line: { name: 'Hold the Line', desc: "Drive the shield rim into the ground and dare them. Nothing near you moves, except toward your shield.", glyph: '=', kind: 'taunt', radius: 3, root: 14, oil: 8, cd: 40, text: 'You drive the shield into the ground. Nothing here is going anywhere.' },
  // Tag 5 (Gebet 9: Licht als Glaube, ein Paladin): Stufe 44. Der Schlag weiht den Boden: Wesen im Umkreis werden
  // getroffen und halten sich an den Warden, er und alle Verbündeten darin heilen zugleich (neue Wirkung mend).
  hallowed_ground: { name: 'Hallowed Ground', desc: "Strike the ground with the lantern held high. Where the light lands, the Grey burns and friends breathe easier.", glyph: '+', kind: 'burst', radius: 2, hit: [11, 14], hold: true, mend: 16, oil: 8, cd: 30, power: true, text: 'You strike the ground. For a moment it is holy, or at least well lit.' },
  // Tag 5, Nachschlag: Stufe 48. Schild und Laterne auf den Boden: alles daneben sitzt fest und hält sich an den Warden.
  // Danach trifft Anvil Blow (exploit root) und der Drifter mit Hamstring/Gloaming voll.
  lamp_and_anvil: { name: 'Lamp and Anvil', desc: "Bring the lantern down on the shield like a hammer on an anvil. Everything close is nailed to the spot, and very cross with you.", glyph: 'T', kind: 'burst', radius: 1.5, hit: [16, 20], root: 10, hold: true, oil: 10, cd: 24, power: true, text: 'Lamp meets shield with a sound like a forge. Nothing near you moves.' },
  stand_fast: { name: 'Stand Fast', desc: "Dig in behind the shield and get your breath back.", glyph: 'H', kind: 'self', heal: 18, brace: 8, cd: 36, text: 'You dig in. The shield holds, and so do you.' },
  beacon_slam: { name: 'Beacon Slam', desc: "Slam the lantern into the shield. The flash rings every head nearby.", glyph: '*', kind: 'burst', radius: 1.5, hit: [7, 10], dazzle: 5, hold: true, oil: 5, cd: 24, text: 'Lantern meets shield. Everything close sees stars.' },
  bulwark: { name: 'Bulwark', desc: "Raise the shield and the lantern together. Everything looks at you, and everyone behind you breathes easier.", glyph: 'U', kind: 'taunt', radius: 4, brace: 10, oil: 8, cd: 45, text: 'You raise shield and lantern. Everything turns to you, and your friends stand easier.' },
  last_light: { name: 'Last Light', desc: "Turn the lantern all the way up and crouch behind the shield. For a while, nothing gets through.", glyph: 'A', kind: 'self', heal: 40, brace: 16, oil: 10, cd: 90, text: 'Your lantern blazes. You are a wall with a light on it.' },
  // Tag 3: Stufe 28. pull = das Ziel wird neben den Werfer gezogen und an ihn gebunden (shared/sim.js pullMob)
  lantern_hook: { name: 'Lantern Hook', desc: "Swing the lantern out on its chain, hook something, and haul it in where the shield can see it.", glyph: 'J', kind: 'ranged', range: 5, hit: [8, 11], pull: true, oil: 4, cd: 20, power: true, text: 'The lantern swings out on its chain and hooks.' },
  // Tag 3, Nachschlag: Stufe 32. Schild und Laterne als Wand für alle dahinter.
  shield_wall: { name: 'Shield Wall', desc: "Set the shield down like a wall and hang the lantern on it. Everyone behind it gets their breath back.", glyph: 'W', kind: 'aura', radius: 3, heal: 12, brace: 16, oil: 10, cd: 80, text: 'You set the shield down like a wall. Your friends crowd in behind it.' },
  shield_slam: { name: 'Shield Slam', desc: "A heavy slam that rings the target's head.", glyph: ']', kind: 'melee', hit: [6, 9], dazzle: 4, cd: 16, power: true },

  // Mender
  ember_touch: { name: 'Ember Touch', desc: "Quick warmth from the staff for everyone close.", glyph: '+', kind: 'aura', radius: 3, heal: 8, cd: 6, text: 'Warmth spreads from your staff.' },
  staff_rap: { name: 'Staff Rap', desc: "A smart rap with the staff. Menders are not helpless.", glyph: '|', kind: 'melee', hit: [1, 3], cd: 0, power: true },
  warmth: { name: 'Warmth', desc: "A slow, steady warmth that keeps working after you move on.", glyph: '~', kind: 'hot', radius: 3, heal: 3, ticks: 10, cd: 24, text: 'A slow warmth settles over everyone near.' },
  glow: { name: 'Glow', desc: "A soft glow that dulls every blow for a while.", glyph: 'o', kind: 'aura', radius: 3, brace: 8, oil: 6, cd: 40, text: 'A soft glow wraps your friends.' },
  cinder_flick: { name: 'Cinder Flick', desc: "Flick a coal from the staff. Rude, but it works at a distance.", glyph: '.', kind: 'ranged', range: 4, hit: [4, 6], exploit: { burn: 1.4 }, cd: 6, power: true },
  hearth_song: { name: 'Hearth Song', desc: "Hum the old hearth tune. Everyone near feels it for a long while.", glyph: '~', kind: 'hot', radius: 4, heal: 5, ticks: 14, oil: 6, cd: 45, text: 'You hum. The cold steps back from everyone near.' },
  rekindle: { name: 'Rekindle', desc: "Pour the ember into everyone close. For a moment, nobody is cold.", glyph: '+', kind: 'aura', radius: 3, heal: 24, brace: 6, oil: 12, cd: 60, text: 'The ember roars up. Every lantern near you burns brighter.' },
  smoulder: { name: 'Smoulder', desc: "Shake the staff. Embers settle on everything close and refuse to go out.", glyph: '%', kind: 'burst', radius: 2, hit: [3, 5], burn: { dmg: 4, ticks: 16 }, oil: 8, cd: 30, power: true, text: 'Embers drift from your staff and settle on everything near.' },
  kindred_glow: { name: 'Kindred Glow', desc: "Share the ember with everyone in reach, and keep sharing it.", glyph: '~', kind: 'hot', radius: 5, heal: 8, ticks: 20, oil: 12, cd: 70, text: 'A wide, warm glow spreads out from you and stays.' },
  // Tag 3: Stufe 28. Eine starke, schnelle Heilung für die, die ganz nah stehen (meist der Warden vorn).
  ember_mend: { name: 'Ember Mend', desc: "Press the ember against whoever is closest and hold it there. It is not comfortable. It works.", glyph: '+', kind: 'aura', radius: 1.5, heal: 30, oil: 6, cd: 14, text: 'You press the ember close. Skin knits, cloaks steam.' },
  // Tag 3, Nachschlag: Stufe 32. Heilen und Schützen zugleich, für alle im Umkreis, der große Gruppenmoment.
  sanctuary: { name: 'Sanctuary', desc: "Plant the staff and let the ember burn as a little hearth. Everyone near it is warm, and hard to hurt.", glyph: 'A', kind: 'aura', radius: 4, heal: 16, brace: 12, oil: 14, cd: 75, text: 'You plant the staff. For a moment there is a hearth here, and everyone stands closer to it.' },
  // Tag 4 (Gebet 8): Stufe 36. Bläst in die Glut, die Smoulder hinterlassen hat: Brennendes trifft es doppelt.
  cinder_bloom: { name: 'Cinder Bloom', desc: "Blow on the embers you left behind. Whatever is already smouldering goes up all at once.", glyph: '&', kind: 'burst', radius: 2.5, hit: [8, 11], exploit: { burn: 2 }, oil: 10, cd: 24, power: true, text: 'You breathe on the embers. They bloom.' },
  // Tag 5: Stufe 44. Eine Glocke aus Licht: alles in der Nähe ist geblendet (angekündigte Angriffe zählen weiter),
  // die Gruppe heilt kräftig (mend). Der große Rettungsmoment des Menders.
  vesper_bell: { name: 'Vesper Bell', desc: "Ring the ember like the chapel bell at evening. Everything near stops to listen, and everyone near feels better for it.", glyph: 'A', kind: 'burst', radius: 3, hit: [4, 6], dazzle: 6, mend: 30, oil: 14, cd: 60, text: 'A low note rings out of the staff. Everything stops to listen.' },
  // Tag 5, Nachschlag: Stufe 48. Die große Rettung: viel Wärme auf einmal für alle in der Nähe, mit langer Abklingzeit.
  second_dawn: { name: 'Second Dawn', desc: "Pour the whole ember out at once, the way the sun comes up after a long night. Use it when everything else has gone wrong.", glyph: 'O', kind: 'aura', radius: 4, heal: 40, brace: 8, oil: 18, cd: 90, text: 'For a moment it is morning around you, and everybody remembers how to stand.' },
  // Tag 4, Nachschlag: Stufe 40. Die große, ruhige Gruppenheilung: lange Wärme für alle im Umkreis, gut gegen Seam Lurker und Bosse.
  banked_hearth: { name: 'Banked Hearth', desc: "Bank the ember the way you bank a fire for the night. It does not blaze. It just keeps everyone warm for a long time.", glyph: 'm', kind: 'hot', radius: 5, heal: 12, ticks: 24, oil: 14, cd: 60, text: 'You bank the ember low and steady. Warmth settles over everyone near.' },
  kindle_burst: { name: 'Kindle Burst', desc: "The ember flares. Creatures flinch and run.", glyph: '*', kind: 'burst', radius: 2.5, hit: [3, 5], scare: 6, oil: 10, cd: 24, text: 'Your ember flares outward.' },

  // Flarecaster
  flare_bolt: { name: 'Flare Bolt', desc: "A focused bolt of lantern light.", glyph: '-', kind: 'ranged', range: 5, hit: [3, 5], cd: 0, power: true },
  flare: { name: 'Flare', desc: "A white flash. Everything close is scorched and scared off.", glyph: '*', kind: 'burst', radius: 2.5, hit: [2, 3], scare: 8, oil: 10, cd: 16, text: 'Your lantern flares white.' },
  sear: { name: 'Sear', desc: "A long, hot beam. Costs a little oil, hits hard.", glyph: '=', kind: 'ranged', range: 5, hit: [6, 9], oil: 4, exploit: { dazzle: 1.3 }, cd: 10, power: true },
  glare: { name: 'Glare', desc: "Tilt the lens and put the whole lantern in its eyes.", glyph: 'O', kind: 'ranged', range: 5, hit: [4, 6], dazzle: 6, cd: 18, power: true },
  cinder_brand: { name: 'Cinder Brand', desc: "A hot point of light that stays lit on whatever it touches.", glyph: '^', kind: 'ranged', range: 5, hit: [3, 4], burn: { dmg: 4, ticks: 12 }, oil: 6, cd: 20, power: true, text: 'The spot of light catches, and keeps burning.' },
  starfall: { name: 'Starfall', desc: "Gather the light high up, then let it all fall at once.", glyph: '%', kind: 'zone', range: 6, radius: 2, hit: [10, 14], oil: 14, cd: 40, power: true, text: 'Light gathers overhead, and falls.' },
  sunlance: { name: 'Sunlance', desc: "Narrow the lens to a needle and throw the whole lantern down it.", glyph: '|', kind: 'ranged', range: 7, hit: [14, 18], oil: 10, cd: 24, power: true, text: 'A needle of white light crosses the dark.' },
  prism_ward: { name: 'Prism Ward', desc: "Split the lantern light into a ring of colours. Blows that pass through it come out softer.", glyph: 'o', kind: 'aura', radius: 3, brace: 10, oil: 8, cd: 50, text: 'A ring of split light settles around you and your friends.' },
  // Tag 3: Stufe 28. Ein Brandmal, das blendet und lange nachglüht.
  noonbrand: { name: 'Noonbrand', desc: "Fold the whole lantern into one point and press noon into the target.", glyph: '^', kind: 'ranged', range: 6, hit: [12, 16], burn: { dmg: 6, ticks: 12 }, dazzle: 4, oil: 10, cd: 30, power: true, text: 'For a moment it is noon, in one small place.' },
  // Tag 3, Nachschlag: Stufe 32. Ein Kranz aus Licht um den Werfer: verbrennt und blendet alles ringsum.
  corona: { name: 'Corona', desc: "Open the lantern all the way and stand in the middle of it. Everything close burns and cannot see.", glyph: '*', kind: 'burst', radius: 3, hit: [10, 13], dazzle: 5, burn: { dmg: 5, ticks: 10 }, oil: 16, cd: 50, power: true, text: 'Light pours out of you in a ring. Everything near you flinches and smokes.' },
  // Tag 4 (Gebet 8): Stufe 36. Trifft Geblendete viel härter: erst Glare oder Noonbrand, dann Flashpoint.
  flashpoint: { name: 'Flashpoint', desc: "Light finds the eyes it already blinded. Aim for the one that is still blinking.", glyph: '!', kind: 'ranged', range: 6, hit: [12, 15], exploit: { dazzle: 1.8 }, oil: 8, cd: 16, power: true },
  // Tag 4, Nachschlag: Stufe 40. Der weiteste Schuss des Flarecasters, gegen Brennendes (Cinder Brand, Noonbrand) noch härter.
  daybreak: { name: 'Daybreak', desc: "Pull the whole morning through the lens at once. Whatever is already burning learns what noon means.", glyph: '|', kind: 'ranged', range: 7, hit: [18, 24], exploit: { burn: 1.5 }, oil: 14, cd: 36, power: true, text: 'For a heartbeat it is morning, in a straight line.' },
  // Tag 5: Stufe 44. Ein Lichtregen auf eine Gruppe, besonders hart gegen Geblendete (nach Glare, Noonbrand).
  lanternfall: { name: 'Lanternfall', desc: "Throw the light up and let it come down on all of them. Whatever is already blinded never sees it land.", glyph: '*', kind: 'zone', range: 6, radius: 1.5, hit: [16, 21], exploit: { dazzle: 1.5 }, oil: 12, cd: 28, power: true, text: 'Light goes up like a thrown lantern and comes down everywhere.' },
  // Tag 5, Nachschlag: Stufe 48. Ein langer, heißer Strahl, der nachbrennt und Brennendes noch tiefer trifft.
  solar_lance: { name: 'Solar Lance', desc: "Focus the lens until the light turns white, then let it go in one long line. It keeps burning after it lands.", glyph: '|', kind: 'ranged', range: 7, hit: [22, 28], burn: { dmg: 6, ticks: 12 }, exploit: { burn: 1.4 }, oil: 10, cd: 24, power: true, text: 'A white line of light, and then smoke.' },
  sunspot: { name: 'Sunspot', desc: "Drop a patch of hard light on a group.", glyph: '@', kind: 'zone', range: 5, radius: 1.5, hit: [4, 6], oil: 8, cd: 20, text: 'A patch of hard light lands on the ground.' },

  // Drifter
  slash: { name: 'Slash', desc: "Quick cut. The Drifter's everyday tool.", glyph: 'x', kind: 'melee', hit: [4, 6], cd: 0, power: true },
  dusk_step: { name: 'Dusk Step', desc: "Step back into the dusk and out of the fight.", glyph: '>', kind: 'dash', dist: 2, cd: 12, text: 'You step back into the dusk.' },
  snare: { name: 'Snare', desc: "A wire snare. The target stays where it is.", glyph: '&', kind: 'snare', range: 3, root: 8, cd: 18, text: 'A wire snare bites at its feet.' },
  fade: { name: 'Fade', desc: "Let the dark forget you. Light still finds you.", glyph: '.', kind: 'fade', ticks: 12, cd: 40, text: 'You let the dark forget you.' },
  cheap_shot: { name: 'Cheap Shot', desc: "A knee, an elbow, a handful of grit. Nobody said it was fair.", glyph: ',', kind: 'melee', hit: [4, 6], dazzle: 6, cd: 18, power: true },
  night_edge: { name: 'Night Edge', desc: "A cut from the dark side of the lantern. It goes deeper where nobody can see it coming.", glyph: '\\', kind: 'melee', hit: [8, 11], dark: 1.5, cd: 14, power: true },
  caltrops: { name: 'Caltrops', desc: "Scatter a pocketful of bent nails. Everything close stops to think about its feet.", glyph: ':', kind: 'burst', radius: 2, hit: [4, 6], root: 10, cd: 36, text: 'You scatter caltrops all around you.' },
  smoke_bomb: { name: 'Smoke Bomb', desc: "A clay ball of soot and lamp-black. Everyone coughs, nobody sees you go.", glyph: 'o', kind: 'fade', ticks: 12, radius: 2, dazzle: 6, cd: 50, text: 'Smoke bursts around you. You are somewhere else now.' },
  gutter_strike: { name: 'Gutter Strike', desc: "Low, from the side nobody watches. In the dark, it is the last thing they notice.", glyph: 'v', kind: 'melee', hit: [14, 18], dark: 1.75, cd: 30, power: true },
  // Tag 3: Stufe 28. Ein Schnitt mit Lampenruß in der Klinge: blendet, im Dunkeln tiefer.
  lampblack_cut: { name: 'Lampblack Cut', desc: "A blade dipped in lamp-black. It leaves a smear across the eyes, and a deeper one in the dark.", glyph: '/', kind: 'melee', hit: [10, 13], dazzle: 6, dark: 1.5, cd: 22, power: true },
  // Tag 3, Nachschlag: Stufe 32. Der schwerste Schnitt des Drifters, im Dunkeln noch schwerer.
  vanishing_cut: { name: 'Vanishing Cut', desc: "Step through the edge of the light and out the other side. The blade stays behind for a moment.", glyph: 'V', kind: 'melee', hit: [18, 23], dark: 1.6, cd: 36, power: true },
  // Tag 4 (Gebet 8): Stufe 36. Gegen Festsitzende (Snare, Caltrops) und Geblendete (Cheap Shot) der tiefste Schnitt.
  hamstring: { name: 'Hamstring', desc: "Something that cannot move or cannot see has no idea where you are. You know exactly where it is.", glyph: 'J', kind: 'melee', hit: [12, 15], exploit: { root: 1.8, dazzle: 1.4 }, cd: 14, power: true },
  // Tag 4, Nachschlag: Stufe 40. Aus dem Rauch heraus: gegen Geblendete (Cheap Shot, Smoke Bomb, Lampblack Cut) und im Dunkeln tiefer.
  nightfall: { name: 'Nightfall', desc: "Wait until they cannot see, then be the dark. It is over before they blink the soot out of their eyes.", glyph: 'N', kind: 'melee', hit: [16, 21], dark: 1.5, exploit: { dazzle: 1.6 }, cd: 30, power: true },
  // Tag 5: Stufe 44. Der Schnitt aus der Dämmerung: im Dunkeln tiefer, gegen Festsitzende (Snare, Caltrops, Hold the Line) noch tiefer.
  gloaming: { name: 'Gloaming', desc: "The hour when nothing is quite where it seems. Least of all you.", glyph: 'G', kind: 'melee', hit: [20, 26], dark: 1.4, exploit: { root: 1.5 }, cd: 20, power: true },
  // Tag 5, Nachschlag: Stufe 48. Der letzte Schnitt aus dem Schatten: gegen Geblendete am tiefsten, gegen Festsitzende auch.
  last_shadow: { name: 'Last Shadow', desc: "Become the last shadow they ever look for. They will not find it.", glyph: 'L', kind: 'melee', hit: [24, 30], dark: 1.3, exploit: { dazzle: 1.5, root: 1.3 }, cd: 26, power: true },

  // Tag 6: Spezialisierungen ab Stufe 50 (content/classes.js, specs). Jede Klasse zwei Wege mit je einer Fähigkeit auf 50.
  // Warden (bei Ama): Lightsworn (Gebet 9, ein Lichtweg) und Ironwall
  oath_of_embers: { name: 'Oath of Embers', desc: "Speak the vow out loud and strike the ground with the lantern. Everything close is blinded and turns on you, and everyone near you is warmer for it.", glyph: '+', kind: 'burst', radius: 2.5, hit: [18, 22], dazzle: 4, hold: true, mend: 26, oil: 12, cd: 32, power: true, text: 'You speak the oath. The lantern answers.' },
  cinder_bastion: { name: 'Cinder Bastion', desc: "Set your heels like cinder iron set in stone. Everything near you comes to you and stays there, and everything behind you is safe.", glyph: '#', kind: 'taunt', radius: 4, root: 8, brace: 20, oil: 12, cd: 50, text: 'You set your heels. Nothing gets past.' },
  // Warden auf 54 (Nachschlag Tag 6): Lightsworn hält die Gruppe warm, Ironwall steht wie ein Amboss
  lantern_oath: { name: 'Lantern Oath', desc: "Hang the lantern from the shield and keep the vow out loud. Everyone near you stays warm for a long time, and so do you.", glyph: '~', kind: 'hot', radius: 4, heal: 9, ticks: 16, oil: 12, cd: 50, text: 'You say the vow again. The lantern burns steadier for it.' },
  anvil_stance: { name: 'Anvil Stance', desc: "Set your feet like an anvil on its block. Hit it all you like. It was made for that.", glyph: 'T', kind: 'self', heal: 45, brace: 20, oil: 10, cd: 60, text: 'You set your feet. Let them hammer.' },
  // Mender (bei Tallow): Hearthkeeper und Ashbinder
  hearthfire: { name: 'Hearthfire', desc: "Make the ember into a real hearth for a moment, the kind people sit around. Nobody near it is allowed to fall over.", glyph: 'A', kind: 'aura', radius: 4, heal: 30, brace: 16, oil: 16, cd: 55, text: 'For a moment there is a hearth here, and everyone draws in close.' },
  ash_bloom: { name: 'Ash Bloom', desc: "Throw a handful of embers that land as a flower of ash and keep burning. Embers are for warmth. Ashes are for everything else.", glyph: '*', kind: 'zone', range: 6, radius: 2, hit: [12, 16], burn: { dmg: 6, ticks: 10 }, exploit: { burn: 1.3 }, oil: 12, cd: 30, power: true, text: 'Embers fall like petals, and catch.' },
  // Flarecaster (bei Wren): Sunwright und Prismist
  zenith: { name: 'Zenith', desc: "All the light you have, in one point, at the top of the sky. One target. It will not need a second.", glyph: '|', kind: 'ranged', range: 7, hit: [30, 38], exploit: { burn: 1.4, dazzle: 1.3 }, oil: 14, cd: 30, power: true, text: 'Noon, in one place, all at once.' },
  prism_storm: { name: 'Prism Storm', desc: "Split the light through the lens into every colour at once. Everything under it is dazzled and cannot strike back.", glyph: '%', kind: 'zone', range: 6, radius: 2, hit: [12, 16], dazzle: 6, oil: 14, cd: 40, power: true, text: 'The light breaks into colours, and so does everything under it.' },
  // Drifter (beim Stranger): Nightblade und Snarewright
  moonless_cut: { name: 'Moonless Cut', desc: "A cut from the part of the night where there is no moon at all. In the dark it is worse. Against anything that cannot see, worse still.", glyph: 'L', kind: 'melee', hit: [28, 34], dark: 1.5, exploit: { dazzle: 1.4 }, cd: 24, power: true },
  tangle_wire: { name: 'Tangle Wire', desc: "Wire, soot and patience. Throw it, and everything nearby walks into it.", glyph: '#', kind: 'zone', range: 4, radius: 1.5, hit: [10, 13], root: 10, cd: 36, power: true, text: 'The wire snaps tight. Nobody is going anywhere.' },
  twin_cut: { name: 'Twin Cut', desc: "Both blades at once. Your hardest hit.", glyph: 'X', kind: 'melee', hit: [8, 11], exploit: { root: 1.3 }, cd: 12, power: true },
};
