// Terminal-Oberfläche: Status, Ziel, Log, Leiste 1-9, Menü, Gespräch, Zahlen über Köpfen.
// Kennt die Spiellogik nicht, sondern bekommt Daten und meldet Klicks über handlers zurück.
// Fenster (Charakter, Beutel, Quests, Herstellen, Händler) liegen in src/windows.js.

import { ABILITIES, GCD } from '../content/abilities.js';
import { ITEMS } from '../content/items.js';
import { TALK } from '../content/npcs.js';
import { iconEl, spriteURL } from './icons.js';
import { markerURL } from './markers.js';
import { describeAbility, describeItem } from '../shared/describe.js';
import { makeDraggable } from './drag.js';
import { TICK_MS } from '../shared/sim.js';

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
  // Tabs: Log (Spiel) und Chat (was gesagt wurde). Ein Klick auf den offenen Tab klappt das Fenster ein.
  let tab = 'log';
  function showTab(t) {
    const win = $('log-window');
    if (t === tab && !win.classList.contains('collapsed')) { win.classList.add('collapsed'); return; }
    win.classList.remove('collapsed');
    tab = t;
    $('log').hidden = t !== 'log';
    $('chat-log').hidden = t !== 'chat';
    for (const [id, name] of [['btn-log', 'log'], ['btn-chat', 'chat']]) {
      $(id).classList.toggle('on', name === t);
      $(id).setAttribute('aria-selected', String(name === t));
    }
    if (t === 'chat') {
      $('btn-chat').querySelector('.unread').hidden = true;
      $('chat-log').scrollTop = $('chat-log').scrollHeight;
    }
  }
  $('btn-log').addEventListener('click', () => showTab('log'));
  $('btn-chat').addEventListener('click', () => showTab('chat'));

  // Eine Zeile im Chat-Tab: Uhrzeit, Name, Text. mine = selbst gesagt.
  function chatLine(name, text, mine = false) {
    const el = $('chat-log');
    const li = document.createElement('li');
    if (mine) li.className = 'mine';
    const time = document.createElement('span');
    time.className = 'ctime';
    time.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const who = document.createElement('span');
    who.className = 'cname';
    who.textContent = name;
    li.append(time, who, document.createTextNode(text));
    el.append(li);
    while (el.children.length > 100) el.firstChild.remove();
    if (tab === 'chat' && !$('log-window').classList.contains('collapsed')) el.scrollTop = el.scrollHeight;
    else if (!mine) $('btn-chat').querySelector('.unread').hidden = false;
  }

  // ---------- Leiste ----------
  function slotButton(i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    for (const cls of ['key', 'glyph', 'name', 'count', 'cd', 'timer']) {
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
        b.removeAttribute('title');
        // Tooltip: Fähigkeit über data-ability, Gegenstand über data-item, leeres Feld als Hinweis
        delete b.dataset.ability;
        delete b.dataset.item;
        delete b.dataset.tip;
        if (entry?.item) b.dataset.item = entry.item;
        else if (entry) b.dataset.ability = id;
        else b.dataset.tip = `Empty slot (${keyLabel(keys[i])}). Drag an ability or bag item here.`;
        b.dataset.key = keyLabel(keys[i]);
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
      // Eigene Abklingzeit (länger als die globale): Restsekunden groß auf dem Feld.
      const ownLeft = Math.max(0, own - now);
      const t = slots[i].querySelector('.timer');
      const txt = ownLeft > GCD ? String(Math.ceil((ownLeft * TICK_MS) / 1000)) : '';
      if (t.textContent !== txt) t.textContent = txt;
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
    $('st-gather').textContent = me.gathering ? 'Working…' : '';
    $('hp-fill').style.width = `${(me.hp / me.maxHp) * 100}%`;
    $('hp-text').textContent = `${Math.max(0, me.hp)}/${me.maxHp}`;
    $('fuel-fill').style.width = `${me.oil}%`;
    $('fuel-text').textContent = String(Math.ceil(me.oil));
    // Die Laterne im Statusfenster leuchtet so hell, wie Öl da ist.
    $('st-lamp').style.setProperty('--lit', (Math.max(0, Math.min(100, me.oil)) / 100).toFixed(2));
  }

  function updateTarget(mob, note) {
    const el = $('target');
    if (!mob) { el.hidden = true; return; }
    el.hidden = false;
    $('target-name').textContent = `${mob.name}${mob.level ? ` · Lv ${mob.level}` : ''}`;
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
  // sprite/meSprite: Bilder für die Porträts (Figur links, eigene Figur rechts)
  function openDialog(npcId, name, pageKey, options, sprite, meSprite) {
    const page = TALK[npcId]?.[pageKey];
    if (!page) { closeDialog(); return; }
    const fresh = dialog.hidden || dialogNpc !== npcId;
    dialogNpc = npcId;
    dialogOptions = options;
    dialog.hidden = false;
    $('dialog-name').textContent = name;
    const npcImg = $('dialog-npc-img');
    const meImg = $('dialog-me-img');
    const nu = sprite && spriteURL(sprite);
    const mu = meSprite && spriteURL(meSprite);
    npcImg.hidden = !nu;
    meImg.hidden = !mu;
    if (nu && npcImg.getAttribute('src') !== nu) npcImg.src = nu;
    if (mu && meImg.getAttribute('src') !== mu) meImg.src = mu;
    // Neues Gespräch: Porträts gleiten herein; neue Seite: die Figur nickt kurz
    dialog.classList.remove('enter', 'speak');
    void dialog.offsetWidth;
    dialog.classList.add(fresh ? 'enter' : 'speak');
    dialog.classList.remove('me-turn');
    typeText($('dialog-text'), page.text);
    const opts = $('dialog-options');
    opts.replaceChildren();
    options.forEach((i, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = `${n + 1}.`;
      b.append(num, page.options[i].text);
      b.addEventListener('click', () => handlers.say(i));
      // Beim Zeigen auf eine Antwort tritt die eigene Figur nach vorn
      b.addEventListener('pointerenter', () => dialog.classList.add('me-turn'));
      b.addEventListener('pointerleave', () => dialog.classList.remove('me-turn'));
      opts.append(b);
    });
  }
  // Text erscheint Zeichen für Zeichen; ein Klick in den Text zeigt ihn ganz.
  let typing = null;
  function typeText(el, text) {
    clearInterval(typing);
    el.textContent = '';
    el.dataset.full = text;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
    let i = 0;
    typing = setInterval(() => {
      i = Math.min(text.length, i + 2);
      el.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typing); typing = null; }
    }, 22);
  }
  $('dialog-text').addEventListener('click', (e) => {
    clearInterval(typing);
    typing = null;
    e.currentTarget.textContent = e.currentTarget.dataset.full || e.currentTarget.textContent;
  });

  function closeDialog(tellServer = false) {
    if (dialog.hidden) return;
    clearInterval(typing);
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
    // Leicht streuen, damit schnelle Treffer nicht übereinander liegen.
    const jitter = /dealt|taken/.test(cls) ? (Math.random() - 0.5) * 36 : 0;
    d.style.left = `${x + jitter}px`;
    d.style.top = `${y}px`;
    floaters.append(d);
    setTimeout(() => d.remove(), 1300);
  }

  // ---------- Sprechblasen ----------
  // Blase über einer Figur für ms Millisekunden; eine neue ersetzt die alte.
  const bubbles = new Map(); // id -> { el, until }
  function bubble(id, text, ms = 5000, cls = '') {
    let b = bubbles.get(id);
    if (!b) {
      const el = document.createElement('div');
      $('bubbles').append(el);
      b = { el };
      bubbles.set(id, b);
    }
    b.el.className = `bubble ${cls}`;
    b.el.textContent = text;
    b.until = performance.now() + ms;
    b.el.hidden = true;
  }
  // posOf(id) -> { x, y } oder null (nicht zu sehen); jedes Bild aufrufen
  function placeBubbles(posOf) {
    const now = performance.now();
    for (const [id, b] of bubbles) {
      if (now > b.until) { b.el.remove(); bubbles.delete(id); continue; }
      const p = posOf(id);
      b.el.hidden = !p;
      if (!p) continue;
      b.el.classList.toggle('fading', b.until - now < 400);
      b.el.style.left = `${p.x}px`;
      b.el.style.top = `${p.y}px`;
    }
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

  // Pixel-Symbol (src/markers.js) über einer Figur oder einem Gebäude; kind = null blendet aus.
  const marks = new Map();
  function marker(id, x, y, kind) {
    let el = marks.get(id);
    if (!kind) { if (el) el.hidden = true; return; }
    if (!el) {
      el = document.createElement('img');
      el.alt = '';
      el.draggable = false;
      floaters.append(el);
      marks.set(id, el);
    }
    if (el.dataset.kind !== kind) {
      el.dataset.kind = kind;
      el.className = `qmark ${kind}`;
      el.src = markerURL(kind);
    }
    el.hidden = false;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  // ---------- Tooltip (Fähigkeiten, Gegenstände, Hinweise) ----------
  // Elemente mit data-ability, data-item oder data-tip zeigen beim Darüberfahren eine Karte im UI-Stil.
  const tip = document.createElement('div');
  tip.className = 'tip window';
  tip.hidden = true;
  document.body.append(tip);
  function tipContent(el) {
    const parts = [];
    const add = (cls, text) => { if (!text) return; const d = document.createElement('div'); d.className = cls; d.textContent = text; parts.push(d); };
    if (el.dataset.ability) {
      const d = describeAbility(el.dataset.ability);
      if (!d) return null;
      add('tip-title', `${d.name}${el.dataset.key ? `  [${el.dataset.key}]` : ''}`);
      add('tip-flavor', d.flavor);
      add('tip-effect', d.effect);
      add('tip-cost', d.cost);
    } else if (el.dataset.item) {
      const d = describeItem(el.dataset.item);
      if (!d) return null;
      add('tip-title', `${d.name}${el.dataset.key ? `  [${el.dataset.key}]` : ''}`);
      add('tip-kind', d.kind);
      add('tip-flavor', d.flavor);
      for (const s of d.stats) add('tip-effect', s);
      for (const u of d.uses) add('tip-use', u);
      add('tip-cost', d.value);
      if (el.dataset.hint) add('tip-hint', el.dataset.hint);
    } else if (el.dataset.tip) {
      add('tip-effect', el.dataset.tip);
    }
    return parts.length ? parts : null;
  }
  function placeTip(el) {
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    let x = r.left + r.width / 2 - t.width / 2;
    let y = r.top - t.height - 8;
    if (y < 4) y = r.bottom + 8;
    x = Math.max(4, Math.min(window.innerWidth - t.width - 4, x));
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = e.target.closest?.('[data-ability], [data-item], [data-tip]');
    if (!el) { tip.hidden = true; return; }
    const c = tipContent(el);
    if (!c) { tip.hidden = true; return; }
    tip.replaceChildren(...c);
    tip.hidden = false;
    placeTip(el);
  });
  document.addEventListener('pointerdown', () => { tip.hidden = true; }, true);

  // ---------- Gruppe ----------
  // party: { leader, members: [{ id, name }] } oder null. ents: Figuren im Gebiet (für Leben und Klasse).
  let partySig = '';
  function updateParty(party, ents, me) {
    const box = $('party');
    if (!party) { box.hidden = true; partySig = ''; return; }
    box.hidden = false;
    const list = $('party-list');
    const sig = JSON.stringify(party);
    if (sig !== partySig) {
      partySig = sig;
      list.replaceChildren(...party.members.map((m) => {
        const li = document.createElement('li');
        li.dataset.id = m.id;
        li.className = 'party-member';
        const img = document.createElement('img');
        img.className = 'mini';
        img.alt = '';
        const name = document.createElement('span');
        name.className = 'pname';
        name.textContent = `${m.id === party.leader ? '★ ' : ''}${m.name}${m.id === me ? ' (you)' : ''}`;
        const bar = document.createElement('div');
        bar.className = 'bar hp';
        const track = document.createElement('div');
        track.className = 'bar-track';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        track.append(fill);
        bar.append(track);
        const where = document.createElement('span');
        where.className = 'pwhere muted small';
        li.append(img, name, bar, where);
        // Anführer: Rechtsklick auf ein Mitglied entfernt es aus der Gruppe
        li.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (party.leader !== me || m.id === me) return;
          openMenu(e.clientX, e.clientY, [{ verb: 'Remove from party', noun: m.name, fn: () => handlers.partyKick(m.id) }, { verb: 'Cancel' }]);
        });
        return li;
      }));
    }
    for (const li of list.children) {
      const e = ents.get(li.dataset.id);
      const img = li.querySelector('img');
      const url = e ? spriteURL(e.sprite) : spriteURL('player');
      if (img.getAttribute('src') !== url) img.src = url;
      li.classList.toggle('away', !e);
      li.querySelector('.bar').hidden = !e;
      li.querySelector('.pwhere').textContent = e ? '' : 'elsewhere';
      if (e) li.querySelector('.bar-fill').style.width = `${(Math.max(0, e.hp) / Math.max(1, e.maxHp)) * 100}%`;
    }
  }
  $('party-leave').addEventListener('click', () => handlers.partyLeave());

  // ---------- Leuchtfeuer: wie voll ist es heute? ----------
  // frac 0..1, text z. B. "120 / 300". pos: Bildschirmpunkt über dem Feuer oder null.
  function setBeacon(frac, text, pos) {
    const known = frac !== null;
    $('st-beacon').hidden = !known;
    if (known) {
      const pct = `${Math.round(frac * 100)}%`;
      $('st-beacon-fill').style.width = pct;
      if ($('st-beacon-text').textContent !== pct) $('st-beacon-text').textContent = pct;
      $('st-beacon').classList.toggle('full', frac >= 1);
    }
    const f = $('beacon-float');
    f.hidden = !known || !pos;
    if (f.hidden) return;
    $('beacon-float-fill').style.width = `${frac * 100}%`;
    const t = frac >= 1 ? 'Blazing tonight!' : text;
    if ($('beacon-float-text').textContent !== t) $('beacon-float-text').textContent = t;
    f.classList.toggle('full', frac >= 1);
    f.style.left = `${pos.x}px`;
    f.style.top = `${pos.y}px`;
  }

  // Tagesaufgaben in der Statusanzeige: Kerze (beten) und Münze (opfern), hell = erledigt
  function setToday(t) {
    const el = $('st-today');
    if (!t) { el.hidden = true; return; }
    el.hidden = false;
    el.querySelector('.pray').classList.toggle('done', !!t.prayed);
    el.querySelector('.pray').hidden = !t.canPray;
    el.querySelector('.vote').classList.toggle('done', !!t.voted);
    el.title = `${t.canPray ? (t.prayed ? 'Prayed today. ' : 'You have not prayed today. ') : ''}${t.voted ? 'Voted today.' : 'You have not voted today.'} Both happen at the altar in the Chapel.`;
  }

  // ---------- Knöpfe ----------
  // CRT-Filter der Welt an/aus (Einstellung im Settings-Fenster)
  function setCrt(on) {
    document.documentElement.classList.toggle('crt-on', on);
    handlers.crt(on);
    try { localStorage.setItem('overnight2.crt', on ? '1' : '0'); } catch { /* egal */ }
  }
  $('btn-help').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });
  $('btn-help-close').addEventListener('click', () => { $('help').hidden = true; });
  $('dialog-close').addEventListener('click', () => closeDialog(true));

  // Verschiebbar: Ort/Zeit, Log, Ziel, Leiste mit Leben/Öl, Menüleiste, Gespräch
  makeDraggable($('vitals'), 'vitals', $('vitals'));
  makeDraggable($('hotbar-box'), 'hotbar', $('hotbar-box'));
  makeDraggable(document.querySelector('.status'), 'status', document.querySelector('.status .wtitle'));
  makeDraggable($('log-window'), 'log', document.querySelector('#log-window .wtitle'));
  makeDraggable($('target'), 'target', $('target-name'));
  makeDraggable($('party'), 'party', document.querySelector('#party .wtitle'));
  makeDraggable($('menubar'), 'menubar', $('menubar'));
  makeDraggable(dialog, 'dialog', dialog.querySelector('.wtitle'));

  // Laterne neben Leben und Öl (Pixel-Icon der Zinnlaterne)
  $('st-lamp').append(iconEl('item', 'tin_lantern', '*'));
  // Tagesaufgaben: Symbole einsetzen
  for (const [cls, kind, label] of [['pray', 'pray', 'Pray'], ['vote', 'stone', 'Vote']]) {
    const s = document.createElement('span');
    s.className = `today-item ${cls}`;
    const img = document.createElement('img');
    img.src = markerURL(kind);
    img.alt = '';
    img.className = 'icon';
    s.append(img, label);
    $('st-today').append(s);
  }

  // Größe der Oberfläche: wächst mit dem Fenster, dazu 70–150 % im Settings-Fenster
  let uiScale = 1;
  try { uiScale = Number(localStorage.getItem('overnight2.ui-scale')) || 1; } catch { /* egal */ }
  function setScale(v) {
    uiScale = Math.round(Math.max(0.7, Math.min(1.5, v)) * 10) / 10;
    document.documentElement.style.setProperty('--ui-scale', String(uiScale));
    try { localStorage.setItem('overnight2.ui-scale', String(uiScale)); } catch { /* egal */ }
  }
  setScale(uiScale);

  return {
    log, setBar, updateBar, flashSlot, beginAssign, endAssign, setKeys,
    get keys() { return keys; }, get assigning() { return assigning; }, get bar() { return bar; },
    setScale, get scale() { return uiScale; }, setCrt, get crt() { return document.documentElement.classList.contains('crt-on'); },
    updateStatus, updateSky, updateTarget,
    openMenu, closeMenu, menuOpen, openDialog, closeDialog, dialogKey,
    get dialogNpc() { return dialogNpc; },
    setHover, floater, overhead, nameTag, bubble, placeBubbles, marker, setToday, updateParty, chatLine, setBeacon,
  };
}
