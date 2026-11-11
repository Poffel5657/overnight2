// Oberfläche anpassen: jedes Teil verschieben (Griff: Titelleiste oder .grip) und einzeln
// skalieren (Griff unten rechts, Doppelklick = 100 %). Kein Teil verlässt das Browserfenster.
// Lage und Größe bleiben im Browser. Auf schmalen Bildschirmen (Handy-Layout) bleibt alles fest.

const KEY = 'overnight2.layout';
const MIN_SCALE = 0.6;
const MAX_SCALE = 1.8;
const narrow = () => window.matchMedia('(max-width: 720px)').matches;

let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { saved = {}; }
const items = new Map(); // id -> el

function store() {
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* egal */ }
}

const zoomOf = (el) => Number(el.style.zoom) || 1;

// left/top eines gezoomten Elements werden mit dem Zoom multipliziert: hier zurückrechnen.
function setXY(el, x, y) {
  const z = zoomOf(el);
  el.style.left = `${x / z}px`;
  el.style.top = `${y / z}px`;
}

// Ganz ins Fenster holen. force: auch dann fest platzieren, wenn es noch am Standardplatz steht.
function clamp(el, force = false) {
  if (narrow()) return;
  let r = el.getBoundingClientRect();
  if (!r.width && !r.height) return; // verborgen
  const W = window.innerWidth;
  const H = window.innerHeight;
  const inside = r.left >= 0 && r.top >= 0 && r.right <= W && r.bottom <= H;
  if (inside && !force) return;
  if (!el.classList.contains('moved')) {
    el.classList.add('moved');
    setXY(el, r.left, r.top);
    r = el.getBoundingClientRect();
  }
  const x = Math.max(0, Math.min(W - r.width, r.left));
  const y = Math.max(0, Math.min(H - r.height, r.top));
  setXY(el, x, y);
}

// Gespeicherten Zustand anwenden: Lage als Anteil am Fenster, Größe als Faktor.
function apply(el, st) {
  if (narrow() || !st) {
    el.classList.remove('moved');
    el.style.left = el.style.top = el.style.zoom = '';
    return;
  }
  el.style.zoom = st.s && st.s !== 1 ? String(st.s) : '';
  if (st.x !== undefined) {
    el.classList.add('moved');
    setXY(el, st.x * window.innerWidth, st.y * window.innerHeight);
  }
  clamp(el);
}

function remember(id, el) {
  const r = el.getBoundingClientRect();
  const st = saved[id] || {};
  if (el.classList.contains('moved')) {
    st.x = r.left / window.innerWidth;
    st.y = r.top / window.innerHeight;
  }
  st.s = zoomOf(el);
  saved[id] = st;
  store();
}

export function makeDraggable(el, id, handle = el) {
  items.set(id, el);
  handle.classList.add('drag-handle');

  // Verschieben
  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || narrow() || e.target.closest('button, input, textarea, a, .slot, .scaler')) return;
    e.preventDefault();
    clamp(el, true);
    const r = el.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    el.classList.add('dragging');
    handle.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const x = Math.max(0, Math.min(window.innerWidth - r.width, ev.clientX - dx));
      const y = Math.max(0, Math.min(window.innerHeight - r.height, ev.clientY - dy));
      setXY(el, x, y);
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      el.classList.remove('dragging');
      remember(id, el);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });

  // Skalieren: Griff unten rechts, die linke obere Ecke bleibt stehen
  const scaler = document.createElement('span');
  scaler.className = 'scaler';
  scaler.title = 'Drag to resize (double-click: 100%)';
  scaler.setAttribute('aria-hidden', 'true');
  el.append(scaler);
  scaler.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || narrow()) return;
    e.preventDefault();
    e.stopPropagation();
    clamp(el, true);
    const r = el.getBoundingClientRect();
    const s0 = zoomOf(el);
    el.classList.add('dragging');
    scaler.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const f = ((ev.clientX - r.left) / r.width + (ev.clientY - r.top) / r.height) / 2;
      const s = Math.round(Math.max(MIN_SCALE, Math.min(MAX_SCALE, s0 * f)) * 20) / 20;
      el.style.zoom = String(s);
      setXY(el, r.left, r.top);
      clamp(el);
    };
    const up = () => {
      scaler.removeEventListener('pointermove', move);
      scaler.removeEventListener('pointerup', up);
      scaler.removeEventListener('pointercancel', up);
      el.classList.remove('dragging');
      remember(id, el);
    };
    scaler.addEventListener('pointermove', move);
    scaler.addEventListener('pointerup', up);
    scaler.addEventListener('pointercancel', up);
  });
  scaler.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    const r = el.getBoundingClientRect();
    el.style.zoom = '';
    if (el.classList.contains('moved')) setXY(el, r.left, r.top);
    clamp(el);
    remember(id, el);
  });

  // Größe ändert sich (Inhalt, Einblenden): wieder ins Fenster holen
  new ResizeObserver(() => clamp(el)).observe(el);
  requestAnimationFrame(() => apply(el, saved[id]));
}

export function hasSaved(id) {
  return saved[id]?.x !== undefined && !narrow();
}

// Alles zurück an den Standardplatz und auf 100 % (Settings)
export function resetLayout() {
  saved = {};
  store();
  for (const el of items.values()) apply(el, null);
}

// Verschwundene Fenster (z. B. geschlossene) vergessen
export function forget(id) {
  items.delete(id);
}

window.addEventListener('resize', () => {
  for (const [id, el] of items) apply(el, saved[id]);
});
