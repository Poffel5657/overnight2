// Rauchtest im Browser: Seite offline laden, ein paar Fenster öffnen, keine Fehler. Speichert Bilder
// (PC und Handy) unter smoke/, damit Gate und Nachtlauf sie ansehen können.
// Aufruf: node tools/smoke.mjs [port]   (startet selbst einen kleinen Webserver auf dem Port, Standard 4190)
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = Number(process.argv[2] || 4190);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = path.endsWith('/') ? `${path}index.html` : path;
  try {
    const body = await readFile(join(ROOT, file));
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT);

const errors = [];
// PW_CHROME: eigener Chromium-Pfad (lokal, wenn die Headless-Shell fehlt)
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
await mkdir(join(ROOT, 'smoke'), { recursive: true });
for (const [name, viewport] of [['pc', { width: 1400, height: 850 }], ['phone', { width: 390, height: 800 }]]) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name} console: ${m.text()}`); });
  await page.addInitScript(() => { localStorage.setItem('overnight2.newsSeen', '-1'); });
  await page.goto(`http://127.0.0.1:${PORT}/?offline=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(ROOT, 'smoke', `${name}-start.png`) });
  for (const key of ['Escape', 'c', 'b', 'j', 'o']) { await page.keyboard.press(key); await page.waitForTimeout(250); }
  await page.screenshot({ path: join(ROOT, 'smoke', `${name}-windows.png`) });
  const ok = await page.evaluate(() => !!window.overnightDebug?.me());
  if (!ok) errors.push(`${name}: Spielfigur fehlt (Welt nicht geladen)`);
  await page.close();
}
await browser.close();
server.close();
if (errors.length) {
  console.error(`Rauchtest: ${errors.length} Fehler`);
  for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
  process.exit(1);
}
console.log('Rauchtest: Seite lädt, Fenster öffnen sich, keine Fehler. Bilder in smoke/.');
