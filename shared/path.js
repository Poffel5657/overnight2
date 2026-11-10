// Wegfindung auf dem Feldraster: A* mit acht Richtungen, ohne Ecken abzuschneiden.
// Reine Funktion, läuft im Browser und später auf dem Server.

const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

// walkable(x, y) -> bool, isGoal(x, y) -> bool, hx/hy: Ziel für die Schätzung.
// Gibt die Felder ohne den Start zurück, [] wenn man schon am Ziel ist, null wenn kein Weg existiert.
export function findPath(w, h, walkable, sx, sy, isGoal, hx, hy, maxNodes = 6000) {
  if (isGoal(sx, sy)) return [];
  const key = (x, y) => y * w + x;
  const g = new Map([[key(sx, sy), 0]]);
  const from = new Map();
  const open = [{ x: sx, y: sy, f: 0 }];
  const closed = new Set();
  const heur = (x, y) => {
    const dx = Math.abs(x - hx), dy = Math.abs(y - hy);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  let visited = 0;
  while (open.length && visited < maxNodes) {
    // Kleine Karten: lineare Suche nach dem besten Knoten reicht.
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open[bi];
    open[bi] = open[open.length - 1];
    open.pop();
    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    closed.add(ck);
    visited++;
    if (isGoal(cur.x, cur.y)) {
      const out = [];
      let k = ck;
      while (k !== key(sx, sy)) {
        out.push({ x: k % w, y: Math.floor(k / w) });
        k = from.get(k);
      }
      return out.reverse();
    }
    for (const [dx, dy, cost] of DIRS) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!walkable(nx, ny)) continue;
      if (dx && dy && (!walkable(cur.x + dx, cur.y) || !walkable(cur.x, cur.y + dy))) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const ng = g.get(ck) + cost;
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        from.set(nk, ck);
        open.push({ x: nx, y: ny, f: ng + heur(nx, ny) });
      }
    }
  }
  return null;
}

// Ein Schritt auf ein Ziel zu, ohne volle Suche (für Wesen). Gibt das beste Nachbarfeld oder null.
export function stepToward(walkable, x, y, tx, ty, away = false) {
  let best = null;
  let bestScore = away ? -Infinity : Math.hypot(tx - x, ty - y);
  for (const [dx, dy] of DIRS) {
    const nx = x + dx, ny = y + dy;
    if (!walkable(nx, ny)) continue;
    if (dx && dy && (!walkable(x + dx, y) || !walkable(x, y + dy))) continue;
    const s = Math.hypot(tx - nx, ty - ny);
    if (away ? s > bestScore : s < bestScore) {
      bestScore = s;
      best = { x: nx, y: ny };
    }
  }
  return best;
}

// Abstand in Feldern, wie man ihn beim Laufen zählt (Diagonale = 1).
export function cheb(ax, ay, bx, by) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}
