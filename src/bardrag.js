// Ziehen auf die Leiste: Fähigkeiten und Gegenstände (Attribut data-bar-id) auf ein Feld ziehen.
// Felder der Leiste lassen sich untereinander tauschen (der Server tauscht selbst, siehe setBar in
// shared/sim.js) oder von der Leiste wegziehen, dann wird das Feld leer.
// Nur Maus und Stift. Touch behält das Menü „Put on bar“ (Finger würde sonst das Scrollen stören).

const THRESHOLD = 6; // Pixel, ab denen aus einem Klick ein Ziehen wird

export function initBarDrag({ hotbar, getBar, assign }) {
  let pend = null;    // { x, y, id, from, src }
  let ghost = null;
  let target = null;
  let swallowClick = false;

  const slotAt = (x, y) => document.elementFromPoint(x, y)?.closest('#hotbar .slot') || null;

  function mark(el) {
    if (target === el) return;
    target?.classList.remove('drop-target');
    target = el;
    target?.classList.add('drop-target');
  }

  function stop() {
    ghost?.remove();
    ghost = null;
    mark(null);
    pend = null;
    hotbar.classList.remove('drop-ready');
    document.body.classList.remove('bar-dragging');
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const slot = e.target.closest('#hotbar .slot');
    let id = null;
    let from = -1;
    let src = null;
    if (slot) {
      from = [...hotbar.children].indexOf(slot);
      id = getBar()[from] || null;
      src = slot;
    } else {
      src = e.target.closest('[data-bar-id]');
      id = src?.dataset.barId || null;
    }
    if (!id) return;
    pend = { x: e.clientX, y: e.clientY, id, from, src };
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (!pend) return;
    if (!ghost) {
      if (Math.hypot(e.clientX - pend.x, e.clientY - pend.y) < THRESHOLD) return;
      const icon = pend.src.querySelector('.icon, .glyph');
      ghost = document.createElement('div');
      ghost.className = 'bar-ghost';
      if (icon) ghost.append(icon.cloneNode(true));
      document.body.append(ghost);
      hotbar.classList.add('drop-ready');
      document.body.classList.add('bar-dragging');
      window.getSelection()?.removeAllRanges();
    }
    e.preventDefault();
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    mark(slotAt(e.clientX, e.clientY));
  }, true);

  document.addEventListener('pointerup', (e) => {
    if (!pend) return;
    if (ghost) {
      const slot = slotAt(e.clientX, e.clientY);
      const to = slot ? [...hotbar.children].indexOf(slot) : -1;
      if (to >= 0 && to !== pend.from) assign(to, pend.id);
      else if (to < 0 && pend.from >= 0) assign(pend.from, null);
      // Der Klick nach dem Loslassen soll nichts auslösen (kein Zauber, kein Benutzen).
      swallowClick = true;
      setTimeout(() => { swallowClick = false; }, 0);
    }
    stop();
  }, true);

  document.addEventListener('pointercancel', stop, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ghost) stop(); }, true);
  document.addEventListener('click', (e) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  return { get dragging() { return !!ghost; } };
}
