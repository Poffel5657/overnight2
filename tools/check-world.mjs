// Prüft Gebiete und Inhalte auf Fehler, die man im Spiel sonst erst spät sieht.
// Aufruf: node tools/check-world.mjs   (Exit-Code 1 bei Fehlern). Muss vor jedem Commit grün sein.
//  - Gebiete: Raster, Objekte, Figuren, Erreichbarkeit zu Fuß
//  - Gegenstände: jeder hat einen Fundort und einen Zweck
//  - Quests, Gespräche, Klassen, Berufe, Rezepte: alles verweist auf Existierendes und ist spielbar

import { STATIC_REGIONS, REGION_IDS, regionFor } from '../content/regions/index.js';
import { TILE_TYPES } from '../content/tiles.js';
import { SPRITES } from '../content/sprites.js';
import { MOBS } from '../content/mobs.js';
import { TALK } from '../content/npcs.js';
import { ITEMS } from '../content/items.js';
import { RECIPES } from '../content/recipes.js';
import { NODES } from '../content/nodes.js';
import { QUESTS } from '../content/quests.js';
import { CLASSES } from '../content/classes.js';
import { ABILITIES } from '../content/abilities.js';
import { PROFESSIONS } from '../content/professions.js';
import { SHOPS } from '../content/shops.js';
import { FAVOURS, FAVOURS_PER_DAY, BEACON_FUEL } from '../content/dailies.js';
import { BALLOT } from '../content/ballot.js';
import { CHESTS } from '../content/chests.js';
import { CHRONICLE } from '../content/chronicle.js';
import { createWorld, walkable } from '../shared/sim.js';
import { findPath } from '../shared/path.js';

// Objekte mit Dach oder hohen Wänden: Figuren brauchen ein freies Feld Abstand,
// sonst verdeckt das Gebäude sie aus manchen Kamerawinkeln.
const TALL = new Set(['house', 'chapel', 'workshop']);
const errors = [];

function check(region) {
  const H = region.tiles.length;
  const W = region.tiles[0].length;
  const err = (msg) => errors.push(`${region.id}: ${msg}`);

  region.tiles.forEach((row, y) => {
    if (row.length !== W) err(`Reihe ${y} ist ${row.length} statt ${W} Zeichen lang`);
    if (region.heights[y]?.length !== W) err(`Höhenreihe ${y} hat die falsche Länge`);
    for (const ch of row) if (!TILE_TYPES[ch]) err(`unbekanntes Geländezeichen '${ch}' in Reihe ${y}`);
  });
  if (region.heights.length !== H) err('Höhenraster hat die falsche Anzahl Reihen');

  const tile = (x, y) => region.tiles[y]?.[x];
  const occupied = new Map();
  for (const o of region.objects) {
    const w = o.w || 1, d = o.d || 1;
    if (o.x < 1 || o.y < 1 || o.x + w > W - 1 || o.y + d > H - 1) err(`${o.type} bei ${o.x},${o.y} ragt aus der Karte`);
    for (let y = o.y; y < o.y + d; y++) {
      for (let x = o.x; x < o.x + w; x++) {
        if (TILE_TYPES[tile(x, y)]?.water) err(`${o.type} bei ${o.x},${o.y} steht im Wasser (${x},${y})`);
        if (occupied.has(`${x},${y}`)) err(`${o.type} bei ${o.x},${o.y} überlappt ${occupied.get(`${x},${y}`)}`);
        occupied.set(`${x},${y}`, `${o.type} bei ${o.x},${o.y}`);
      }
    }
  }

  const nearTall = (x, y) => region.objects.find((o) => TALL.has(o.type)
    && x >= o.x - 1 && x <= o.x + (o.w || 1) && y >= o.y - 1 && y <= o.y + (o.d || 1));
  const spawnOk = (kind, e) => {
    const t = TILE_TYPES[tile(e.x, e.y)];
    if (!t?.walk) err(`${kind} ${e.id || e.type} bei ${e.x},${e.y} steht auf '${tile(e.x, e.y)}' (nicht begehbar)`);
    if (occupied.has(`${e.x},${e.y}`)) err(`${kind} ${e.id || e.type} bei ${e.x},${e.y} steht in ${occupied.get(`${e.x},${e.y}`)}`);
    const tall = nearTall(e.x, e.y);
    if (tall) err(`${kind} ${e.id || e.type} bei ${e.x},${e.y} klebt an ${tall.type} bei ${tall.x},${tall.y} (ein Feld Abstand lassen)`);
  };
  for (const n of region.npcs) {
    spawnOk('Figur', n);
    if (!SPRITES[n.sprite]) err(`Figur ${n.id} hat kein Sprite '${n.sprite}'`);
    if (!TALK[n.id]?.start) err(`Figur ${n.id} hat kein Gespräch (TALK.${n.id}.start)`);
  }
  for (const m of region.mobs) {
    spawnOk('Wesen', m);
    if (!MOBS[m.type]) err(`unbekanntes Wesen '${m.type}'`);
  }
  spawnOk('Start', { id: 'start', ...region.start });
  if (region.respawn) spawnOk('Aufwachpunkt', { id: 'respawn', ...region.respawn });
  if (region.deathTo) {
    const home = regionFor(region.deathTo.region, '2026-11-10');
    if (!home || !TILE_TYPES[home.tiles[region.deathTo.y]?.[region.deathTo.x]]?.walk) err(`deathTo zeigt auf kein begehbares Feld`);
  }
  if (!region.respawn && !region.deathTo) err('weder respawn noch deathTo');

  for (const o of region.objects) {
    if (o.type === 'door') {
      const target = REGION_IDS.includes(o.to) && regionFor(o.to, '2026-11-10');
      if (!target) err(`Tür bei ${o.x},${o.y} führt in unbekanntes Gebiet '${o.to}'`);
      else if (!TILE_TYPES[target.tiles[o.ty]?.[o.tx]]?.walk || target.objects.some((t) => o.tx >= t.x && o.tx < t.x + (t.w || 1) && o.ty >= t.y && o.ty < t.y + (t.d || 1))) {
        err(`Tür bei ${o.x},${o.y} landet in ${o.to} auf ${o.tx},${o.ty}, das ist nicht begehbar`);
      }
    }
    if (o.type === 'node' && !NODES[o.node]) err(`unbekannte Fundstelle '${o.node}' bei ${o.x},${o.y}`);
    if (o.type === 'station' && !Object.values(PROFESSIONS).some((pr) => pr.station === o.station)) err(`Station '${o.station}' gehört zu keinem Beruf`);
  }

  // Zu Fuß erreichbar: Figuren, Fundstellen, Stationen, Feuer (ein Nachbarfeld muss erreichbar sein).
  const w = createWorld(region);
  const s0 = region.start;
  const reach = (tx, ty, tw = 1, td = 1) => findPath(w.w, w.h, (a, b) => walkable(w, a, b), s0.x, s0.y,
    (a, b) => a >= tx - 1 && a <= tx + tw && b >= ty - 1 && b <= ty + td, tx, ty, 20000) !== null;
  for (const o of w.objects) if (o.type !== 'house' && o.type !== 'chapel' && !reach(o.x, o.y, o.w, o.d)) err(`${o.type} ${o.node || o.station || ''} bei ${o.x},${o.y} ist nicht erreichbar`);
  for (const n of w.npcs) if (!reach(n.x, n.y)) err(`Figur ${n.id} bei ${n.x},${n.y} ist nicht erreichbar`);
  for (const m of w.mobs) if (!reach(m.x, m.y)) err(`Wesen ${m.type} bei ${m.home.x},${m.home.y} ist nicht erreichbar`);
}

// ---------- Inhalte ----------

function checkContent(regions) {
  const err = (msg) => errors.push(`inhalt: ${msg}`);
  const npcIds = new Set(regions.flatMap((r) => r.npcs.map((n) => n.id)));
  const stations = new Set(regions.flatMap((r) => r.objects.filter((o) => o.type === 'station').map((o) => o.station)));
  const placedNodes = regions.flatMap((r) => r.objects.filter((o) => o.type === 'node').map((o) => o.node));
  const mobTypes = new Set(regions.flatMap((r) => r.mobs.map((m) => m.type)));
  const item = (id, where) => { if (!ITEMS[id]) err(`${where}: unbekannter Gegenstand '${id}'`); };

  // Alle Wirkungen aus allen Gesprächen einsammeln.
  const effects = [];
  for (const [npc, pages] of Object.entries(TALK)) {
    if (!npcIds.has(npc)) err(`Gespräch für ${npc}, aber die Figur steht in keinem Gebiet`);
    for (const [key, page] of Object.entries(pages)) {
      if (!page.text || !Array.isArray(page.options) || !page.options.length) err(`Gespräch ${npc}/${key}: Text oder Antworten fehlen`);
      for (const o of page.options || []) {
        if (o.to && !pages[o.to]) err(`Gespräch ${npc}/${key}: Seite '${o.to}' fehlt`);
        for (const d of o.do || []) effects.push({ npc, ...d });
        for (const q of Object.keys(o.if?.quest || {})) if (!QUESTS[q]) err(`Gespräch ${npc}/${key}: Quest '${q}' fehlt`);
        for (const i of Object.keys(o.if?.has || {})) item(i, `Gespräch ${npc}/${key}`);
      }
    }
  }
  for (const e of effects) {
    if (e.start && !QUESTS[e.start]) err(`Gespräch ${e.npc}: Quest '${e.start}' fehlt`);
    if (e.advance && !QUESTS[e.advance]) err(`Gespräch ${e.npc}: Quest '${e.advance}' fehlt`);
    if (e.learn && !PROFESSIONS[e.learn]) err(`Gespräch ${e.npc}: Beruf '${e.learn}' fehlt`);
    if (e.chooseClass && !CLASSES[e.chooseClass]) err(`Gespräch ${e.npc}: Klasse '${e.chooseClass}' fehlt`);
    if (e.shop && !SHOPS[e.shop]) err(`Gespräch ${e.npc}: Händler '${e.shop}' fehlt`);
    for (const i of Object.keys({ ...e.give, ...e.take })) item(i, `Gespräch ${e.npc}`);
  }

  // Quests: wer startet sie, ist jeder Schritt erfüllbar, kommt man an die Dinge?
  for (const [id, q] of Object.entries(QUESTS)) {
    if (!npcIds.has(q.giver)) err(`Quest ${id}: Auftraggeber ${q.giver} fehlt`);
    if (!effects.some((e) => e.start === id)) err(`Quest ${id}: kein Gespräch startet sie`);
    q.steps.forEach((st, i) => {
      if (st.type === 'talk' && !effects.some((e) => e.advance === id && e.npc === st.npc)) err(`Quest ${id} Schritt ${i}: ${st.npc} schließt ihn in keinem Gespräch ab`);
      if (st.type === 'kill' && !mobTypes.has(st.mob)) err(`Quest ${id} Schritt ${i}: Wesen ${st.mob} lebt nirgends`);
      if (st.type === 'have') item(st.item, `Quest ${id}`);
      if (!['talk', 'kill', 'have', 'action', 'flag'].includes(st.type)) err(`Quest ${id} Schritt ${i}: unbekannte Art ${st.type}`);
    });
    for (const i of Object.keys(q.reward?.items || {})) item(i, `Quest ${id}`);
    if (q.reward?.unlock && !CLASSES[q.reward.unlock]) err(`Quest ${id}: Klasse ${q.reward.unlock} fehlt`);
  }

  // Klassen
  for (const [id, c] of Object.entries(CLASSES)) {
    if (!npcIds.has(c.teacher)) err(`Klasse ${id}: Lehrer ${c.teacher} fehlt`);
    if (ITEMS[c.starter]?.cls !== id) err(`Klasse ${id}: Startwaffe ${c.starter} gehört nicht zur Klasse`);
    if (!QUESTS[c.trial] || QUESTS[c.trial].reward?.unlock !== id) err(`Klasse ${id}: Prüfung ${c.trial} schaltet sie nicht frei`);
    for (const [ab] of c.abilities) if (!ABILITIES[ab]) err(`Klasse ${id}: Fähigkeit ${ab} fehlt`);
    if (!c.abilities.some(([, lv]) => lv === 1)) err(`Klasse ${id}: keine Fähigkeit auf Stufe 1`);
  }

  // Berufe: Lehrer bringt ihn bei, Sammelberufe haben Fundstellen ab Stufe 1, Herstellberufe Station und Rezepte ohne große Lücken.
  for (const [id, pr] of Object.entries(PROFESSIONS)) {
    if (!effects.some((e) => e.learn === id && e.npc === pr.teacher)) err(`Beruf ${id}: ${pr.teacher} bringt ihn in keinem Gespräch bei`);
    const levels = pr.kind === 'gather'
      ? [...new Set(Object.entries(NODES).filter(([nid, n]) => n.prof === id && placedNodes.includes(nid)).map(([, n]) => n.level))]
      : Object.values(RECIPES).filter((r) => r.prof === id).map((r) => r.level);
    if (pr.kind === 'craft' && !stations.has(pr.station)) err(`Beruf ${id}: Station ${pr.station} steht nirgends`);
    if (!levels.includes(1)) err(`Beruf ${id}: nichts auf Stufe 1`);
    const sorted = [...new Set(levels)].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] > 6) err(`Beruf ${id}: Lücke von Stufe ${sorted[i - 1]} bis ${sorted[i]}`);
  }

  // Gegenstände: Fundort und Zweck
  const sources = new Map();
  const add = (id, how) => { item(id, how); sources.set(id, (sources.get(id) || []).concat(how)); };
  for (const [id, r] of Object.entries(RECIPES)) {
    if (!PROFESSIONS[r.prof]) err(`Rezept ${id}: Beruf ${r.prof} fehlt`);
    add(r.out[0], `Rezept ${id}`);
    for (const i of Object.keys(r.inputs)) item(i, `Rezept ${id}`);
  }
  for (const [nid, n] of Object.entries(NODES)) {
    if (!placedNodes.includes(nid)) continue;
    add(n.item, `Fundstelle ${nid}`);
    if (n.extra) add(n.extra[0], `Fundstelle ${nid}`);
  }
  for (const [mid, m] of Object.entries(MOBS)) for (const [i] of m.drops || []) if (mobTypes.has(mid)) add(i, `Beute ${mid}`);
  for (const r of regions) {
    for (const o of r.objects) {
      if (o.type === 'chest') {
        if (!CHESTS[o.chest]) err(`${r.id}: Truhe '${o.chest}' unbekannt`);
        else for (const [i] of CHESTS[o.chest].items) add(i, `Truhe ${o.chest}`);
      }
      if (o.type === 'shrine') {
        add(o.gives, `Schrein in ${r.id}`);
        if (!QUESTS[o.quest]) err(`${r.id}: Schrein gehört zu unbekannter Quest ${o.quest}`);
      }
    }
  }
  for (const [sid, sh] of Object.entries(SHOPS)) for (const i of sh.sells) add(i, `Händler ${sid}`);
  for (const q of Object.values(QUESTS)) for (const i of Object.keys(q.reward?.items || {})) add(i, 'Quest');
  for (const c of Object.values(CLASSES)) add(c.starter, 'Klasse');
  for (const e of effects) for (const i of Object.keys(e.give || {})) add(i, 'Gespräch');

  // Gemeinschaft
  for (const [id, f] of Object.entries(FAVOURS)) {
    if (!npcIds.has(f.from)) err(`Gefallen ${id}: ${f.from} fehlt`);
    if (f.type === 'bring') item(f.item, `Gefallen ${id}`);
    else if (f.type === 'kill' && !mobTypes.has(f.mob)) err(`Gefallen ${id}: Wesen ${f.mob} lebt nirgends`);
    else if (!['bring', 'kill'].includes(f.type)) err(`Gefallen ${id}: unbekannte Art`);
  }
  if (Object.keys(FAVOURS).length < FAVOURS_PER_DAY) err('weniger Gefallen als pro Tag gezogen werden');
  for (const i of Object.keys(BEACON_FUEL)) item(i, 'Brennstoff');
  for (const t of ['board', 'altar', 'beacon']) if (!STATIC_REGIONS.kindle.objects.some((o) => o.type === t)) err(`kindle: ${t} fehlt`);
  if (!Array.isArray(BALLOT.options) || BALLOT.options.length < 2) err('Stimmzettel braucht mindestens zwei Ideen');
  for (const o of BALLOT.options) {
    if (!/^[a-z0-9-]{1,32}$/.test(o.id)) err(`Stimmzettel: ID ${o.id} ungültig`);
    if (!o.text || o.text.length > 90) err(`Stimmzettel ${o.id}: Text fehlt oder länger als 90 Zeichen`);
  }
  CHRONICLE.forEach((c, i) => { if (c.day !== i) err(`Chronik: Eintrag ${i} hat day ${c.day} (lückenlos von 0 zählen)`); });

  const purposes = new Set();
  for (const f of Object.values(FAVOURS)) if (f.type === 'bring') purposes.add(f.item);
  for (const i of Object.keys(BEACON_FUEL)) purposes.add(i);
  for (const r of Object.values(RECIPES)) for (const i of Object.keys(r.inputs)) purposes.add(i);
  for (const q of Object.values(QUESTS)) for (const st of q.steps) if (st.type === 'have') purposes.add(st.item);
  for (const [id, def] of Object.entries(ITEMS)) {
    if (!sources.has(id)) err(`Gegenstand ${id} hat keinen Fundort (Rezept, Fundstelle, Beute, Händler, Quest)`);
    if (!def.slot && !def.use && !purposes.has(id)) err(`Gegenstand ${id} hat keinen Zweck (anlegen, benutzen, Rezept, Quest)`);
    if (def.slot === 'main' && !CLASSES[def.cls]) err(`Waffe ${id}: Klasse ${def.cls} fehlt`);
  }
}

for (const [name, s] of Object.entries(SPRITES)) {
  const rows = [s.rows, ...(s.frames || [])];
  for (const r of rows) if (new Set(r.map((x) => x.length)).size > 1) errors.push(`Sprite ${name}: Reihen unterschiedlich lang`);
  for (const r of [...s.rows, ...(s.walk || []), ...(s.frames || []).flat()]) {
    for (const ch of r) if (ch !== '.' && !s.palette[ch]) errors.push(`Sprite ${name}: Zeichen '${ch}' fehlt in der Palette`);
  }
}

const regions = Object.values(STATIC_REGIONS);
for (const r of regions) check(r);
// Der Drift wird jeden Tag neu gewürfelt: mehrere Tage prüfen.
for (const d of ['2026-11-10', '2026-11-11', '2026-12-24', '2027-01-01', '2027-03-15', '2027-07-04']) check(regionFor('drift', d));
checkContent([...regions, regionFor('drift', '2026-11-10')]);
if (errors.length) {
  console.error(errors.map((e) => `FEHLER ${e}`).join('\n'));
  process.exit(1);
}
console.log('Welt in Ordnung.');
