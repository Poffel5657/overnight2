// Hält die Seite auf dem neuesten Stand. deploy.yml schreibt die Commit-Kennung in <meta name="build">
// und nach build.json. Wir fragen build.json regelmäßig ab (ohne Cache). Ist dort eine neuere Kennung,
// holen wir index.html frisch (am Browser-Cache vorbei) und laden neu. CSS und Skripte liegen pro
// Version unter v/<commit>/, also kommen sie danach von selbst neu.
// Lokal (ohne Meta-Tag) ist die Prüfung aus.

const own = document.querySelector('meta[name="build"]')?.content || null;
const TRIES_KEY = 'overnight2.updateTries';
const EVERY_MS = 60_000;
let busy = false;
let timer = null;
let waiting = false; // Hinweis „ONE MOMENT“ steht

async function latest() {
  try {
    const res = await fetch(`build.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    return typeof j.sha === 'string' ? j.sha : null;
  } catch {
    return null;
  }
}

// Höchstens drei Versuche pro neuer Version, damit ein hängender Cache keine Neuladeschleife baut.
function tries(sha) {
  try {
    const t = JSON.parse(sessionStorage.getItem(TRIES_KEY) || '{}');
    return t.sha === sha ? t.n : 0;
  } catch {
    return 0;
  }
}
function countTry(sha) {
  try { sessionStorage.setItem(TRIES_KEY, JSON.stringify({ sha, n: tries(sha) + 1 })); } catch { /* egal */ }
}

// banner(text): zeigt den Hinweis oben; beforeReload(): z. B. Offline-Spielstand sichern.
export function watchUpdates({ banner, beforeReload }) {
  if (!own) return { check: () => {}, serverAhead: () => banner('KINDLE HAS CHANGED. TAP HERE TO RELOAD.') };

  async function check() {
    if (busy) return;
    busy = true;
    try {
      const sha = await latest();
      if (sha === own && waiting) { waiting = false; banner(null); }
      if (!sha || sha === own) return;
      if (tries(sha) >= 3) {
        banner('KINDLE HAS CHANGED. TAP HERE TO RELOAD.');
        return;
      }
      countTry(sha);
      banner('KINDLE HAS CHANGED. UPDATING…');
      try { await fetch(location.href, { cache: 'reload' }); } catch { /* egal, Neuladen versucht es trotzdem */ }
      try { beforeReload?.(); } catch { /* egal */ }
      location.reload();
    } finally {
      busy = false;
    }
  }

  // Server neuer als Seite (nach dem Deploy kommt die Seite etwa eine Minute später): öfter fragen.
  function serverAhead() {
    banner('KINDLE IS CHANGING. ONE MOMENT…');
    waiting = true;
    clearInterval(timer);
    timer = setInterval(check, 10_000);
    // Nach zehn Minuten wieder im normalen Takt fragen.
    setTimeout(() => { clearInterval(timer); timer = setInterval(check, EVERY_MS); }, 600_000);
    // Erst nach einer Pause fragen: Seite und build.json kommen gemeinsam, kurz nach dem Server.
    setTimeout(check, 3000);
  }

  timer = setInterval(check, EVERY_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  check();
  return { check, serverAhead };
}
