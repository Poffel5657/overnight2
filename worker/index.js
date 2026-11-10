// Spiel-Server von Overnight 2 (Cloudflare Worker).
//   POST /api/register, /api/login   Name + Passwort -> Token
//   POST /api/logout                 Token ungültig machen
//   GET  /api/me                     Wer bin ich?
//   GET  /api/play                   WebSocket ins Gebiet (Durable Object RegionRoom)
// Das Token schickt der Browser im Header (Authorization: Bearer …) bzw. als erste WebSocket-Nachricht.

import { RegionRoom } from './region.js';
import { hashPassword, sameHex, createSession, accountForToken, tokenHash } from './auth.js';

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
  } catch {
    return json(cors, 409, { error: 'That name is already written in the ledger.' });
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

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsFor(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/api/play') {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
      const origin = req.headers.get('Origin');
      if (origin && !allowedOrigins(env).includes(origin)) return new Response('Forbidden', { status: 403 });
      // Heute gibt es ein Gebiet. Weitere bekommen eigene Räume (idFromName(regionId)).
      const room = env.REGION.get(env.REGION.idFromName('kindle'));
      return room.fetch(req);
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
    } catch (err) {
      console.error(err);
      return json(cors, 500, { error: 'The Beacon flickered. Try again.' });
    }
    return json(cors, 404, { error: 'Not found' });
  },
};
