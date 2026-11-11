// Zahlen überall in der Oberfläche in der Ziffern-Schrift (VT323): Jede Ziffernfolge in einem Text
// wird in <span class="num"> gesetzt. Ein MutationObserver erledigt das auch für Text, der später kommt.
// Ausgenommen: Eingabefelder, die Welt (Canvas) und Stellen, die schon die Ziffern-Schrift haben.

const DIGITS = /\d+(?:[.:,]\d+)*/g;
const SKIP = 'input, textarea, script, style, canvas, .num, svg';

function hasNumFont(el) {
  return getComputedStyle(el).fontFamily.startsWith('VT323') || getComputedStyle(el).fontFamily.startsWith('"VT323"');
}

function numifyText(node) {
  const text = node.nodeValue;
  if (!text || !/\d/.test(text)) return;
  const parent = node.parentElement;
  if (!parent || parent.closest(SKIP) || hasNumFont(parent)) return;
  DIGITS.lastIndex = 0;
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(DIGITS)) {
    if (m.index > last) frag.append(text.slice(last, m.index));
    const s = document.createElement('span');
    s.className = 'num';
    s.textContent = m[0];
    frag.append(s);
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.append(text.slice(last));
  node.replaceWith(frag);
}

function walk(root) {
  if (root.nodeType === Node.TEXT_NODE) { numifyText(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE || root.matches?.(SKIP)) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (tw.nextNode()) nodes.push(tw.currentNode);
  for (const n of nodes) numifyText(n);
}

export function startNumerals(root = document.body) {
  walk(root);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') numifyText(m.target);
      else for (const n of m.addedNodes) walk(n);
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
