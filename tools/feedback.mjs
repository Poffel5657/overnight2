// Rückmeldungen der Spieler lesen („A Note for the Maker“). Nur für Chris.
//   npm run feedback            ungelesene zeigen und als gelesen markieren
//   npm run feedback -- --all   die letzten 200, gelesen oder nicht (markiert nichts)
// Schlüssel: ADMIN_KEY aus der Umgebung oder ~/.config/overnight2/admin-key.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const SERVER = process.env.SERVER || 'https://overnight2.overnight-rpg.workers.dev';
const key = process.env.ADMIN_KEY || readFileSync(`${homedir()}/.config/overnight2/admin-key`, 'utf8').trim();
const all = process.argv.includes('--all');
const headers = { 'X-Admin-Key': key, 'Content-Type': 'application/json' };

const res = await fetch(`${SERVER}/api/admin/feedback${all ? '' : '?unread=1'}`, { headers });
if (!res.ok) { console.error(`Fehler ${res.status}`); process.exit(1); }
const { feedback } = await res.json();
if (!feedback.length) { console.log(all ? 'Noch keine Rückmeldungen.' : 'Keine neuen Rückmeldungen.'); process.exit(0); }

for (const f of [...feedback].reverse()) {
  const when = new Date(f.created_at).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  let ctx = '';
  try {
    const c = JSON.parse(f.context || '{}');
    ctx = [c.region, c.cls && `${c.cls} ${c.level ?? ''}`.trim(), c.touch ? 'Handy' : null, c.screen, c.build && `Stand ${c.build}`].filter(Boolean).join(', ');
  } catch { /* egal */ }
  console.log(`#${f.id}  ${when}  [${f.kind}]  ${f.name}${f.read_at ? '  (gelesen)' : ''}`);
  if (ctx) console.log(`    ${ctx}`);
  for (const line of f.text.split('\n')) console.log(`    > ${line}`);
  console.log('');
}

if (!all) {
  await fetch(`${SERVER}/api/admin/feedback/read`, { method: 'POST', headers, body: JSON.stringify({ ids: feedback.map((f) => f.id) }) });
  console.log(`${feedback.length} als gelesen markiert.`);
}
