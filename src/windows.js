// Fenster: CHARACTER, BAG, QUESTS, Herstellen (an einer Station), Händler, Tasten.
// Immer nur eines ist offen. Sie zeichnen sich neu, wenn der Server einen neuen Charakterstand schickt.
// Alles wird mit DOM-Funktionen gebaut, Texte nur über textContent.

import { ITEMS, SLOTS, SLOT_NAMES, BAG_SIZE } from '../content/items.js';
import { CLASSES, WANDERER, UNLOCK_LEVEL, SPEC_LEVEL } from '../content/classes.js';
import { ABILITIES } from '../content/abilities.js';
import { PROFESSIONS, MAX_PROFESSIONS } from '../content/professions.js';
import { QUESTS } from '../content/quests.js';
import { RECIPES } from '../content/recipes.js';
import { SHOPS, buyPrice } from '../content/shops.js';
import { allNpcs } from '../content/regions/index.js';
import { xpForLevel } from '../shared/player.js';
import { keyLabel } from './ui.js';
import { iconEl, spriteURL } from './icons.js';
import { describeAbility } from '../shared/describe.js';
import { makeDraggable, hasSaved, resetLayout, forget } from './drag.js';
import { FAVOURS, BEACON_FUEL, BEACON_GOAL } from '../content/dailies.js';
import { BALLOT } from '../content/ballot.js';
import { CHRONICLE } from '../content/chronicle.js';
import { favoursFor, PRAYER_MAX } from '../shared/community.js';
import { TILE_TYPES } from '../content/tiles.js';
import { STASH_SIZE, INN } from '../content/tavern.js';

const $ = (id) => document.getElementById(id);

// Kleiner Baukasten: h('div', { class: 'x', onclick }, 'Text', kind, …)
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(typeof kid === 'string' || typeof kid === 'number' ? String(kid) : kid);
  }
  return el;
}
const btn = (label, onclick, attrs = {}) => h('button', { type: 'button', onclick, ...attrs }, label);
// Fensterüberschrift in Frakturschrift: Großbuchstaben nur am Wortanfang, " // " wird zum Mittelpunkt.
const titleCase = (s) => String(s).toLowerCase().replace(/\s*\/\/\s*/g, ' · ').replace(/(^|[\s(\-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase());
const npcName = (id) => allNpcs().find((n) => n.id === id)?.name ?? id;

function xpLine(level, xp) {
  const lo = xpForLevel(level);
  const hi = xpForLevel(level + 1);
  const frac = Math.max(0, Math.min(1, (xp - lo) / Math.max(1, hi - lo)));
  return h('div', { class: 'bar' }, h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill xp', style: `width:${(frac * 100).toFixed(1)}%` })), h('span', {}, `${xp - lo}/${hi - lo}`));
}

export function createWindows(handlers) {
  // Mehrere Fenster gleichzeitig: pro Art ein eigener Rahmen.
  // focused = das zuletzt angeklickte (Escape schließt es).
  const wins = new Map(); // kind -> { kind, opts, el, title, body }
  let focused = null;
  let zTop = 40;
  let state = null;
  let community = { beacon: 0, ballot: {} };
  let date = '';
  let top = null;
  let prayerDraft = '';
  // Tabs in Fenstern (Quests: aktiv/erledigt, Notice Board: Gefallen/Bestenliste). Gewählter Tab pro Fensterart.
  const tabOf = {};
  function tabBar(kind, list) {
    const cur = list.some(([id]) => id === tabOf[kind]) ? tabOf[kind] : list[0][0];
    const bar = h('div', { class: 'win-tabs', role: 'tablist' }, list.map(([id, label]) =>
      h('button', { type: 'button', class: `win-tab${id === cur ? ' on' : ''}`, role: 'tab', 'aria-selected': String(id === cur),
        onclick: () => { tabOf[kind] = id; handlers.click?.(); render(); } }, label)));
    return [cur, bar];
  }
  // „A Note for the Maker“: Entwurf, Art und Rückmeldung bleiben beim Neuzeichnen erhalten.
  const note = { kind: 'bug', text: '', sending: false, msg: null, ok: false };

  function makeWin(kind) {
    const title = h('span', { class: 'panel-title' });
    const head = h('h2', { class: 'wtitle panel-head' }, title,
      h('button', { type: 'button', class: 'close', 'aria-label': 'Close', onclick: () => close(kind) }, '×'));
    const body = h('div', { class: 'panel-body' });
    const el = h('section', { class: 'window panel', 'data-kind': kind, 'aria-live': 'polite' }, head, body);
    document.body.append(el);
    const w = { kind, opts: {}, el, title, body };
    el.addEventListener('pointerdown', () => focus(w), true);
    makeDraggable(el, `win:${kind}`, head);
    // Ohne gespeicherte Lage: neue Fenster leicht versetzt, damit sie sich nicht genau verdecken.
    if (!hasSaved(`win:${kind}`)) {
      const n = wins.size;
      if (n > 0) el.style.setProperty('--stack', String(n));
    }
    return w;
  }

  function focus(w) {
    if (focused === w && w.el.style.zIndex) return;
    focused = w;
    w.el.style.zIndex = String(++zTop);
  }
  function syncButtons() {
    for (const b of document.querySelectorAll('.menubar button[data-win]')) b.classList.toggle('on', wins.has(b.dataset.win));
  }

  function open(kind, opts = {}) {
    let w = wins.get(kind);
    if (!w) {
      handlers.click?.();
      w = makeWin(kind);
      wins.set(kind, w);
    }
    w.opts = opts;
    focus(w);
    renderOne(w);
    syncButtons();
  }
  // close(kind): ein Fenster; close(): das oberste (Escape)
  function close(kind) {
    const w = kind ? wins.get(kind) : focused && wins.has(focused.kind) ? focused : [...wins.values()].pop();
    if (!w) return;
    // Handel schließen = Handel abbrechen (der Server ignoriert es, wenn er schon vorbei ist)
    if (w.kind === 'trade') handlers.tradeCancel?.();
    w.el.remove();
    forget(`win:${w.kind}`);
    wins.delete(w.kind);
    if (focused === w) focused = [...wins.values()].sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex))[0] ?? null;
    syncButtons();
  }
  function closeAll() {
    for (const k of [...wins.keys()]) close(k);
  }
  function toggle(kind) {
    if (wins.has(kind)) close(kind);
    else open(kind);
  }
  function setState(s) {
    state = s;
    render();
  }
  function setCommunity(c, d) {
    community = c;
    if (d) date = d;
    for (const k of ['board', 'beacon', 'altar']) if (wins.has(k)) renderOne(wins.get(k));
  }

  // Alle offenen Fenster neu zeichnen
  function render() {
    for (const w of wins.values()) renderOne(w);
  }
  function renderOne(w) {
    const r = RENDER[w.kind];
    if (!r) { close(w.kind); return; }
    const scroll = w.body.scrollTop;
    const focusedId = document.activeElement?.id;
    const { heading, content } = r(w.opts);
    w.title.textContent = titleCase(heading);
    w.body.replaceChildren(...[content].flat(Infinity).filter(Boolean));
    w.body.scrollTop = scroll;
    if (focusedId === 'prayer-text') $('prayer-text')?.focus();
    if (focusedId === 'note-text') $('note-text')?.focus();
  }

  // ---------- Gegenstände ----------
  function itemCell(slot, i, extra = {}) {
    if (!slot) return h('button', { type: 'button', class: 'cell empty', disabled: true, 'aria-label': 'empty' }, '·');
    const def = ITEMS[slot.id];
    const cell = h('button', {
      type: 'button',
      class: 'cell',
      'data-item': slot.id,
      'data-hint': extra.hint ?? (def.slot ? 'Click: wear. Right-click: more.' : def.use ? 'Click: use. Right-click: more.' : 'Right-click: more.'),
      onclick: () => (extra.onclick ? extra.onclick(i, slot) : handlers.use(i)),
      oncontextmenu: (e) => { e.preventDefault(); itemMenu(e.clientX, e.clientY, i, slot); },
    }, iconEl('item', slot.id, def.glyph), slot.n > 1 ? h('span', { class: 'count' }, slot.n) : null);
    longPress(cell, (x, y) => itemMenu(x, y, i, slot));
    return cell;
  }

  function itemMenu(x, y, i, slot) {
    const def = ITEMS[slot.id];
    const entries = [];
    if (def.slot) entries.push({ verb: def.slot === 'main' ? 'Hold' : 'Wear', noun: def.name, fn: () => handlers.use(i) });
    if (def.use) {
      entries.push({ verb: 'Use', noun: def.name, fn: () => handlers.use(i) });
      entries.push({ verb: 'Put on bar', noun: def.name, fn: () => handlers.assign(`item:${slot.id}`, def.name) });
    }
    const shopWin = wins.get('shop');
    if (shopWin && def.value) entries.push({ verb: 'Sell', noun: def.name, fn: () => handlers.sell(shopWin.opts.shop, i, 1) });
    entries.push({ verb: 'Examine', noun: def.name, fn: () => handlers.log(`${def.name}. ${def.text}`, 'sys') });
    entries.push({ verb: 'Drop', noun: def.name, fn: () => handlers.drop(i) });
    entries.push({ verb: 'Cancel' });
    handlers.menu(x, y, entries);
  }

  function longPress(el, fn) {
    let timer = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      timer = setTimeout(() => { timer = null; fn(e.clientX, e.clientY); }, 450);
    });
    const stop = () => clearTimeout(timer);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointerleave', stop);
  }

  function beaconBar() {
    const frac = Math.min(1, community.beacon / BEACON_GOAL);
    return h('div', { class: 'bar fuel' }, h('span', { class: 'bar-label' }, 'FIRE'), h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: `width:${(frac * 100).toFixed(1)}%` })), h('span', {}, `${community.beacon}/${BEACON_GOAL}`));
  }

  function bagGrid(onclick) {
    const cells = [];
    for (let i = 0; i < BAG_SIZE; i++) cells.push(itemCell(state.bag[i], i, { onclick }));
    return h('div', { class: 'grid' }, cells);
  }


  // ---------- Karte (Taste M) ----------
  // Grund aus dem Gelände, einmal pro Gebiet gezeichnet; darüber Gebäude, Feuer, Türen, Figuren und man selbst.
  // Ein Tipp auf die Karte schickt die Figur dorthin.
  const MAP_PX = 300;
  let mapBase = null;
  const OBJ_COLOR = { beacon: '#ffb347', campfire: '#ff8a3a', signal: '#ff8a3a', brazier: '#ff8a3a', door: '#9fe0ff', station: '#c8a040', board: '#e8dcc0', altar: '#e8dcc0', stall: '#c86a8a', shrine: '#b0d0a0', chest: '#c8a040', lookout: '#ffcf70' };
  function mapBaseFor(region) {
    const key = `${region.id}:${region.date ?? ''}`;
    if (mapBase?.key === key) return mapBase;
    const H = region.tiles.length;
    const W = region.tiles[0].length;
    const s = Math.max(2, Math.floor(MAP_PX / Math.max(W, H)));
    const c = document.createElement('canvas');
    c.width = W * s;
    c.height = H * s;
    const g = c.getContext('2d');
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = TILE_TYPES[region.tiles[y][x]];
        g.fillStyle = t?.object === 'tree' ? '#2f5a34' : t?.object === 'rock' ? '#7a6a58' : t?.color ?? '#050403';
        g.fillRect(x * s, y * s, s, s);
      }
    }
    // Gegenden beschriften (Mitte aller Felder mit demselben Namen)
    const labels = [];
    if (region.zoneAt) {
      const acc = new Map();
      for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
        const z = region.zoneAt(x, y);
        if (!z) continue;
        const a = acc.get(z) || { x: 0, y: 0, n: 0 };
        a.x += x; a.y += y; a.n++;
        acc.set(z, a);
      }
      for (const [name, a] of acc) labels.push({ name, x: a.x / a.n, y: a.y / a.n });
    }
    mapBase = { key, canvas: c, s, W, H, labels };
    return mapBase;
  }

  function mapCanvas(d) {
    const base = mapBaseFor(d.region);
    const { s, W, H } = base;
    const c = h('canvas', { class: 'map-canvas', width: W * s, height: H * s, 'aria-label': 'Map. Tap to walk there.' });
    const g = c.getContext('2d');
    g.drawImage(base.canvas, 0, 0);
    for (const o of d.objects) {
      const big = o.inside || ['house', 'chapel', 'workshop', 'tavern'].includes(o.type);
      if (big) { g.fillStyle = '#5a3a26'; g.fillRect(o.x * s, o.y * s, o.w * s, o.d * s); continue; }
      const col = OBJ_COLOR[o.type];
      if (!col) continue;
      g.globalAlpha = (o.type === 'signal' || o.type === 'brazier') && !o.lit ? 0.45 : 1;
      g.fillStyle = col;
      g.fillRect(o.x * s - 1, o.y * s - 1, o.w * s + 2, o.d * s + 2);
      g.globalAlpha = 1;
    }
    g.font = `${Math.max(10, s * 4)}px VT323, monospace`;
    g.textAlign = 'center';
    g.fillStyle = 'rgba(255, 236, 200, 0.75)';
    for (const l of base.labels) g.fillText(l.name, l.x * s, l.y * s);
    for (const e of d.ents) {
      if (e.kind === 'mob') continue;
      const me = e.id === d.you;
      if (e.kind === 'player' && !me) { g.fillStyle = '#9fe0ff'; g.fillRect(e.x * s - 1, e.y * s - 1, s + 2, s + 2); continue; }
      if (me) continue;
      g.fillStyle = '#ffe08a';
      g.fillRect(e.x * s - 1, e.y * s - 1, s + 2, s + 2);
      const mark = d.markers.get(e.id);
      if (mark) {
        g.fillStyle = mark === '?' ? '#9fe0ff' : '#ffd23a';
        g.fillText(mark, e.x * s + s / 2, e.y * s - 2);
      }
    }
    // Unending Maze: Unbekanntes bleibt schwarz (die Karte zeichnet man selbst, beim Laufen).
    if (d.seen) {
      g.fillStyle = '#050403';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!d.seen.has(`${x},${y}`)) g.fillRect(x * s, y * s, s, s);
    }
    const self = d.ents.find((e) => e.id === d.you);
    if (self) {
      const r = s * 2;
      g.fillStyle = '#ffffff';
      g.strokeStyle = '#000000';
      g.lineWidth = 2;
      g.strokeRect(self.x * s - r / 2, self.y * s - r / 2, r + s, r + s);
      g.fillRect(self.x * s - r / 2, self.y * s - r / 2, r + s, r + s);
    }
    c.addEventListener('click', (ev) => {
      const rect = c.getBoundingClientRect();
      const x = Math.floor(((ev.clientX - rect.left) / rect.width) * W);
      const y = Math.floor(((ev.clientY - rect.top) / rect.height) * H);
      if (x >= 0 && y >= 0 && x < W && y < H) handlers.walk(x, y);
    });
    return c;
  }

  // ---------- Fenster ----------
  const RENDER = {
    char() {
      const s = state;
      if (!s) return { heading: 'CHARACTER', content: h('p', {}, '...') };
      const active = s.cls && CLASSES[s.cls];
      const def = active || WANDERER;
      const lvl = active ? s.classes[s.cls].level : 1;
      const me = handlers.me();
      const portrait = h('img', { class: 'portrait', src: spriteURL(active ? `player_${s.cls}` : 'player'), alt: '', draggable: 'false' });

      // Kopf: Porträt, Klasse, Stufe, Erfahrung
      const top = h('div', { class: 'char-top' },
        h('div', { class: 'portrait-frame' }, portrait),
        h('div', { class: 'char-id' },
          h('div', { class: 'char-class' }, def.name),
          h('div', { class: 'muted small' }, `Level ${lvl}${def.role ? ` · ${def.role.toLowerCase()}` : ''}`),
          active ? h('div', { class: 'small spec-line' }, s.specs?.[s.cls] && active.specs?.[s.specs[s.cls]]
            ? `Path: ${active.specs[s.specs[s.cls]].name}`
            : lvl >= SPEC_LEVEL ? `A path awaits: talk to ${npcName(active.teacher)}.` : `Choose a path at level ${SPEC_LEVEL}.`) : null,
          active ? xpLine(lvl, s.classes[s.cls].xp) : h('div', { class: 'muted small' }, 'No calling yet.')));

      // Werte
      const stat = (label, value) => h('div', { class: 'stat' }, h('span', { class: 'muted' }, label), h('span', {}, String(value)));
      const stats = h('div', { class: 'stats' },
        stat('Max HP', me ? me.maxHp : '-'),
        stat('Power', s.power),
        stat('Defence', s.defence),
        stat('Gold', s.gold),
        s.rested ? stat('Rested', `${s.rested} fights +${Math.round(INN.bonus * 100)}%`) : null,
        // Unending Maze: bis zu welchem Stockwerk die Treppen offen sind
        (s.mazeDeep ?? 1) > 1 ? stat('Maze', `down to turn ${s.mazeDeep}`) : null);

      // Ausrüstung als Icons; Klick legt ab
      const gear = h('div', { class: 'gear' }, SLOTS.map((slot) => {
        const id = s.equip[slot];
        const it = id && ITEMS[id];
        const cell = it
          ? h('button', { type: 'button', class: 'cell', 'data-item': id, 'data-hint': slot === 'main' ? 'Hold another weapon to switch.' : 'Click to take off.', onclick: () => handlers.unequip(slot) }, iconEl('item', id, it.glyph))
          : h('button', { type: 'button', class: 'cell empty', disabled: true, title: `${SLOT_NAMES[slot]}: nothing` }, '·');
        return h('div', { class: 'gear-slot' }, cell, h('span', { class: 'gear-label' }, it ? it.name : SLOT_NAMES[slot]));
      }));

      const classRows = Object.entries(CLASSES).map(([id, c]) => {
        const lv = s.classes[id];
        const status = lv ? `Lv ${lv.level}` : `locked · ${npcName(c.teacher)}, Lv ${UNLOCK_LEVEL}`;
        return h('li', { class: `calling ${id === s.cls ? 'on' : lv ? '' : 'dim'}` },
          h('img', { class: 'mini', src: spriteURL(`player_${id}`), alt: '', draggable: 'false' }),
          h('span', {}, c.name), h('span', { class: 'muted small' }, ` ${c.role.toLowerCase()}`), h('span', { class: 'right small' }, status));
      });
      const abilities = active ? active.abilities.map(([ab, need]) => {
        const a = ABILITIES[ab];
        const known = s.classes[s.cls].level >= need;
        const onBar = s.bar.includes(ab);
        const d = describeAbility(ab);
        return h('li', { class: `ability-row ${known ? '' : 'dim'}`, 'data-ability': ab },
          h('div', {}, iconEl('ability', ab, a.glyph, 'icon small'), ` ${a.name} `,
            known ? (onBar ? h('span', { class: 'muted' }, 'on bar') : btn('To bar', () => handlers.assign(ab, a.name))) : h('span', { class: 'muted' }, `Lv ${need}`)),
          h('div', { class: 'ability-desc' }, d.effect),
          h('div', { class: 'ability-cost' }, d.cost));
      }) : [h('li', { class: 'muted' }, 'Choose a calling with Warden Ama by the Beacon.')];
      const profRows = Object.entries(s.profs).map(([id, pr]) => h('li', {}, `${PROFESSIONS[id].name} · Lv ${pr.level}`, xpLine(pr.level, pr.xp)));
      const free = MAX_PROFESSIONS - Object.keys(s.profs).length;
      return {
        heading: 'CHARACTER',
        content: [
          top,
          stats,
          h('h3', {}, 'WORN'),
          gear,
          h('h3', {}, `ABILITIES${active ? ` // ${active.name.toUpperCase()}` : ''}`),
          h('ul', { class: 'rows' }, abilities),
          h('h3', {}, 'CALLINGS'),
          h('ul', { class: 'rows' }, classRows),
          h('p', { class: 'muted small' }, 'Switch by holding a calling\'s weapon in Kindle. Nothing you learn is lost.'),
          h('h3', {}, `TRADES (${Object.keys(s.profs).length}/${MAX_PROFESSIONS})`),
          h('ul', { class: 'rows' }, profRows.length ? profRows : [h('li', { class: 'muted' }, 'None yet.')]),
          free > 0 ? h('p', { class: 'muted small' }, 'Teachers: Rook (Salvage, Tinkering), Tallow (Foraging, Alchemy), Fen (Cartography), Wren (Lampwright).') : null,
          h('div', { class: 'row-buttons' }, btn('Keys', () => open('keys')), handlers.online() ? btn('Leave Kindle', () => { closeAll(); handlers.leave(); }) : null),
        ],
      };
    },

    settings() {
      const pct = Math.round(handlers.scale() * 100);
      const crt = handlers.crt();
      return {
        heading: 'SETTINGS',
        content: [
          h('h3', {}, 'INTERFACE SIZE'),
          h('div', { class: 'setting' },
            h('button', { type: 'button', class: 'plaque', 'aria-label': 'Smaller', onclick: () => { handlers.setScale(handlers.scale() - 0.1); render(); } }, '−'),
            h('output', { class: 'scale-out' }, `${pct}%`),
            h('button', { type: 'button', class: 'plaque', 'aria-label': 'Bigger', onclick: () => { handlers.setScale(handlers.scale() + 0.1); render(); } }, '+'),
            pct !== 100 ? btn('Reset', () => { handlers.setScale(1); render(); }) : null),
          h('p', { class: 'muted small' }, 'The interface also grows and shrinks with the browser window.'),
          h('h3', {}, 'SOUND EFFECTS'),
          h('div', { class: 'setting' },
            h('button', { type: 'button', class: 'plaque', 'aria-label': 'Quieter', onclick: () => { handlers.setVolume(handlers.volume() - 0.1); render(); } }, '−'),
            h('output', { class: 'scale-out' }, handlers.volume() > 0 ? `${Math.round(handlers.volume() * 100)}%` : 'Off'),
            h('button', { type: 'button', class: 'plaque', 'aria-label': 'Louder', onclick: () => { handlers.setVolume(handlers.volume() + 0.1); render(); } }, '+')),
          h('h3', {}, 'MUSIC'),
          h('div', { class: 'setting' },
            h('button', { type: 'button', class: 'plaque', 'aria-label': 'Music quieter', onclick: () => { handlers.setMusic(handlers.music() - 0.1); render(); } }, '−'),
            h('output', { class: 'scale-out' }, handlers.music() > 0 ? `${Math.round(handlers.music() * 100)}%` : 'Off'),
            h('button', { type: 'button', class: 'plaque', 'aria-label': 'Music louder', onclick: () => { handlers.setMusic(handlers.music() + 0.1); render(); } }, '+')),
          h('h3', {}, 'PICTURE'),
          h('div', { class: 'setting' },
            h('span', {}, 'CRT filter'),
            h('button', { type: 'button', class: `plaque toggle${crt ? ' on' : ''}`, 'aria-pressed': String(crt), onclick: () => { handlers.setCrt(!handlers.crt()); render(); } }, crt ? 'On' : 'Off')),
          h('h3', {}, 'LAYOUT'),
          h('p', { class: 'muted small' }, 'Drag windows by their title, the bar by the health frame, the menu by its dots. Resize any part at its lower right corner (double-click: 100%).'),
          h('div', { class: 'row-buttons' }, btn('Reset layout', () => { resetLayout(); handlers.click?.(); })),
          h('h3', {}, 'CONTROLS'),
          h('div', { class: 'row-buttons' }, btn('Change keys', () => open('keys'))),
        ],
      };
    },

    // Die eigene Truhe in der Taverne (shared/stash.js). Oben die Truhe, unten der Beutel.
    stash() {
      if (!state) return { heading: 'YOUR CHEST', content: h('p', {}, '...') };
      const row = (slot, i, from) => {
        const it = ITEMS[slot.id];
        const op = from === 'stash' ? 'take' : 'put';
        return h('li', { 'data-item': slot.id }, iconEl('item', slot.id, it.glyph, 'icon small'), ` ${it.name}${slot.n > 1 ? ` x${slot.n}` : ''} `,
          btn(op === 'take' ? 'TAKE' : 'STORE', () => handlers.stash(op, i, 1)),
          slot.n > 1 ? btn('ALL', () => handlers.stash(op, i, slot.n)) : null);
      };
      const chest = (state.stash || []).map((s, i) => row(s, i, 'stash'));
      const bag = state.bag.map((s, i) => (s ? row(s, i, 'bag') : null)).filter(Boolean);
      return {
        heading: `YOUR CHEST // ${chest.length}/${STASH_SIZE}`,
        content: [
          h('h3', {}, 'IN THE CHEST'),
          h('ul', { class: 'rows' }, chest.length ? chest : [h('li', { class: 'muted' }, 'Empty. Hollis dusted it for you.')]),
          h('h3', {}, 'IN YOUR BAG'),
          h('ul', { class: 'rows' }, bag.length ? bag : [h('li', { class: 'muted' }, 'Your bag is empty.')]),
          h('p', { class: 'muted small' }, 'Every chest in the Lantern & Lark opens to your own things.'),
        ],
      };
    },

    bag() {
      if (!state) return { heading: 'BAG', content: h('p', {}, '...') };
      return {
        heading: `BAG // ${state.gold} GOLD`,
        content: [
          bagGrid(),
          h('p', { class: 'muted small' }, 'Click: use or wear. Right-click / hold: more (put on bar, drop).'),
        ],
      };
    },

    quests() {
      if (!state) return { heading: 'QUESTS', content: h('p', {}, '...') };
      const active = [];
      const done = [];
      for (const [id, q] of Object.entries(state.quests)) {
        const def = QUESTS[id];
        if (!def) continue;
        if (q.done) { done.push(h('li', { class: 'muted' }, `+ ${def.name}`)); continue; }
        const step = def.steps[q.step];
        const progress = step.type === 'kill' ? ` (${q.n}/${step.n})` : '';
        active.push(h('li', { class: 'quest' }, h('strong', {}, def.name), h('div', { class: 'muted small' }, `${def.text} (${npcName(def.giver)})`), h('div', {}, `> ${step.text}${progress}`)));
      }
      const [tab, bar] = tabBar('quests', [['active', `Active (${active.length})`], ['done', `Done (${done.length})`]]);
      return {
        heading: 'QUESTS',
        content: [
          bar,
          tab === 'active'
            ? h('ul', { class: 'rows' }, active.length ? active : [h('li', { class: 'muted' }, 'Nothing on your mind. People in Kindle might change that.')])
            : h('ul', { class: 'rows' }, done.length ? done : [h('li', { class: 'muted' }, 'Nothing finished yet.')]),
        ],
      };
    },

    craft({ obj, station }) {
      const prof = Object.entries(PROFESSIONS).find(([, p]) => p.station === station);
      const [profId, def] = prof;
      const heading = `${def.name.toUpperCase()} // ${station.toUpperCase()}`;
      if (!state) return { heading, content: h('p', {}, '...') };
      const known = state.profs[profId];
      const count = (id) => state.bag.reduce((s, x) => s + (x && x.id === id ? x.n : 0), 0);
      const rows = Object.entries(RECIPES).filter(([, r]) => r.prof === profId).map(([rid, r]) => {
        const out = ITEMS[r.out[0]];
        const canLevel = known && known.level >= r.level;
        const inputs = Object.entries(r.inputs).map(([id, n]) => `${ITEMS[id].name} ${count(id)}/${n}`).join(', ');
        const enough = Object.entries(r.inputs).every(([id, n]) => count(id) >= n);
        return h('li', { class: canLevel ? '' : 'dim', 'data-item': r.out[0] },
          h('div', {}, iconEl('item', r.out[0], out.glyph, 'icon small'), ` ${out.name}${r.out[1] > 1 ? ` x${r.out[1]}` : ''} `, h('span', { class: 'muted' }, `LV ${r.level}`)),
          h('div', { class: 'muted small' }, inputs),
          canLevel ? h('div', { class: 'row-buttons' },
            btn('MAKE', () => handlers.craft(obj, rid, 1), { disabled: !enough }),
            btn('x5', () => handlers.craft(obj, rid, 5), { disabled: !enough })) : null);
      });
      return {
        heading,
        content: [
          known ? h('p', {}, `${def.name} LV ${known.level}`, xpLine(known.level, known.xp))
            : h('p', { class: 'muted' }, `You do not know ${def.name.toLowerCase()}. ${npcName(def.teacher)} teaches it.`),
          h('ul', { class: 'rows' }, rows),
        ],
      };
    },

    shop({ shop, stock }) {
      const s = SHOPS[shop];
      if (!state) return { heading: s.name.toUpperCase(), content: h('p', {}, '...') };
      const buy = (stock || s.sells).filter((id) => ITEMS[id]).map((id) => {
        const it = ITEMS[id];
        const price = buyPrice(it.value);
        return h('li', { 'data-item': id }, iconEl('item', id, it.glyph, 'icon small'), ` ${it.name} `, h('span', { class: 'muted' }, `${price}G `),
          btn('BUY', () => handlers.buy(shop, id, 1), { disabled: state.gold < price }),
          it.stack ? btn('x5', () => handlers.buy(shop, id, 5), { disabled: state.gold < price * 5 }) : null);
      });
      const sell = state.bag.map((slot, i) => {
        if (!slot || !ITEMS[slot.id].value) return null;
        const it = ITEMS[slot.id];
        const price = Math.max(1, Math.floor(it.value / 2));
        return h('li', { 'data-item': slot.id }, iconEl('item', slot.id, it.glyph, 'icon small'), ` ${it.name}${slot.n > 1 ? ` x${slot.n}` : ''} `, h('span', { class: 'muted' }, `${price}G `),
          btn('SELL', () => handlers.sell(shop, i, 1)),
          slot.n > 1 ? btn('ALL', () => handlers.sell(shop, i, slot.n)) : null);
      }).filter(Boolean);
      return {
        heading: `${s.name.toUpperCase()} // ${state.gold} GOLD`,
        content: [
          h('h3', {}, 'BUY'), h('ul', { class: 'rows' }, buy),
          h('h3', {}, 'SELL'), h('ul', { class: 'rows' }, sell.length ? sell : [h('li', { class: 'muted' }, 'Nothing Marrow wants.')]),
        ],
      };
    },

    board() {
      const d = state?.daily && state.daily.date === date ? state.daily : { kills: {}, done: [] };
      const favours = favoursFor(date).map((id) => {
        const f = FAVOURS[id];
        const done = d.done.includes(id);
        const have = f.type === 'bring' && state ? state.bag.reduce((s, x) => s + (x && x.id === f.item ? x.n : 0), 0) : 0;
        const progress = f.type === 'kill' ? `${Math.min(f.n, d.kills[id] || 0)}/${f.n}` : `${Math.min(f.n, have)}/${f.n} ${ITEMS[f.item].name}`;
        return h('li', { class: done ? 'dim' : 'quest' },
          h('div', {}, done ? '+ ' : '> ', f.text),
          h('div', { class: 'muted small' }, `${npcName(f.from)} // ${done ? 'DONE' : progress} // ${f.reward.gold}G`),
          !done && f.type === 'bring' ? btn('HAND IN', () => handlers.favour(id), { disabled: have < f.n }) : null);
      });
      const [tab, bar] = tabBar('board', [['today', 'Favours'], ['brave', 'The Brave']]);
      if (tab === 'brave' && top === null && handlers.online()) handlers.fetchBoard().then((t) => { top = t; render(); }).catch(() => { top = []; });
      const ranks = (top || []).map((r, i) => h('li', {}, `${String(i + 1).padStart(2)}. ${r.name}  LV ${r.level}`));
      return {
        heading: 'NOTICE BOARD',
        content: tab === 'today' ? [
          bar,
          h('h3', {}, 'FAVOURS TODAY'),
          h('ul', { class: 'rows' }, favours),
          h('p', { class: 'muted small' }, 'New favours every midnight. Kills count by themselves; bring the rest here.'),
          h('h3', {}, 'THE BEACON'),
          beaconBar(),
        ] : [
          bar,
          h('h3', {}, 'THE BRAVE'),
          handlers.online()
            ? h('ul', { class: 'rows mono' }, ranks.length ? ranks : [h('li', { class: 'muted' }, top === null ? 'Reading...' : 'Nobody yet.')])
            : h('p', { class: 'muted' }, 'Offline: the list lives in Kindle.'),
        ],
      };
    },

    beacon() {
      const fuels = Object.entries(BEACON_FUEL).map(([id, pts]) => {
        const it = ITEMS[id];
        const n = state ? state.bag.reduce((s, x) => s + (x && x.id === id ? x.n : 0), 0) : 0;
        return h('li', { 'data-item': id }, iconEl('item', id, it.glyph, 'icon small'), ` ${it.name} x${n} `, h('span', { class: 'muted' }, `(+${pts} each) `),
          btn('GIVE 1', () => handlers.feed(id, 1), { disabled: n < 1 }), btn('ALL', () => handlers.feed(id, n), { disabled: n < 1 }));
      });
      return {
        heading: 'THE BEACON',
        content: [
          h('p', {}, 'Everyone in Kindle feeds the same fire. If it blazes by midnight, the Grey has to step back further tonight.'),
          beaconBar(),
          h('ul', { class: 'rows' }, fuels),
          h('p', { class: 'muted small' }, 'Lamp oil from alchemists or Marrow, wax from foragers, wisps from Greylings.'),
        ],
      };
    },

    altar() {
      const d = state?.daily && state.daily.date === date ? state.daily : { voted: null, prayed: false };
      const total = Object.values(community.ballot).reduce((a, b) => a + b, 0) || 1;
      const options = BALLOT.options.map((o) => {
        const n = community.ballot[o.id] || 0;
        const mine = d.voted === o.id;
        return h('li', { class: `quest${mine ? ' on' : ''}` }, h('div', {}, o.text),
          h('div', { class: 'bar' }, h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill xp', style: `width:${(n / total) * 100}%` })), h('span', {}, `${n} ${n === 1 ? 'voice' : 'voices'}`)),
          mine ? h('div', { class: 'small' }, 'Your voice today.')
            : h('div', { class: 'row-buttons' }, btn('Vote', () => handlers.vote(o.id), { disabled: !state || !!d.voted })));
      });
      const area = h('textarea', { id: 'prayer-text', maxlength: PRAYER_MAX, rows: 3, placeholder: 'What is the world missing?', oninput: (e) => { prayerDraft = e.target.value; } });
      area.value = prayerDraft;
      return {
        heading: 'THE ALTAR',
        content: [
          h('h3', {}, 'PRAY'),
          d.prayed ? h('p', { class: 'muted' }, 'You prayed today. Come back tomorrow. If the Nightwright builds your idea, you will hear of it.')
            : [h('p', { class: 'muted small' }, 'Say what Kindle is missing: a place, a creature, a trade, a story. One prayer a day. Only the Nightwright reads it.'),
              area,
              h('div', { class: 'row-buttons' }, btn('PRAY', () => { if (handlers.pray(prayerDraft)) { prayerDraft = ''; render(); } }, { disabled: !handlers.online() }))],
          !handlers.online() ? h('p', { class: 'muted small' }, 'Offline: prayers need the line to Kindle.') : null,
          h('p', { class: 'muted small' }, 'Something broken, too hard, too easy? Leave a note for the maker instead.'),
          h('div', { class: 'row-buttons' }, btn('A NOTE FOR THE MAKER', () => open('feedback'))),
          h('h3', {}, d.voted ? 'VOTE // DONE TODAY' : 'VOTE // ONE VOICE A DAY'),
          h('p', { class: 'muted small' }, 'Everyone has one voice a day, rich or poor. The idea with the most voices is built next.'),
          h('ul', { class: 'rows' }, options),
        ],
      };
    },

    feedback() {
      const KINDS = [['bug', 'Something is broken'], ['balance', 'Too hard / too easy'], ['idea', 'An idea'], ['other', 'Something else']];
      const area = h('textarea', { id: 'note-text', maxlength: 1000, rows: 5, placeholder: 'What should the maker fix or change? Where were you, what happened?', oninput: (e) => { note.text = e.target.value; } });
      area.value = note.text;
      const send = async () => {
        if (note.sending) return;
        if (note.text.trim().length < 5) { note.msg = 'A note needs a few words at least.'; note.ok = false; render(); return; }
        note.sending = true; note.msg = null; render();
        const err = await handlers.feedback(note.kind, note.text.trim());
        note.sending = false;
        if (err) { note.msg = err; note.ok = false; } else { note.msg = 'Thank you! The maker reads every note.'; note.ok = true; note.text = ''; }
        render();
      };
      return {
        heading: 'A NOTE FOR THE MAKER',
        content: [
          h('p', { class: 'muted small' }, 'Prayers go to the Nightwright, who builds the world at night. This note goes straight to the person who made Kindle: bugs, balance, anything that should be better.'),
          h('div', { class: 'row-buttons' }, KINDS.map(([k, label]) => btn(label, () => { note.kind = k; note.msg = null; render(); }, { class: note.kind === k ? 'on' : '' }))),
          area,
          h('div', { class: 'row-buttons' }, btn(note.sending ? 'SENDING…' : 'SEND', send, { disabled: note.sending || !handlers.online() })),
          !handlers.online() ? h('p', { class: 'muted small' }, 'Offline: notes need the line to Kindle.') : null,
          note.msg ? h('p', { class: note.ok ? 'good small' : 'muted small' }, note.msg) : null,
          h('p', { class: 'muted small' }, 'Your name, where you are and your class go with the note, so the maker can find the problem.'),
        ],
      };
    },

    news() {
      const last = CHRONICLE[CHRONICLE.length - 1];
      return {
        heading: `LAST NIGHT // DAY ${last.day}`,
        content: [
          h('h3', {}, last.title.toUpperCase()),
          h('p', {}, last.text),
          CHRONICLE.length > 1 ? h('h3', {}, 'BEFORE THAT') : null,
          h('ul', { class: 'rows' }, CHRONICLE.slice(0, -1).reverse().slice(0, 6).map((c) => h('li', { class: 'muted' }, `DAY ${c.day}: ${c.title}`))),
        ],
      };
    },

    // Einladung in eine Gruppe
    partyask({ from, name }) {
      return {
        heading: 'PARTY?',
        content: [
          h('p', {}, `${name} asks you to join their party. Together you share experience and quest progress for creatures beaten nearby.`),
          h('div', { class: 'row-buttons' },
            h('button', { type: 'button', class: 'plaque', onclick: () => { handlers.partyAnswer(from, true); close('partyask'); } }, 'Join'),
            h('button', { type: 'button', class: 'plaque', onclick: () => { handlers.partyAnswer(from, false); close('partyask'); } }, 'Not now')),
        ],
      };
    },

    // Anfrage eines anderen Spielers
    tradeask({ from, name }) {
      return {
        heading: 'TRADE?',
        content: [
          h('p', {}, `${name} wants to trade with you.`),
          h('div', { class: 'row-buttons' },
            h('button', { type: 'button', class: 'plaque', onclick: () => { handlers.tradeAnswer(from, true); close('tradeask'); } }, 'Trade'),
            h('button', { type: 'button', class: 'plaque', onclick: () => { handlers.tradeAnswer(from, false); close('tradeask'); } }, 'Not now')),
        ],
      };
    },

    // Offener Handel: eigenes Angebot (Beutel anklicken), Angebot des anderen, beide sagen zu
    trade(v) {
      if (!state || !v.mine) return { heading: 'TRADE', content: h('p', {}, '...') };
      const have = (id) => state.bag.reduce((s, x) => s + (x && x.id === id ? x.n : 0), 0);
      const offer = (items, gold) => handlers.tradeSet(items, gold);
      const mine = v.mine;
      const list = (items, editable) => {
        const rows = Object.entries(items).map(([id, n]) => h('li', { class: 'trade-item', 'data-item': id },
          iconEl('item', id, ITEMS[id]?.glyph, 'icon small'), ` ${ITEMS[id]?.name ?? id} x${n} `,
          editable ? btn('−', () => {
            const next = { ...mine.items };
            if (n <= 1) delete next[id]; else next[id] = n - 1;
            offer(next, mine.gold);
          }) : null));
        return h('ul', { class: 'rows' }, rows.length ? rows : [h('li', { class: 'muted' }, 'Nothing yet.')]);
      };
      const goldStep = (d) => btn(d > 0 ? `+${d}` : `${d}`, () => offer(mine.items, Math.max(0, Math.min(state.gold, mine.gold + d))));
      const badge = (ok) => h('span', { class: `trade-ok${ok ? ' on' : ''}` }, ok ? 'agreed' : 'thinking');
      const cells = [];
      for (let i = 0; i < BAG_SIZE; i++) {
        const slot = state.bag[i];
        cells.push(itemCell(slot, i, {
          hint: 'Click: add one to your offer.',
          onclick: (_, sl) => {
            const cur = mine.items[sl.id] || 0;
            if (cur >= have(sl.id) || (!cur && Object.keys(mine.items).length >= 8)) return;
            offer({ ...mine.items, [sl.id]: cur + 1 }, mine.gold);
          },
        }));
      }
      return {
        heading: `TRADE // ${v.name}`,
        content: [
          h('div', { class: 'trade-cols' },
            h('div', {},
              h('h3', {}, 'YOU GIVE ', badge(mine.ok)),
              list(mine.items, true),
              h('div', { class: 'row-buttons trade-gold' }, h('span', {}, `${mine.gold} gold`), goldStep(-10), goldStep(-1), goldStep(1), goldStep(10))),
            h('div', {},
              h('h3', {}, `${v.name.toUpperCase()} GIVES `, badge(v.theirs.ok)),
              list(v.theirs.items, false),
              h('div', { class: 'muted' }, `${v.theirs.gold} gold`))),
          h('h3', {}, 'YOUR BAG'),
          h('p', { class: 'muted small' }, 'Click an item to add one to your offer. Any change takes back both agreements.'),
          h('div', { class: 'grid' }, cells),
          h('div', { class: 'row-buttons trade-buttons' },
            h('button', { type: 'button', class: `plaque${mine.ok ? ' on' : ''}`, disabled: mine.ok, onclick: () => handlers.tradeOk() }, mine.ok ? `Waiting for ${v.name}...` : 'Agree'),
            h('button', { type: 'button', class: 'plaque', onclick: () => close('trade') }, 'Call it off')),
        ],
      };
    },

    map() {
      const d = handlers.mapData?.();
      if (!d?.region) return { heading: 'MAP', content: h('p', {}, '...') };
      return {
        heading: `MAP // ${d.region.name || d.region.id}`,
        content: [
          mapCanvas(d),
          h('p', { class: 'muted small map-legend' },
            h('span', { class: 'key-you' }, '■ you'), '  ',
            h('span', { class: 'key-npc' }, '■ people'), '  ',
            h('span', { class: 'key-fire' }, '■ lights'), '  ',
            h('span', { class: 'key-door' }, '■ ways out'), '  ',
            '! new quest  ? hand in'),
          h('p', { class: 'muted small' }, 'Tap the map to walk there. Fen drew most of it.'),
        ],
      };
    },

    keys() {
      const keys = handlers.keys();
      const rows = keys.map((k, i) => h('li', {}, `SLOT ${i + 1}  `, btn(waitingFor === i ? 'PRESS A KEY...' : keyLabel(k), () => { waitingFor = i; render(); })));
      return {
        heading: 'KEYS',
        content: [
          h('p', { class: 'muted small' }, 'Click a slot, then press the key you want for it. Camera keys (arrows, Q, E) and TAB stay as they are.'),
          h('ul', { class: 'rows' }, rows),
          h('div', { class: 'row-buttons' }, btn('RESET', () => { handlers.setKeys(['1', '2', '3', '4', '5', '6', '7', '8', '9']); render(); })),
        ],
      };
    },
  };

  // Tastenbelegung: die nächste Taste nach dem Klick gehört dem Feld.
  let waitingFor = null;
  window.addEventListener('keydown', (e) => {
    if (waitingFor === null || !wins.has('keys')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key !== 'Escape' && !['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      const keys = [...handlers.keys()];
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const prev = keys.indexOf(k);
      if (prev >= 0) keys[prev] = keys[waitingFor];
      keys[waitingFor] = k;
      handlers.setKeys(keys);
    }
    waitingFor = null;
    render();
  }, true);

  for (const b of document.querySelectorAll('.menubar button[data-win]')) b.addEventListener('click', () => toggle(b.dataset.win));

  return {
    open, close, closeAll, toggle, setState, setCommunity,
    refresh(kind) { const w = wins.get(kind); if (w) renderOne(w); },
    isOpen: (kind) => wins.has(kind),
    optsOf: (kind) => wins.get(kind)?.opts ?? null,
    get any() { return wins.size > 0; },
    get capturing() { return waitingFor !== null; },
  };
}
