// Fenster: CHARACTER, BAG, QUESTS, Herstellen (an einer Station), Händler, Tasten.
// Immer nur eines ist offen. Sie zeichnen sich neu, wenn der Server einen neuen Charakterstand schickt.
// Alles wird mit DOM-Funktionen gebaut, Texte nur über textContent.

import { ITEMS, SLOTS, SLOT_NAMES, BAG_SIZE } from '../content/items.js';
import { CLASSES, UNLOCK_LEVEL } from '../content/classes.js';
import { ABILITIES } from '../content/abilities.js';
import { PROFESSIONS, MAX_PROFESSIONS } from '../content/professions.js';
import { QUESTS } from '../content/quests.js';
import { RECIPES } from '../content/recipes.js';
import { SHOPS } from '../content/shops.js';
import { allNpcs } from '../content/regions/index.js';
import { xpForLevel } from '../shared/player.js';
import { keyLabel } from './ui.js';
import { FAVOURS, BEACON_FUEL, BEACON_GOAL, DONATE_CAP } from '../content/dailies.js';
import { BALLOT } from '../content/ballot.js';
import { CHRONICLE } from '../content/chronicle.js';
import { favoursFor, PRAYER_MAX } from '../shared/community.js';

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
const btn = (label, onclick, attrs = {}) => h('button', { type: 'button', onclick, ...attrs }, `[ ${label} ]`);
const npcName = (id) => allNpcs().find((n) => n.id === id)?.name ?? id;

function xpLine(level, xp) {
  const lo = xpForLevel(level);
  const hi = xpForLevel(level + 1);
  const frac = Math.max(0, Math.min(1, (xp - lo) / Math.max(1, hi - lo)));
  return h('div', { class: 'bar' }, h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill xp', style: `width:${(frac * 100).toFixed(1)}%` })), h('span', {}, `${xp - lo}/${hi - lo}`));
}

export function createWindows(handlers) {
  const panel = $('panel');
  const title = $('panel-title');
  const body = $('panel-body');
  let current = null; // { kind, opts }
  let state = null;
  let community = { beacon: 0, ballot: {} };
  let date = '';
  let top = null;
  let prayerDraft = '';

  function open(kind, opts = {}) {
    current = { kind, opts };
    panel.hidden = false;
    panel.dataset.kind = kind;
    render();
    for (const b of document.querySelectorAll('.menubar button')) b.classList.toggle('on', b.dataset.win === kind);
  }
  function close() {
    current = null;
    panel.hidden = true;
    for (const b of document.querySelectorAll('.menubar button')) b.classList.remove('on');
  }
  function toggle(kind) {
    if (current?.kind === kind) close();
    else open(kind);
  }
  function setState(s) {
    state = s;
    if (current) render();
  }
  function setCommunity(c, d) {
    community = c;
    if (d) date = d;
    if (current && ['board', 'beacon', 'altar'].includes(current.kind)) render();
  }

  function render() {
    if (!current) return;
    const r = RENDER[current.kind];
    if (!r) return close();
    const scroll = body.scrollTop;
    const focused = document.activeElement?.id;
    const { heading, content } = r(current.opts);
    title.textContent = `[ ${heading} ]`;
    body.replaceChildren(...[content].flat(Infinity).filter(Boolean));
    body.scrollTop = scroll;
    if (focused === 'prayer-text') $('prayer-text')?.focus();
  }

  // ---------- Gegenstände ----------
  function itemCell(slot, i, extra = {}) {
    if (!slot) return h('button', { type: 'button', class: 'cell empty', disabled: true, 'aria-label': 'empty' }, '·');
    const def = ITEMS[slot.id];
    const cell = h('button', {
      type: 'button',
      class: 'cell',
      title: `${def.name}. ${def.text}`,
      onclick: () => (extra.onclick ? extra.onclick(i, slot) : handlers.use(i)),
      oncontextmenu: (e) => { e.preventDefault(); itemMenu(e.clientX, e.clientY, i, slot); },
    }, h('span', { class: 'glyph' }, def.glyph || '?'), slot.n > 1 ? h('span', { class: 'count' }, slot.n) : null);
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
    if (current?.kind === 'shop' && def.value) entries.push({ verb: 'Sell', noun: def.name, fn: () => handlers.sell(current.opts.shop, i, 1) });
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

  // ---------- Fenster ----------
  const RENDER = {
    char() {
      const s = state;
      if (!s) return { heading: 'CHARACTER', content: h('p', {}, '...') };
      const active = s.cls && CLASSES[s.cls];
      const classRows = Object.entries(CLASSES).map(([id, c]) => {
        const lv = s.classes[id];
        const status = lv ? `LV ${lv.level}` : `LOCKED (${npcName(c.teacher)}, needs LV ${UNLOCK_LEVEL})`;
        return h('li', { class: id === s.cls ? 'on' : lv ? '' : 'dim' },
          h('span', {}, `${id === s.cls ? '> ' : '  '}${c.name.toUpperCase()}`), h('span', { class: 'muted' }, ` ${c.role} `), h('span', {}, status));
      });
      const abilities = active ? active.abilities.map(([ab, need]) => {
        const a = ABILITIES[ab];
        const known = s.classes[s.cls].level >= need;
        const onBar = s.bar.includes(ab);
        return h('li', { class: known ? '' : 'dim' },
          h('span', { class: 'glyph' }, a.glyph), ` ${a.name} `,
          known ? (onBar ? h('span', { class: 'muted' }, 'ON BAR') : btn('TO BAR', () => handlers.assign(ab, a.name))) : h('span', { class: 'muted' }, `LV ${need}`));
      }) : [h('li', { class: 'muted' }, 'Choose a calling with Warden Ama by the Beacon.')];
      const equip = SLOTS.map((slot) => {
        const id = s.equip[slot];
        return h('li', {}, h('span', { class: 'muted' }, `${SLOT_NAMES[slot].padEnd(8)}`),
          id ? h('button', { type: 'button', title: slot === 'main' ? 'Hold another weapon to switch.' : 'Take off', onclick: () => handlers.unequip(slot) }, ITEMS[id].name) : h('span', { class: 'muted' }, '-'));
      });
      const profRows = Object.entries(s.profs).map(([id, pr]) => h('li', {}, `${PROFESSIONS[id].name.toUpperCase()} LV ${pr.level}`, xpLine(pr.level, pr.xp)));
      const free = MAX_PROFESSIONS - Object.keys(s.profs).length;
      return {
        heading: 'CHARACTER',
        content: [
          h('h3', {}, 'CALLINGS'),
          h('ul', { class: 'rows' }, classRows),
          active ? xpLine(s.classes[s.cls].level, s.classes[s.cls].xp) : null,
          h('p', { class: 'muted small' }, 'Switch by holding a calling\'s weapon in Kindle. Nothing you learn is lost.'),
          h('h3', {}, `ABILITIES${active ? ` // ${active.name.toUpperCase()}` : ''}`),
          h('ul', { class: 'rows' }, abilities),
          h('h3', {}, 'WORN'),
          h('ul', { class: 'rows mono' }, equip),
          h('p', {}, `POWER ${s.power}   DEFENCE ${s.defence}   GOLD ${s.gold}`),
          h('h3', {}, `TRADES (${Object.keys(s.profs).length}/${MAX_PROFESSIONS})`),
          h('ul', { class: 'rows' }, profRows.length ? profRows : [h('li', { class: 'muted' }, 'None yet.')]),
          free > 0 ? h('p', { class: 'muted small' }, 'Teachers: Rook (Salvage, Tinkering), Tallow (Foraging, Alchemy), Fen (Cartography), Wren (Lampwright).') : null,
          h('div', { class: 'row-buttons' }, btn('KEYS', () => open('keys')), handlers.online() ? btn('LEAVE KINDLE', () => { close(); handlers.leave(); }) : null),
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
      return {
        heading: 'QUESTS',
        content: [
          h('ul', { class: 'rows' }, active.length ? active : [h('li', { class: 'muted' }, 'Nothing on your mind. People in Kindle might change that.')]),
          done.length ? h('h3', {}, 'DONE') : null,
          done.length ? h('ul', { class: 'rows' }, done) : null,
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
        return h('li', { class: canLevel ? '' : 'dim' },
          h('div', {}, h('span', { class: 'glyph' }, out.glyph), ` ${out.name}${r.out[1] > 1 ? ` x${r.out[1]}` : ''} `, h('span', { class: 'muted' }, `LV ${r.level}`)),
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

    shop({ shop }) {
      const s = SHOPS[shop];
      if (!state) return { heading: s.name.toUpperCase(), content: h('p', {}, '...') };
      const buy = s.sells.map((id) => {
        const it = ITEMS[id];
        return h('li', {}, h('span', { class: 'glyph' }, it.glyph), ` ${it.name} `, h('span', { class: 'muted' }, `${it.value}G `),
          btn('BUY', () => handlers.buy(shop, id, 1), { disabled: state.gold < it.value }),
          it.stack ? btn('x5', () => handlers.buy(shop, id, 5), { disabled: state.gold < it.value * 5 }) : null);
      });
      const sell = state.bag.map((slot, i) => {
        if (!slot || !ITEMS[slot.id].value) return null;
        const it = ITEMS[slot.id];
        const price = Math.max(1, Math.floor(it.value / 2));
        return h('li', {}, h('span', { class: 'glyph' }, it.glyph), ` ${it.name}${slot.n > 1 ? ` x${slot.n}` : ''} `, h('span', { class: 'muted' }, `${price}G `),
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
      if (top === null && handlers.online()) handlers.fetchBoard().then((t) => { top = t; render(); }).catch(() => { top = []; });
      const ranks = (top || []).map((r, i) => h('li', {}, `${String(i + 1).padStart(2)}. ${r.name}  LV ${r.level}`));
      return {
        heading: 'NOTICE BOARD',
        content: [
          h('h3', {}, 'FAVOURS TODAY'),
          h('ul', { class: 'rows' }, favours),
          h('p', { class: 'muted small' }, 'New favours every midnight. Kills count by themselves; bring the rest here.'),
          h('h3', {}, 'THE BEACON'),
          beaconBar(),
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
        return h('li', {}, h('span', { class: 'glyph' }, it.glyph), ` ${it.name} x${n} `, h('span', { class: 'muted' }, `(+${pts} each) `),
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
      const d = state?.daily && state.daily.date === date ? state.daily : { donated: 0, prayed: false };
      const total = Object.values(community.ballot).reduce((a, b) => a + b, 0) || 1;
      const left = Math.max(0, DONATE_CAP - d.donated);
      const options = BALLOT.options.map((o) => {
        const g = community.ballot[o.id] || 0;
        return h('li', { class: 'quest' }, h('div', {}, o.text),
          h('div', { class: 'bar' }, h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill xp', style: `width:${(g / total) * 100}%` })), h('span', {}, `${g}G`)),
          h('div', { class: 'row-buttons' },
            btn('GIVE 5G', () => handlers.donate(o.id, 5), { disabled: !state || state.gold < 1 || left < 1 }),
            btn('GIVE 25G', () => handlers.donate(o.id, 25), { disabled: !state || state.gold < 1 || left < 1 })));
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
          h('h3', {}, `OFFERINGS // ${left}G LEFT TODAY`),
          h('p', { class: 'muted small' }, 'Gold is a vote. The idea with the most gold tonight is built next.'),
          h('ul', { class: 'rows' }, options),
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
    if (waitingFor === null || current?.kind !== 'keys') return;
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

  $('panel-close').addEventListener('click', close);
  for (const b of document.querySelectorAll('.menubar button')) b.addEventListener('click', () => toggle(b.dataset.win));

  return {
    open, close, toggle, setState, setCommunity,
    get kind() { return current?.kind ?? null; },
    get opts() { return current?.opts ?? null; },
    get capturing() { return waitingFor !== null; },
  };
}
