// The Unending Maze (seit 2026-11-13, Gebet 4): unter Cinderford. Jedes Stockwerk ist ein eigenes Gebiet
// (maze_1 bis maze_99, ein Raum pro Stockwerk auf dem Server) und wird jeden Tag (Berliner Datum) neu gewürfelt.
// Der Generator ist rein (gleiches Stockwerk + Datum = gleiche Karte), damit Server und Browser dasselbe sehen.
// Jedes Stockwerk hat am Ende einen zufälligen Boss, den Keeper. Wer mitkämpft, wenn er fällt, darf die Treppe
// hinunter (p.mazeDeep, siehe shared/delve.js). Wesen wachsen mit dem Stockwerk: Stufe = 3 + 2 * Stockwerk bis 99,
// darunter werden sie nur noch zäher.

import { MOBS } from '../mobs.js';

export const MAZE_FLOORS = 99;
// Stufe der Wesen auf einem Stockwerk.
export const floorLevel = (f) => Math.min(99, 3 + 2 * f);
// Ab hier (Stufe 99) wird es nur noch härter, nicht höher.
const CAP_FLOOR = 48;

// Wo man auf Cinderford ankommt und aufwacht (muss zu content/regions/cinderford.js passen).
export const CINDER = { arrive: { x: 21, y: 6 }, respawn: { x: 21, y: 18 } };

const PITCH = 3; // 2 Felder Gang + 1 Feld Wand

export const mazeId = (f) => `maze_${f}`;
export function floorOf(id) {
  const m = /^maze_([1-9]\d?)$/.exec(String(id));
  return m ? Number(m[1]) : 0;
}

// Zellen pro Seite: wächst mit der Tiefe, bis 14 (43 x 43 Felder).
const cellsFor = (f) => Math.min(14, 7 + Math.floor(f / 3));

// Ankunftsfeld eines Stockwerks: unabhängig vom Datum, damit Türen und Seile es kennen.
export function mazeStart(f) {
  const C = cellsFor(f);
  const sx = Math.floor(C / 2) - 1;
  return { x: 1 + PITCH * sx + 2, y: 1 + PITCH * (C - 1) };
}

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const ORD = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

// ---------- Wesen nach Stufe ----------

// Grundwerte eines normalen Wesens der Stufe L. Etwas zäher als die Oberwelt (die ab 25 zu leicht ist).
function baseStats(L) {
  return {
    hp: Math.round(12 + 4 * L + 0.04 * L * L),
    hit: [Math.round(1 + 0.4 * L), Math.round(2 + 0.5 * L)],
    xp: Math.round(3 * L + 0.08 * L * L),
    gold: [Math.floor(L / 3), Math.ceil(L * 0.6)],
  };
}

const scaleHit = (hit, k) => [Math.max(1, Math.round(hit[0] * k)), Math.max(1, Math.round(hit[1] * k))];

function tierDrops(L) {
  if (L < 20) return [['scrap', 0.3, 1, 2], ['brass_bits', 0.3, 1, 2], ['grey_wisp', 0.3, 1, 1]];
  if (L < 40) return [['glimmer', 0.25, 1, 1], ['green_shard', 0.15, 1, 1], ['brass_bits', 0.3, 1, 3]];
  return [['greyglass', 0.25, 1, 1], ['wisp_core', 0.15, 1, 1], ['glimmer', 0.3, 1, 2]];
}

// Ein normales Wesen des Labyrinths auf Stockwerk f (Vorlage aus content/mobs.js, Werte nach Stufe).
export function mazeMob(type, f) {
  const t = MOBS[type];
  const L = floorLevel(f);
  const deep = 1 + Math.max(0, f - CAP_FLOOR) * 0.04;
  const b = baseStats(L);
  const m = t.maze; // Faktoren der Vorlage
  const def = {
    ...t,
    level: L,
    hp: Math.round(b.hp * m.hp * deep),
    hit: scaleHit(b.hit, m.hit * (1 + Math.max(0, f - CAP_FLOOR) * 0.02)),
    xp: Math.round(b.xp * m.xp),
    gold: b.gold,
    drops: [...t.drops, ...tierDrops(L)],
  };
  if (t.special) def.special = { ...t.special, hit: scaleHit(b.hit, 2.2 * m.hit) };
  if (t.drainOil) def.drainOil = Math.round(t.drainOil + L / 12);
  delete def.maze;
  return def;
}

// ---------- Keeper: der zufällige Boss am Ende jedes Stockwerks ----------

// Körper: Sprite und Hauptwort. Der Name setzt sich aus Beiname und Körper zusammen.
const BODIES = [
  ['turnling', 'Turnling'], ['wallcrawler', 'Crawler'], ['lostlamp', 'Lamp'], ['wolf', 'Hound'],
  ['stone_beetle', 'Shell'], ['pit_worm', 'Worm'], ['choir_wraith', 'Singer'], ['drowned_pilgrim', 'Pilgrim'],
  ['mire_lurker', 'Lurker'], ['bog_toad', 'Toad'], ['moss_spirit', 'Mossling'], ['old_foreman', 'Digger'],
];
const EPITHETS = ['Hungry', 'Weeping', 'Crooked', 'Pale', 'Many-Handed', 'Hollow', 'Rusted', 'Whispering',
  'Patient', 'Lantern-Eating', 'Backward', 'Sleepless', 'Folded', 'Thin', 'Grinning', 'Borrowed'];

const SPECIAL_TEXT = {
  ring: (n) => `${n} turns round in a wide, slow circle.`,
  bigplus: (n) => `${n} rears up. The floor around you cracks in a cross.`,
  plus: (n) => `${n} gathers itself over you.`,
  line: (n) => `${n} drops low. It is going to charge.`,
};

// Eigenschaften, von denen jeder Keeper je nach Tiefe eine bis drei bekommt.
const AFFIXES = {
  swift: { text: 'It moves far too fast for its size.', apply: (d) => { d.attackEvery = 3; d.moveEvery = 1; } },
  thick: { text: 'Its hide turns blades.', apply: (d) => { d.hp = Math.round(d.hp * 1.35); } },
  thirsty: { text: 'It drinks lamp oil, and it is thirsty.', apply: (d) => { d.drainOil = 6 + Math.round(d.level / 10); } },
  snuffing: {
    text: 'It hates light, and knows how to put it out.',
    apply: (d) => {
      d.boss.phase2At = 0.5;
      d.boss.phase2Text = `${d.name} breathes in. Every flame in the room goes out.`;
      d.boss.snuff = true;
      d.boss.shroud = 0.5;
    },
  },
  furious: {
    text: 'It does not like long fights.',
    apply: (d) => { d.boss.enrage = { after: 500, mult: 1.6, text: `${d.name} loses its patience. Every blow lands twice as hard.` }; },
  },
  grasping: {
    text: 'It reaches further than it should.',
    apply: (d) => {
      d.specials.push({ every: 1, delay: 6, pattern: 'bigplus', hit: scaleHit(d.hit, 2.2), text: SPECIAL_TEXT.bigplus(d.name) });
    },
  },
};
const AFFIX_IDS = Object.keys(AFFIXES);

export function keeperFor(f, rand) {
  const L = Math.min(99, floorLevel(f) + 2);
  const great = f % 5 === 0;
  const deep = 1 + Math.max(0, f - CAP_FLOOR) * 0.05;
  const [sprite, noun] = BODIES[Math.floor(rand() * BODIES.length)];
  const name = `The ${EPITHETS[Math.floor(rand() * EPITHETS.length)]} ${noun}`;
  const b = baseStats(L);
  const hit = scaleHit(b.hit, great ? 1.15 : 1);
  const patterns = ['ring', 'bigplus', 'plus', 'line'];
  const p1 = patterns[Math.floor(rand() * patterns.length)];
  let p2 = patterns[Math.floor(rand() * patterns.length)];
  if (p2 === p1) p2 = p1 === 'ring' ? 'plus' : 'ring';
  const turns = Math.min(5, 1 + Math.floor(f / 5));
  const def = {
    ...MOBS.maze_keeper,
    name, sprite, level: L, ai: 'grey', moveEvery: 2,
    // Normale Keeper: allein mit Einsatz (Tränke, Ausweichen). Große Keeper (jedes 5. Stockwerk): für Gruppen.
    hp: Math.round(b.hp * (great ? 13 : 5.2) * deep),
    hit, attackEvery: 4, aggro: 5, leash: 9, respawn: 400,
    xp: Math.round(b.xp * (great ? 12 : 8)),
    gold: [L, Math.round(L * 2.5)],
    drops: [['turnstone', 1, turns, turns], ['turn_chalk', 0.8, 1, 2], ...tierDrops(L).map(([id, c, a, z]) => [id, Math.min(1, c * 3), a, z + 1])],
    specials: [
      { every: 1, delay: 6, pattern: p1, hit: scaleHit(hit, 2.4), text: SPECIAL_TEXT[p1](name) },
      { every: 1, delay: 6, pattern: p2, hit: scaleHit(hit, 2.2), text: SPECIAL_TEXT[p2](name) },
    ],
    specialEvery: 3,
    boss: { deathText: `${name} comes apart like wet paper. Somewhere below, stairs grind open.` },
    mazeFloor: f,
    great,
  };
  delete def.maze;
  // Eigenschaften: 1 bis Stockwerk 19, 2 bis 39, danach 3. Große Keeper (jedes 5. Stockwerk) eine mehr.
  const want = Math.min(4, (f < 20 ? 1 : f < 40 ? 2 : 3) + (great ? 1 : 0));
  // Ohne Wiederholung ziehen (endet immer, auch bei schlechtem Zufall)
  const pool = [...AFFIX_IDS];
  const affixes = [];
  while (affixes.length < want && pool.length) affixes.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  for (const a of affixes) AFFIXES[a].apply(def);
  def.affixes = affixes;
  def.examine = `${great ? 'A great Keeper. ' : ''}It keeps the stairs of the ${ORD(f)} turn. ${affixes.map((a) => AFFIXES[a].text).join(' ')}`;
  return def;
}

// ---------- Karte ----------

// Fundstellen nach Stufe (gibt es alle schon auf der Oberwelt oder im Drift).
function nodesFor(L) {
  if (L < 15) return ['scrap_heap', 'bitterleaf_patch', 'wild_hive'];
  if (L < 30) return ['copper_seam', 'brass_wreck', 'moss_bloom', 'rusted_cart'];
  return ['glimmer_vein', 'sunken_cache', 'nightcap_ring'];
}

function mobTypesFor(f) {
  if (f < 2) return ['turnling'];
  if (f < 4) return ['turnling', 'turnling', 'wallcrawler'];
  return ['turnling', 'wallcrawler', 'lostlamp'];
}

export function mazeFor(f, date) {
  const rand = rng(hash(`maze:${date}:${f}`));
  const C = cellsFor(f);
  const W = PITCH * C + 1;
  const tiles = Array.from({ length: W }, () => Array(W).fill('#'));
  const heights = Array.from({ length: W }, () => Array(W).fill('b'));
  const L = floorLevel(f);

  const cellFloor = (cx, cy) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) tiles[1 + PITCH * cy + y][1 + PITCH * cx + x] = 'f';
  };
  // Wand zwischen zwei benachbarten Zellen öffnen
  const open = (ax, ay, bx, by) => {
    if (ax !== bx) {
      const x = PITCH * Math.max(ax, bx);
      for (let y = 0; y < 2; y++) tiles[1 + PITCH * ay + y][x] = 'f';
    } else {
      const y = PITCH * Math.max(ay, by);
      for (let x = 0; x < 2; x++) tiles[y][1 + PITCH * ax + x] = 'f';
    }
  };
  const links = Array.from({ length: C * C }, () => new Set());
  const link = (a, b) => { links[a].add(b); links[b].add(a); };
  const idx = (cx, cy) => cy * C + cx;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Labyrinth: Tiefensuche mit Rücksprung (jede Zelle erreichbar)
  for (let cy = 0; cy < C; cy++) for (let cx = 0; cx < C; cx++) cellFloor(cx, cy);
  const seen = new Uint8Array(C * C);
  const sx = Math.floor(C / 2) - 1;
  const stack = [[sx, C - 1]];
  seen[idx(sx, C - 1)] = 1;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const next = DIRS.map(([dx, dy]) => [cx + dx, cy + dy])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < C && y < C && !seen[idx(x, y)]);
    if (!next.length) { stack.pop(); continue; }
    const [nx, ny] = next[Math.floor(rand() * next.length)];
    open(cx, cy, nx, ny);
    link(idx(cx, cy), idx(nx, ny));
    seen[idx(nx, ny)] = 1;
    stack.push([nx, ny]);
  }
  // Ein paar Schleifen, damit man nicht nur zurücklaufen muss
  for (let cy = 0; cy < C; cy++) for (let cx = 0; cx < C; cx++) {
    if (links[idx(cx, cy)].size !== 1 || rand() > 0.3) continue;
    const opts = DIRS.map(([dx, dy]) => [cx + dx, cy + dy])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < C && y < C && !links[idx(cx, cy)].has(idx(x, y)));
    if (!opts.length) continue;
    const [nx, ny] = opts[Math.floor(rand() * opts.length)];
    open(cx, cy, nx, ny);
    link(idx(cx, cy), idx(nx, ny));
  }

  // Räume aus 2 x 2 Zellen: alle Wände darin offen
  const rooms = [];
  const carveRoom = (rx, ry) => {
    for (let y = PITCH * ry + 1; y <= PITCH * (ry + 2) - 1; y++) for (let x = PITCH * rx + 1; x <= PITCH * (rx + 2) - 1; x++) tiles[y][x] = 'F';
    const cells = [idx(rx, ry), idx(rx + 1, ry), idx(rx, ry + 1), idx(rx + 1, ry + 1)];
    for (const a of cells) for (const b of cells) if (a !== b && (Math.abs(a - b) === 1 || Math.abs(a - b) === C)) link(a, b);
    rooms.push({ rx, ry, cells });
  };
  // Startraum unten in der Mitte
  carveRoom(sx, C - 2);

  // Entfernung jeder Zelle vom Start (Breitensuche über die Verbindungen)
  const dist = new Int16Array(C * C).fill(-1);
  const q = [idx(sx, C - 1)];
  dist[q[0]] = 0;
  while (q.length) {
    const a = q.shift();
    for (const b of links[a]) if (dist[b] < 0) { dist[b] = dist[a] + 1; q.push(b); }
  }
  // Keeper-Raum um die fernste Zelle
  let far = 0;
  for (let i = 0; i < C * C; i++) if (dist[i] > dist[far]) far = i;
  const bx = Math.min(C - 2, far % C);
  const by = Math.min(C - 4, Math.floor(far / C));
  carveRoom(bx, by);
  const bossRoom = rooms[rooms.length - 1];
  // Weitere Räume, die weder Start- noch Keeper-Raum berühren
  const extra = 1 + Math.floor(C / 5);
  for (let k = 0, tries = 0; k < extra && tries < 40; tries++) {
    const rx = Math.floor(rand() * (C - 1));
    const ry = Math.floor(rand() * (C - 3));
    if (rooms.some((r) => Math.abs(r.rx - rx) < 3 && Math.abs(r.ry - ry) < 3)) continue;
    carveRoom(rx, ry);
    k++;
  }

  // Boden mischen: hier und da flaches Wasser
  for (let y = 1; y < W - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (tiles[y][x] === '#') { heights[y][x] = 'c'; continue; }
    if (rand() < 0.04) tiles[y][x] = 'w';
  }

  const start = mazeStart(f);
  const used = new Set();
  const mark = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) used.add(`${x + dx},${y + dy}`); };
  const roomOf = (i) => rooms.find((r) => r.cells.includes(i));
  // Ein freies Feld in einer Zelle (Zellen-Ecke + Versatz)
  const spotIn = (i) => {
    const cx = i % C;
    const cy = Math.floor(i / C);
    const cand = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => ({ x: 1 + PITCH * cx + dx, y: 1 + PITCH * cy + dy }))
      .filter((p) => !used.has(`${p.x},${p.y}`));
    if (!cand.length) return null;
    const p = cand[Math.floor(rand() * cand.length)];
    mark(p.x, p.y);
    return p;
  };

  const rx0 = PITCH * sx + 1; // linke obere Ecke des Startraums
  const ry0 = PITCH * (C - 2) + 1;
  const objects = [
    { type: 'door', to: 'cinderford', tx: CINDER.arrive.x, ty: CINDER.arrive.y, x: rx0, y: ry0 + 4, name: 'the rope up to Cinderford', look: 'stairs' },
    { type: 'brazier', x: rx0 + 4, y: ry0, light: 4.5, name: 'a delvers\' brazier' },
  ];
  mark(rx0, ry0 + 4);
  mark(rx0 + 4, ry0);
  mark(start.x, start.y);
  for (const c of rooms[0].cells) used.add(`cell:${c}`);

  // Keeper-Raum: Treppe hinunter in der fernsten Ecke, zwei Kohlebecken, der Keeper in der Mitte
  const bx0 = PITCH * bossRoom.rx + 1;
  const by0 = PITCH * bossRoom.ry + 1;
  const keeper = keeperFor(f, rand);
  if (f < MAZE_FLOORS) {
    const next = mazeStart(f + 1);
    objects.push({
      type: 'door', to: mazeId(f + 1), tx: next.x, ty: next.y, x: bx0 + 2, y: by0, name: `the stairs down to the ${ORD(f + 1)} turn`, look: 'stairs',
      needs: { maze: f + 1 }, locked: 'The stairs grind shut in front of you. They open only for those who stood against the Keeper of this turn.',
    });
  } else {
    objects.push({ type: 'find', x: bx0 + 2, y: by0, name: 'the last stair', text: 'There are no more stairs. Only a small stone bench, worn smooth, and a candle someone left burning. It is still warm.' });
  }
  objects.push({ type: 'brazier', x: bx0, y: by0 + 4, light: 4, name: 'a Keeper\'s brazier' });
  objects.push({ type: 'brazier', x: bx0 + 4, y: by0 + 4, light: 4, name: 'a Keeper\'s brazier' });
  for (const [x, y] of [[bx0 + 2, by0], [bx0, by0 + 4], [bx0 + 4, by0 + 4]]) mark(x, y);
  for (const c of bossRoom.cells) used.add(`cell:${c}`);
  const mobs = [{ type: 'maze_keeper', x: bx0 + 2, y: by0 + 2, def: keeper }];
  mark(bx0 + 2, by0 + 2);

  // Sackgassen für Truhen und Fundstellen, Zellen ab Entfernung 3 für Wesen
  const cells = [...Array(C * C).keys()].filter((i) => !used.has(`cell:${i}`) && !roomOf(i) && dist[i] >= 3);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const deadEnds = shuffle(cells.filter((i) => links[i].size === 1));
  const chestTable = L < 20 ? 'maze_low' : L < 45 ? 'maze_mid' : 'maze_deep';
  const chestCount = 1 + (f % 5 === 0 ? 1 : 0);
  for (let k = 0; k < chestCount && deadEnds.length; k++) {
    const at = spotIn(deadEnds.pop());
    if (at) objects.push({ type: 'chest', chest: chestTable, name: 'a delver\'s cache', ...at });
  }
  const nodeKinds = nodesFor(L);
  for (let k = 0; k < 2 && deadEnds.length; k++) {
    const at = spotIn(deadEnds.pop());
    if (at) objects.push({ type: 'node', node: nodeKinds[Math.floor(rand() * nodeKinds.length)], ...at });
  }
  // Kohlebecken in den übrigen Räumen (Licht für unterwegs, nachfüllen kostet Öl)
  for (const r of rooms.slice(2)) {
    const x = PITCH * r.rx + 3;
    const y = PITCH * r.ry + 3;
    if (!used.has(`${x},${y}`)) { objects.push({ type: 'brazier', x, y, light: 4, name: 'an old brazier' }); mark(x, y); }
  }
  const kinds = mobTypesFor(f);
  // Wesen nicht in Sichtweite des Starts (sonst greift einen gleich am Seil etwas an)
  const farFromStart = (i) => Math.hypot(1 + PITCH * (i % C) - start.x, 1 + PITCH * Math.floor(i / C) - start.y) >= 10;
  const mobCells = shuffle(cells.filter((i) => dist[i] >= 3 && farFromStart(i)));
  const mobCount = Math.min(mobCells.length, 4 + Math.floor(C * 0.8));
  for (let k = 0; k < mobCount; k++) {
    const at = spotIn(mobCells[k]);
    if (!at) continue;
    const type = kinds[Math.floor(rand() * kinds.length)];
    mobs.push({ type, ...at, def: mazeMob(type, f) });
  }

  return {
    id: mazeId(f),
    name: `THE UNENDING MAZE`,
    floor: f,
    date,
    daily: true,
    // Um Mitternacht faltet sich das Labyrinth neu; wer drin ist, steht wieder in Cinderford.
    foldTo: { region: 'cinderford', ...CINDER.arrive },
    foldText: 'The walls grind and turn. The Maze folds itself up, and sets you down in Cinderford.',
    indoor: true,
    mapFog: true,
    tiles: tiles.map((r) => r.join('')),
    heights: heights.map((r) => r.join('')),
    start,
    deathTo: { region: 'cinderford', ...CINDER.respawn },
    safeRadius: 0,
    zoneAt: () => `MAZE · ${ORD(f).toUpperCase()} TURN`,
    keeper: keeper.name,
    objects,
    npcs: [],
    mobs,
  };
}
