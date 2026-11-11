// Pixel-Symbole über Köpfen und Gebäuden, im Laternen-Stil:
// quest   = Laterne mit "!" (neue Aufgabe), bernsteinfarben
// turnin  = Laterne mit "?" (etwas abzugeben), mondsilbern
// pray    = Kerze (heute noch nicht gebetet / geopfert)
// stone   = weißer Stimmstein (eine Stimme am Altar)

const ART = {
  quest: {
    rows: [
      '....k....',
      '...k.k...',
      '..kkkkk..',
      '.kkkkkkk.',
      '.kYWdWYk.',
      '.kYWdWYk.',
      '.kYWdWYk.',
      '.kYWdWYk.',
      '.kYWWWYk.',
      '.kYWdWYk.',
      '.kkkkkkk.',
      '..kkkkk..',
    ],
    pal: { k: '#2a1c10', Y: '#ff9a2a', W: '#ffd870', d: '#4a1c08' },
  },
  turnin: {
    rows: [
      '....k....',
      '...k.k...',
      '..kkkkk..',
      '.kkkkkkk.',
      '.kBddWBk.',
      '.kBWWdBk.',
      '.kBWddBk.',
      '.kBWdWBk.',
      '.kBWWWBk.',
      '.kBWdWBk.',
      '.kkkkkkk.',
      '..kkkkk..',
    ],
    pal: { k: '#1c1e28', B: '#8ab4e8', W: '#e8f2ff', d: '#1a2a48' },
  },
  // Weißer Stimmstein (eine Stimme am Altar)
  stone: {
    rows: [
      '..bbbb..',
      '.bWWWWb.',
      'bWWWWSWb',
      'bWWWWWSb',
      'bWWWWWSb',
      'bSWWWSSb',
      '.bSSSSb.',
      '..bbbb..',
    ],
    pal: { b: '#3a3428', W: '#efe8d8', S: '#b8ae98' },
  },
  pray: {
    rows: [
      '....f....',
      '...fFf...',
      '...fFf...',
      '....f....',
      '...cwc...',
      '...cwc...',
      '...cwc...',
      '...cwc...',
      '..bbbbb..',
      '.bBBBBBb.',
    ],
    pal: { f: '#ff9a2a', F: '#fff0a0', c: '#d8c8a0', w: '#f4ecd8', b: '#6a4a20', B: '#c8a040' },
  },
};

const cache = new Map();
export function markerURL(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const a = ART[kind];
  if (!a) return null;
  const c = document.createElement('canvas');
  c.width = a.rows[0].length;
  c.height = a.rows.length;
  const ctx = c.getContext('2d');
  a.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!a.pal[ch]) return;
    ctx.fillStyle = a.pal[ch];
    ctx.fillRect(x, y, 1, 1);
  }));
  const url = c.toDataURL();
  cache.set(kind, url);
  return url;
}
