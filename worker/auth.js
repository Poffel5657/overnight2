// Passwörter und Anmelde-Tokens. Nur Web Crypto, keine eigenen Verfahren.

const enc = new TextEncoder();
// Mehr lässt PBKDF2 in Workers nicht zu.
const ITERATIONS = 100000;

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)));

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return { hash: hex(bits), salt: hex(salt) };
}

// Vergleich in konstanter Zeit, damit die Antwortzeit nichts verrät.
export function sameHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function tokenHash(token) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(token)));
}

export const SESSION_DAYS = 30;

export async function createSession(db, accountId) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 86400000;
  await db.prepare('INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)')
    .bind(await tokenHash(token), accountId, expires).run();
  return token;
}

// Konto zu einem Token, oder null.
export async function accountForToken(db, token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 128) return null;
  const row = await db.prepare(
    'SELECT a.id, a.name, s.expires_at FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ?',
  ).bind(await tokenHash(token)).first();
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, name: row.name };
}
