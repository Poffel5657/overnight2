// Terminal-Oberfläche: Status, Ziel, Log, Leiste 1-9, Menü, Dialog, Zahlen über Köpfen.
// Kennt die Spiellogik nicht, sondern bekommt Daten und meldet Klicks über handlers zurück.

import { ABILITIES, GCD } from '../content/abilities.js';
import { TALK } from '../content/npcs.js';

const $ = (id) => document.getElementById(id);

export function createUI(handlers) {
  const logEl = $('log');
  const menu = $('menu');
  const dialog = $('dialog');
  const hover = $('hovertext');
  const floaters = $('floaters');
  let bar = [];
  let dialogNpc = null;

  // ---------- Log ----------
  function log(text, cls = '') {
    const li = document.createElement('li');
    li.textContent = text;
    if (cls) li.className = cls;
    logEl.append(li);
    while (logEl.children.length > 60) logEl.firstChild.remove();
    logEl.scrollTop = logEl.scrollHeight;
  }
  $('btn-log').addEventListener('click', () => $('log-window').classList.toggle('collapsed'));

  // ---------- Leiste ----------
  function buildBar(ids) {
    bar = ids;
    const el = $('hotbar');
    el.replaceChildren();
    ids.forEach((id, i) => {
      const a = id && ABILITIES[id];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot' + (a ? '' : ' empty');
      b.title = a ? `${a.name} (${i + 1})` : `Empty (${i + 1})`;
      b.innerHTML = `<span class="key">${i + 1}</span><span class="glyph"></span><span class="name"></span><span class="cd"></span>`;
      b.querySelector('.glyph').textContent = a ? a.glyph : '·';
      b.querySelector('.name').textContent = a ? a.name.toUpperCase() : '';
      b.addEventListener('click', () => handlers.ability(i));
      el.append(b);
    });
  }

  function updateBar(player, tick, frac) {
    const slots = $('hotbar').children;
    const now = tick + frac;
    bar.forEach((id, i) => {
      const a = id && ABILITIES[id];
      if (!a) return;
      const until = Math.max(player.gcdUntil, player.cds[id] || 0);
      const total = until === player.gcdUntil && !(player.cds[id] > player.gcdUntil) ? GCD : Math.max(a.cd, GCD);
      const left = Math.max(0, until - now);
      slots[i].querySelector('.cd').style.height = `${Math.min(100, (left / total) * 100)}%`;
      slots[i].classList.toggle('unusable', !!a.oil && player.oil < a.oil);
    });
  }

  function flashSlot(i) {
    const s = $('hotbar').children[i];
    if (!s) return;
    s.classList.add('flash');
    setTimeout(() => s.classList.remove('flash'), 150);
  }

  // ---------- Status und Ziel ----------
  function updateStatus(p, place) {
    $('st-place').textContent = place;
    $('st-class').textContent = `WARDEN LV ${p.level}`;
    $('hp-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
    $('hp-text').textContent = `${Math.max(0, p.hp)}/${p.maxHp}`;
    $('fuel-fill').style.width = `${p.oil}%`;
    $('fuel-text').textContent = String(Math.ceil(p.oil));
  }

  function updateTarget(mob, note) {
    const el = $('target');
    if (!mob) { el.hidden = true; return; }
    el.hidden = false;
    $('target-name').textContent = `[ ${mob.name.toUpperCase()} ]`;
    $('target-fill').style.width = `${(mob.hp / mob.maxHp) * 100}%`;
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
      b.innerHTML = '<span class="verb"></span> <span class="noun"></span>';
      b.querySelector('.verb').textContent = e.verb;
      b.querySelector('.noun').textContent = e.noun || '';
      b.addEventListener('click', () => { closeMenu(); e.fn?.(); });
      menu.append(b);
    }
    menu.hidden = false;
    const r = menu.getBoundingClientRect();
    menu.style.left = `${Math.min(x, window.innerWidth - r.width - 4)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - r.height - 4)}px`;
    menu.querySelector('button')?.focus({ preventScroll: true });
  }
  function closeMenu() { menu.hidden = true; }
  const menuOpen = () => !menu.hidden;

  // ---------- Dialog ----------
  function openDialog(npcId, name, pageKey) {
    const page = TALK[npcId]?.[pageKey];
    if (!page) { closeDialog(); return; }
    dialogNpc = npcId;
    dialog.hidden = false;
    $('dialog-name').textContent = `[ ${name.toUpperCase()} ]`;
    $('dialog-text').textContent = page.text;
    if (page.action) handlers.dialogAction(npcId, page.action);
    const opts = $('dialog-options');
    opts.replaceChildren();
    page.options.forEach(([label, next], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `[ ${i + 1}. ${label} ]`;
      b.addEventListener('click', () => (next ? openDialog(npcId, name, next) : closeDialog()));
      opts.append(b);
    });
  }
  function closeDialog() { dialog.hidden = true; dialogNpc = null; }
  // Zahlentasten wählen im Dialog Antworten statt Fähigkeiten.
  function dialogKey(n) {
    if (dialog.hidden) return false;
    const b = $('dialog-options').children[n - 1];
    if (b) b.click();
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

  // ---------- Knöpfe ----------
  $('btn-crt').addEventListener('click', () => {
    const on = !document.documentElement.classList.toggle('crt-on') ? false : true;
    $('btn-crt').textContent = `[ CRT: ${on ? 'ON' : 'OFF'} ]`;
    handlers.crt(on);
    try { localStorage.setItem('overnight2.crt', on ? '1' : '0'); } catch { /* egal */ }
  });
  $('btn-help').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });
  $('btn-help-close').addEventListener('click', () => { $('help').hidden = true; });

  return {
    log, buildBar, updateBar, flashSlot, updateStatus, updateTarget,
    openMenu, closeMenu, menuOpen, openDialog, closeDialog, dialogKey,
    get dialogNpc() { return dialogNpc; },
    setHover, floater, overhead,
  };
}
