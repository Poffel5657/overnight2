// Spiel-Server von Overnight 2 (Cloudflare Worker).
//   POST /api/register, /api/login   Name + Passwort -> Token
//   POST /api/logout                 Token ungültig machen
//   GET  /api/me                     Wer bin ich?
//   GET  /api/play                   WebSocket ins Gebiet (Durable Object RegionRoom)
// Das Token schickt der Browser im Header (Authorization: Bearer …) bzw. als erste WebSocket-Nachricht.

import { RegionRoom } from './region.js';
import { hashPassword, sameHex, createSession, accountForToken, tokenHash } from './auth.js';
import { REGION_IDS, HOME_REGION } from '../content/regions/index.js';

export { RegionRoom };

const NAME = /^[A-Za-z][A-Za-z0-9_-]{2,15}$/;
// Namen, die nach Spielleitung oder Figuren aussehen würden.
const RESERVED = ['nightwright', 'claude', 'anthropic', 'admin', 'moderator', 'mod', 'system', 'server', 'kindle',
  'tallow', 'ama', 'pell', 'fen', 'rook', 'stranger', 'greyling', 'beacon'];
const MAX_BODY = 2048;

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function corsFor(req, env) {
  const origin = req.headers.get('Origin');
  if (!origin || !allowedOrigins(env).includes(origin)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (cors, status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

async function readBody(req) {
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) return null;
  const text = await req.text();
  if (text.length > MAX_BODY) return null;
  try { return JSON.parse(text); } catch { return null; }
}

async function limited(req, env) {
  if (!env.AUTH_LIMIT) return false;
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  const { success } = await env.AUTH_LIMIT.limit({ key: ip });
  return !success;
}

function bearer(req) {
  const h = req.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

async function register(req, env, cors) {
  if (await limited(req, env)) return json(cors, 429, { error: 'Too many tries. Wait a minute.' });
  const body = await readBody(req);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!NAME.test(name)) return json(cors, 400, { error: 'Names are 3-16 letters, digits, - or _, starting with a letter.' });
  if (RESERVED.some((r) => name.toLowerCase().includes(r))) return json(cors, 400, { error: 'That name belongs to someone in the world already.' });
  if (password.length < 8 || password.length > 128) return json(cors, 400, { error: 'Passwords need at least 8 characters.' });
  const { hash, salt } = await hashPassword(password);
  let accountId;
  try {
    const res = await env.DB.prepare('INSERT INTO accounts (name, name_lower, pass_hash, pass_salt, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(name, name.toLowerCase(), hash, salt, Date.now()).run();
    accountId = res.meta.last_row_id;
  } catch (err) {
    if (String(err?.message || err).includes('UNIQUE')) return json(cors, 409, { error: 'That name is already written in the ledger.' });
    throw err;
  }
  const token = await createSession(env.DB, accountId);
  return json(cors, 200, { token, name });
}

async function login(req, env, cors) {
  if (await limited(req, env)) return json(cors, 429, { error: 'Too many tries. Wait a minute.' });
  const body = await readBody(req);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const wrong = () => json(cors, 401, { error: 'Name or password is wrong.' });
  if (!NAME.test(name) || !password || password.length > 128) return wrong();
  const row = await env.DB.prepare('SELECT id, name, pass_hash, pass_salt FROM accounts WHERE name_lower = ?')
    .bind(name.toLowerCase()).first();
  if (!row) {
    // Trotzdem rechnen, damit die Antwortzeit nicht verrät, ob es den Namen gibt.
    await hashPassword(password);
    return wrong();
  }
  const { hash } = await hashPassword(password, row.pass_salt);
  if (!sameHex(hash, row.pass_hash)) return wrong();
  // Alte, abgelaufene Anmeldungen dieses Kontos aufräumen.
  await env.DB.prepare('DELETE FROM sessions WHERE account_id = ? AND expires_at < ?').bind(row.id, Date.now()).run();
  const token = await createSession(env.DB, row.id);
  return json(cors, 200, { token, name: row.name });
}

// ---------- Für den Nightwright: Gebete und Spenden lesen, Gebete als erhört markieren ----------
// Nur mit dem geheimen Schlüssel ADMIN_KEY (wrangler secret put ADMIN_KEY). Ohne Schlüssel gibt es die Wege nicht.

async function admin(req, env, url) {
  const key = req.headers.get('X-Admin-Key') || '';
  if (!env.ADMIN_KEY || key.length !== env.ADMIN_KEY.length || !sameHex(key, env.ADMIN_KEY)) return new Response('Not found', { status: 404 });
  const plain = (data) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (url.pathname === '/api/admin/inbox' && req.method === 'GET') {
    const since = Number(url.searchParams.get('since') || 0);
    const ballot = Number(url.searchParams.get('ballot') || 0);
    const prayers = await env.DB.prepare(
      'SELECT p.id, p.date, p.text, p.created_at, a.name FROM prayers p JOIN accounts a ON a.id = p.account_id WHERE p.created_at > ? ORDER BY p.created_at LIMIT 500',
    ).bind(since).all();
    const votes = await env.DB.prepare('SELECT option, SUM(gold) AS gold, COUNT(DISTINCT account_id) AS donors FROM donations WHERE ballot = ? GROUP BY option').bind(ballot).all();
    const beacon = await env.DB.prepare("SELECT key, value FROM world_state WHERE key LIKE 'beacon:%' ORDER BY key DESC LIMIT 7").all();
    const players = await env.DB.prepare('SELECT COUNT(*) AS n, SUM(updated_at > ?) AS active FROM characters').bind(Date.now() - 86400000).first();
    return plain({ prayers: prayers.results, votes: votes.results, beacon: beacon.results, players });
  }
  if (url.pathname === '/api/admin/answer' && req.method === 'POST') {
    const body = await readBody(req);
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Number.isInteger).slice(0, 100) : [];
    const note = typeof body?.note === 'string' ? body.note.slice(0, 200) : '';
    if (!ids.length) return plain({ updated: 0 });
    const res = await env.DB.prepare(`UPDATE prayers SET answered_at = ?, answer_note = ? WHERE id IN (${ids.map(() => '?').join(',')})`)
      .bind(Date.now(), note, ...ids).run();
    return plain({ updated: res.meta.changes });
  }
  return new Response('Not found', { status: 404 });
}

// Bestenliste: die zehn höchsten Charaktere (beste Klassenstufe, dann gesamte Erfahrung).
async function board(env, cors) {
  const { results } = await env.DB.prepare(
    'SELECT a.name, c.level, c.xp FROM characters c JOIN accounts a ON a.id = c.account_id ORDER BY c.level DESC, c.xp DESC LIMIT 10',
  ).all();
  return new Response(JSON.stringify({ top: results }), {
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsFor(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/api/play') {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
      const origin = req.headers.get('Origin');
      if (origin && !allowedOrigins(env).includes(origin)) return new Response('Forbidden', { status: 403 });
      // Ein Raum pro Gebiet. Das Gebiet nennt der Browser; der Raum prüft beim Anmelden, ob der
      // Charakter wirklich dort steht, und schickt ihn sonst an den richtigen Ort.
      const wanted = url.searchParams.get('region');
      const regionId = REGION_IDS.includes(wanted) ? wanted : HOME_REGION;
      const room = env.REGION.get(env.REGION.idFromName(regionId));
      const fwd = new Request(req);
      fwd.headers.set('X-Region', regionId);
      return room.fetch(fwd);
    }

    try {
      if (url.pathname === '/api/register' && req.method === 'POST') return await register(req, env, cors);
      if (url.pathname === '/api/login' && req.method === 'POST') return await login(req, env, cors);
      if (url.pathname === '/api/logout' && req.method === 'POST') {
        const token = bearer(req);
        if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await tokenHash(token)).run();
        return json(cors, 200, { ok: true });
      }
      if (url.pathname === '/api/me' && req.method === 'GET') {
        const acc = await accountForToken(env.DB, bearer(req));
        return acc ? json(cors, 200, { name: acc.name }) : json(cors, 401, { error: 'Not signed in.' });
      }
      if (url.pathname === '/api/health') return json(cors, 200, { ok: true });
      if (url.pathname === '/api/board' && req.method === 'GET') return await board(env, cors);
      if (url.pathname.startsWith('/api/admin/')) return await admin(req, env, url);
    } catch (err) {
      console.error(err);
      return json(cors, 500, { error: 'The Beacon flickered. Try again.' });
    }
    return json(cors, 404, { error: 'Not found' });
  },
};
