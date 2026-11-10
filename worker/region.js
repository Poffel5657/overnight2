// Ein Gebiet als Durable Object: hält die Welt im Speicher, rechnet sie im Takt und schickt jedem
// Spieler seinen Stand. Spielstände liegen in D1 (characters) und werden beim Gehen,
// alle 30 Sekunden und beim Aufwachen am Lagerfeuer gespeichert.
// Die Welt selbst (Wesen, angezündete Feuer) lebt nur im Speicher: Ist niemand da, darf sie verfallen.

import { REGION } from '../content/regions/kindle.js';
import { TICK_MS, createWorld, step, addPlayer, removePlayer, saveOf, drainEvents } from '../shared/sim.js';
import { parseIntent, applyIntent, welcomeFor, tickFor } from '../shared/protocol.js';
import { skyState } from '../shared/daylight.js';
import { accountForToken } from './auth.js';

export const MAX_PLAYERS = 100;

// Für die Bestenliste: höchste Klassenstufe und gesammelte Erfahrung über alle Klassen.
const bestLevel = (save) => Math.max(1, ...Object.values(save.classes || {}).map((c) => c.level));
const totalXp = (save) => Object.values(save.classes || {}).reduce((s, c) => s + c.xp, 0);
const HELLO_TIMEOUT_MS = 10000;
const SAVE_EVERY_TICKS = 100;
// Token-Bucket pro Verbindung: so viele Nachrichten auf einmal, danach BUCKET_RATE pro Sekunde.
const BUCKET_SIZE = 30;
const BUCKET_RATE = 15;
const MAX_STRIKES = 50;

export class RegionRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.world = null;
    // WebSocket -> { pid, accountId, known, tokens, at, strikes }
    this.conns = new Map();
    this.loop = null;
  }

  ensureWorld() {
    if (!this.world) this.world = createWorld(REGION, Math.floor(Math.random() * 2 ** 31));
    return this.world;
  }

  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    const conn = { pid: null, accountId: null, known: new Set(), tokens: BUCKET_SIZE, at: Date.now(), strikes: 0 };
    this.conns.set(server, conn);
    const helloTimer = setTimeout(() => { if (!conn.pid) this.drop(server, 4001, 'No hello'); }, HELLO_TIMEOUT_MS);
    server.addEventListener('message', (e) => this.onMessage(server, conn, e.data).catch((err) => {
      console.error(err);
      this.drop(server, 1011, 'Server error');
    }));
    const bye = () => { clearTimeout(helloTimer); this.leave(server); };
    server.addEventListener('close', bye);
    server.addEventListener('error', bye);
    return new Response(null, { status: 101, webSocket: client });
  }

  async onMessage(ws, conn, raw) {
    // Zu viele Nachrichten: verwerfen, bei Dauerfeuer trennen.
    const now = Date.now();
    conn.tokens = Math.min(BUCKET_SIZE, conn.tokens + ((now - conn.at) / 1000) * BUCKET_RATE);
    conn.at = now;
    if (conn.tokens < 1) {
      if (++conn.strikes > MAX_STRIKES) this.drop(ws, 4003, 'Too many messages');
      return;
    }
    conn.tokens -= 1;
    conn.strikes = 0;

    const msg = parseIntent(typeof raw === 'string' ? raw : '');
    if (!msg) return;
    if (msg.t === 'hello') {
      if (!conn.pid) await this.join(ws, conn, msg.token);
      return;
    }
    if (!conn.pid || msg.t === 'ping') return;
    applyIntent(this.world, conn.pid, msg);
  }

  async join(ws, conn, token) {
    const account = await accountForToken(this.env.DB, token);
    if (!account) return this.drop(ws, 4001, 'Bad token');
    if (!this.conns.has(ws)) return;
    // Dasselbe Konto ist schon da (zweiter Tab): der alte Platz wird frei.
    for (const [other, c] of this.conns) {
      if (other !== ws && c.accountId === account.id) {
        await this.leave(other);
        this.drop(other, 4002, 'Signed in elsewhere');
      }
    }
    const playing = [...this.conns.values()].filter((c) => c.pid).length;
    if (playing >= MAX_PLAYERS) {
      ws.send(JSON.stringify({ t: 'error', error: 'Kindle is full tonight. Try again soon.' }));
      return this.drop(ws, 4004, 'Full');
    }
    const row = await this.env.DB.prepare('SELECT data FROM characters WHERE account_id = ?').bind(account.id).first();
    let save = null;
    try { save = row ? JSON.parse(row.data) : null; } catch { save = null; }
    const world = this.ensureWorld();
    const pid = `p${account.id}`;
    conn.pid = pid;
    conn.accountId = account.id;
    addPlayer(world, pid, account.name, save);
    ws.send(JSON.stringify(welcomeFor(world, pid)));
    world.events.push({ type: 'log', text: `${account.name} steps into the light of the Beacon.`, cls: 'sys' });
    this.start();
  }

  start() {
    if (this.loop) return;
    this.loop = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    const world = this.world;
    if (!world || world.players.size === 0) {
      clearInterval(this.loop);
      this.loop = null;
      return;
    }
    world.daylight = skyState(new Date()).day;
    const events = [...step(world)];
    for (const [ws, conn] of this.conns) {
      if (!conn.pid) continue;
      try {
        ws.send(JSON.stringify(tickFor(world, conn.pid, conn.known)));
      } catch {
        this.leave(ws);
      }
    }
    drainEvents(world);
    // Nach einer Niederlage sofort speichern, sonst alle 30 Sekunden.
    const respawned = new Set(events.filter((e) => e.type === 'respawn').map((e) => e.to));
    if (world.tick % SAVE_EVERY_TICKS === 0 || respawned.size) {
      const which = world.tick % SAVE_EVERY_TICKS === 0 ? null : respawned;
      this.saveAll(which).catch((err) => console.error('save failed', err));
    }
  }

  async saveAll(only = null) {
    const stmts = [];
    for (const conn of this.conns.values()) {
      if (!conn.pid || (only && !only.has(conn.pid))) continue;
      const p = this.world.players.get(conn.pid);
      if (p) stmts.push(this.saveStmt(conn.accountId, saveOf(p)));
    }
    if (stmts.length) await this.env.DB.batch(stmts);
  }

  saveStmt(accountId, save) {
    return this.env.DB.prepare(
      `INSERT INTO characters (account_id, region, data, level, xp, updated_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(account_id) DO UPDATE SET region = excluded.region, data = excluded.data,
       level = excluded.level, xp = excluded.xp, updated_at = excluded.updated_at`,
    ).bind(accountId, REGION.id, JSON.stringify(save), bestLevel(save), totalXp(save), Date.now());
  }

  async leave(ws) {
    const conn = this.conns.get(ws);
    if (!conn) return;
    this.conns.delete(ws);
    if (!conn.pid || !this.world) return;
    const p = this.world.players.get(conn.pid);
    const name = p?.name;
    const save = removePlayer(this.world, conn.pid);
    if (name) this.world.events.push({ type: 'log', text: `${name} leaves the light.`, cls: 'sys' });
    if (save) {
      try { await this.saveStmt(conn.accountId, save).run(); } catch (err) { console.error('save on leave failed', err); }
    }
  }

  drop(ws, code, reason) {
    try { ws.close(code, reason); } catch { /* schon zu */ }
    this.leave(ws);
  }
}
