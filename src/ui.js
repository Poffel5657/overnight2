// Terminal-Oberfläche: Status, Ziel, Log, Leiste 1-9, Menü, Gespräch, Zahlen über Köpfen.
// Kennt die Spiellogik nicht, sondern bekommt Daten und meldet Klicks über handlers zurück.
// Fenster (Charakter, Beutel, Quests, Herstellen, Händler) liegen in src/windows.js.

import { ABILITIES, GCD } from '../content/abilities.js';
import { ITEMS } from '../content/items.js';
import { TALK } from '../content/npcs.js';
import { CLASSES, WANDERER } from '../content/classes.js';
import { iconEl } from './icons.js';

const $ = (id) => document.getElementById(id);

// ---------- Tastenbelegung der Leiste (nur in diesem Browser) ----------

const KEYS_KEY = 'overnight2.keys';
const DEFAULT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function loadKeys() {
  try {
    const k = JSON.parse(localStorage.getItem(KEYS_KEY) || 'null');
    if (Array.isArray(k) && k.length === 9 && k.every((x) => typeof x === 'string' && x.length <= 12)) return k;
  } catch { /* egal */ }
  return [...DEFAULT_KEYS];
}

export function saveKeys(keys) {
  try { localStorage.setItem(KEYS_KEY, JSON.stringify(keys)); } catch { /* egal */ }
}

export function keyLabel(k) {
  if (!k) return '';
  if (k === ' ') return 'SPC';
  return k.length === 1 ? k.toUpperCase() : k.slice(0, 3).toUpperCase();
}

// Was auf einem Leistenfeld liegt: Fähigkeit oder Gegenstand.
export function barEntry(id) {
  if (!id) return null;
  if (id.startsWith('item:')) {
    const it = ITEMS[id.slice(5)];
    return it && { name: it.name, glyph: it.glyph || '?', item: id.slice(5) };
  }
  const a = ABILITIES[id];
  return a && { name: a.name, glyph: a.glyph, ability: a };
}

export function createUI(handlers) {
  const logEl = $('log');
  const menu = $('menu');
  const dialog = $('dialog');
  const hover = $('hovertext');
  const floaters = $('floaters');
  let bar = [];
  let barSig = '';
  let keys = loadKeys();
  let assigning = null;
  let dialogNpc = null;
  let dialogOptions = [];

  // ---------- Log ----------
  function log(text, cls = '') {
    const li = document.createElement('li');
    li.textContent = text;
    if (cls) li.className = cls;
    logEl.append(li);
    while (logEl.children.length > 80) logEl.firstChild.remove();
    logEl.scrollTop = logEl.scrollHeight;
  }
  $('btn-log').addEventListener('click', () => $('log-window').classList.toggle('collapsed'));

  // ---------- Leiste ----------
  function slotButton(i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    for (const cls of ['key', 'glyph', 'name', 'count', 'cd']) {
      const s = document.createElement('span');
      s.className = cls;
      b.append(s);
    }
    b.addEventListener('click', () => {
      if (assigning) {
        handlers.assign(i, assigning);
        endAssign();
        return;
      }
      handlers.ability(i);
    });
    b.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!bar[i]) return;
      openMenu(e.clientX, e.clientY, [{ verb: 'Clear slot', noun: String(i + 1), fn: () => handlers.assign(i, null) }, { verb: 'Cancel' }]);
    });
    return b;
  }

  function setBar(ids, state) {
    const sig = JSON.stringify([ids, keys]);
    const el = $('hotbar');
    if (el.children.length !== 9) {
      el.replaceChildren(...Array.from({ length: 9 }, (_, i) => slotButton(i)));
    }
    bar = ids;
    if (sig !== barSig) {
      barSig = sig;
      ids.forEach((id, i) => {
        const b = el.children[i];
        const entry = barEntry(id);
        b.classList.toggle('empty', !entry);
        b.title = entry ? `${entry.name} (${keyLabel(keys[i])})` : `Empty (${keyLabel(keys[i])}). Right-click a bag item or an ability to place it here.`;
        b.querySelector('.key').textContent = keyLabel(keys[i]);
        b.querySelector('.glyph').replaceChildren(entry ? iconEl(entry.item ? 'item' : 'ability', entry.item || id, entry.glyph) : '·');
        b.querySelector('.name').textContent = entry ? entry.name.toUpperCase() : '';
      });
    }
    // Anzahl bei Gegenständen
    ids.forEach((id, i) => {
      const c = $('hotbar').children[i].querySelector('.count');
      if (id?.startsWith('item:') && state) {
        const n = state.bag.reduce((s, x) => s + (x && x.id === id.slice(5) ? x.n : 0), 0);
        c.textContent = String(n);
        $('hotbar').children[i].classList.toggle('unusable', n === 0);
      } else c.textContent = '';
    });
  }

  function updateBar(me, tick, frac) {
    const slots = $('hotbar').children;
    if (slots.length !== 9) return;
    const now = tick + frac;
    bar.forEach((id, i) => {
      const entry = barEntry(id);
      const cd = slots[i].querySelector('.cd');
      if (!entry) { cd.style.height = '0'; return; }
      const a = entry.ability;
      const own = a ? me.cds[id] || 0 : 0;
      const until = Math.max(me.gcdUntil, own);
      const total = own > me.gcdUntil && a ? Math.max(a.cd, GCD) : GCD;
      const left = Math.max(0, until - now);
      cd.style.height = `${Math.min(100, (left / total) * 100)}%`;
      slots[i].classList.toggle('queued', me.queued === id);
      if (a) slots[i].classList.toggle('unusable', !!a.oil && me.oil < a.oil);
    });
  }

  function flashSlot(i) {
    const s = $('hotbar').children[i];
    if (!s) return;
    s.classList.add('flash');
    setTimeout(() => s.classList.remove('flash'), 150);
  }

  // Ein Feld der Leiste wählen, um id dorthin zu legen.
  function beginAssign(id, name) {
    assigning = id;
    $('hotbar').classList.add('assigning');
    log(`Click a slot on the bar for ${name}. (ESC cancels)`, 'sys');
  }
  function endAssign() {
    assigning = null;
    $('hotbar').classList.remove('assigning');
  }

  function setKeys(k) {
    keys = k;
    saveKeys(k);
    barSig = '';
    setBar(bar);
  }

  // ---------- Status und Ziel ----------
  function updateSky(clock, phase, note) {
    $('st-time').textContent = `${clock} ${phase}`;
    $('st-phase').textContent = note;
  }

  function updateStatus(me, place) {
    $('st-place').textContent = place;
    const def = me.cls ? CLASSES[me.cls] : WANDERER;
    $('st-class').textContent = `${def.name.toUpperCase()} LV ${me.level}`;
    $('st-gold').textContent = `${me.gold} GOLD`;
    $('st-gather').textContent = me.gathering ? 'WORKING...' : '';
    $('hp-fill').style.width = `${(me.hp / me.maxHp) * 100}%`;
    $('hp-text').textContent = `${Math.max(0, me.hp)}/${me.maxHp}`;
    $('fuel-fill').style.width = `${me.oil}%`;
    $('fuel-text').textContent = String(Math.ceil(me.oil));
  }

  function updateTarget(mob, note) {
    const el = $('target');
    if (!mob) { el.hidden = true; return; }
    el.hidden = false;
    $('target-name').textContent = `[ ${mob.name.toUpperCase()}${mob.level ? ` LV ${mob.level}` : ''} ]`;
    $('target-fill').style.width = `${(mob.hp / Math.max(1, mob.maxHp)) * 100}%`;
    $('target-text').textContent = `${mob.hp}/${mob.maxHp}`;
    $('target-note').textContent = note || '';
  }

  // ---------- Menü ----------
  function openMenu(x, y, entries) {
    menu.replaceChildren();
    for (const e of entries) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      const verb = document.createElement('span');
      verb.className = 'verb';
      verb.textContent = e.verb;
      const noun = document.createElement('span');
      noun.className = 'noun';
      noun.textContent = e.noun ? ` ${e.noun}` : '';
      b.append(verb, noun);
      b.addEventListener('click', () => { closeMenu(); e.fn?.(); });
      menu.append(b);
    }
    menu.hidden = false;
    const r = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(4, Math.min(x, window.innerWidth - r.width - 4))}px`;
    menu.style.top = `${Math.max(4, Math.min(y, window.innerHeight - r.height - 4))}px`;
    menu.querySelector('button')?.focus({ preventScroll: true });
  }
  function closeMenu() { menu.hidden = true; }
  const menuOpen = () => !menu.hidden;

  // ---------- Gespräch (der Server bestimmt Seite und sichtbare Antworten) ----------
  function openDialog(npcId, name, pageKey, options) {
    const page = TALK[npcId]?.[pageKey];
    if (!page) { closeDialog(); return; }
    dialogNpc = npcId;
    dialogOptions = options;
    dialog.hidden = false;
    $('dialog-name').textContent = `[ ${name.toUpperCase()} ]`;
    $('dialog-text').textContent = page.text;
    const opts = $('dialog-options');
    opts.replaceChildren();
    options.forEach((i, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `[ ${n + 1}. ${page.options[i].text} ]`;
      b.addEventListener('click', () => handlers.say(i));
      opts.append(b);
    });
  }
  function closeDialog(tellServer = false) {
    if (dialog.hidden) return;
    dialog.hidden = true;
    dialogNpc = null;
    if (tellServer) handlers.bye();
  }
  // Zahlentasten wählen im Gespräch Antworten statt Fähigkeiten.
  function dialogKey(n) {
    if (dialog.hidden) return false;
    const i = dialogOptions[n - 1];
    if (i !== undefined) handlers.say(i);
    return true;
  }

  // ---------- Zeigertext und Zahlen ----------
  function setHover(text, x, y) {
    if (!text) { hover.hidden = true; return; }
    hover.hidden = false;
    hover.textContent = text;
    hover.style.left = `${x + 16}px`;
    hover.style.top = `${y + 12}px`;
  }

  function floater(x, y, text, cls = '') {
    const d = document.createElement('div');
    d.className = 'floater' + (cls ? ' ' + cls : '');
    d.textContent = text;
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    floaters.append(d);
    setTimeout(() => d.remove(), 950);
  }

  const bars = new Map();
  function overhead(id, x, y, frac) {
    let el = bars.get(id);
    if (frac === null) { if (el) el.hidden = true; return; }
    if (!el) {
      el = document.createElement('div');
      el.className = 'overhead';
      el.append(document.createElement('div'));
      floaters.append(el);
      bars.set(id, el);
    }
    el.hidden = false;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.firstChild.style.width = `${frac * 100}%`;
  }

  const tags = new Map();
  function nameTag(id, x, y, text, cls = '') {
    let el = tags.get(id);
    if (text === null) { if (el) el.hidden = true; return; }
    if (!el) {
      el = document.createElement('div');
      el.className = `nametag ${cls}`;
      floaters.append(el);
      tags.set(id, el);
    }
    el.hidden = false;
    if (el.textContent !== text) el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  // ---------- Knöpfe ----------
  $('btn-crt').addEventListener('click', () => {
    const on = document.documentElement.classList.toggle('crt-on');
    $('btn-crt').textContent = `[ CRT: ${on ? 'ON' : 'OFF'} ]`;
    handlers.crt(on);
    try { localStorage.setItem('overnight2.crt', on ? '1' : '0'); } catch { /* egal */ }
  });
  $('btn-help').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });
  $('btn-help-close').addEventListener('click', () => { $('help').hidden = true; });
  $('dialog-close').addEventListener('click', () => closeDialog(true));

  return {
    log, setBar, updateBar, flashSlot, beginAssign, endAssign, setKeys,
    get keys() { return keys; }, get assigning() { return assigning; }, get bar() { return bar; },
    updateStatus, updateSky, updateTarget,
    openMenu, closeMenu, menuOpen, openDialog, closeDialog, dialogKey,
    get dialogNpc() { return dialogNpc; },
    setHover, floater, overhead, nameTag,
  };
}
