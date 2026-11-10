// Prüfsumme über alles, was Server und Browser gemeinsam ausführen (shared/, content/, worker/).
// Schreibt shared/build.js. Aufruf: npm run sig (vor jedem Commit; tools/check-world.mjs prüft, ob sie stimmt).
// Seite und Server vergleichen sie beim Anmelden: Ist der Server älter, startet sein Gebietsraum neu.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIRS = ['shared', 'content', 'worker'];
const OUT = join(ROOT, 'shared', 'build.js');

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return p.endsWith('.js') && p !== OUT ? [p] : [];
  });
}

export function computeBuild() {
  let h = 2166136261;
  for (const f of DIRS.flatMap((d) => files(join(ROOT, d))).sort()) {
    const text = relative(ROOT, f) + '\n' + readFileSync(f, 'utf8');
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(36);
}

export function buildFile(sig) {
  return `// Erzeugt von tools/build-sig.mjs (npm run sig). Nicht von Hand ändern.\nexport const BUILD = '${sig}';\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sig = computeBuild();
  writeFileSync(OUT, buildFile(sig));
  console.log(`shared/build.js: ${sig}`);
}
