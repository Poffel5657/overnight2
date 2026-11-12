// Ein Gebiet als Durable Object: hält die Welt im Speicher, rechnet sie im Takt und schickt jedem
// Spieler seinen Stand. Spielstände liegen in D1 (characters) und werden beim Gehen,
// alle 30 Sekunden und beim Aufwachen am Lagerfeuer gespeichert.
// Die Welt selbst (Wesen, angezündete Feuer) lebt nur im Speicher: Ist niemand da, darf sie verfallen.

import { regionFor, isRegionId, HOME_REGION } from '../content/regions/index.js';
import { ARRIVE } from '../content/regions/kindle.js';
import { TICK_MS, createWorld, step, addPlayer, removePlayer, saveFor, drainEvents, travel } from '../shared/sim.js';
import { parseIntent, applyIntent, welcomeFor, tickFor } from '../shared/protocol.js';
import { applyParty } from '../shared/party.js';
import { regionDaylight, berlinDate } from '../shared/daylight.js';
import { BALLOT } from '../content/ballot.js';
import { accountForToken } from './auth.js';
import { CONTENT_SIG } from '../shared/version.js';

export const MAX_PLAYERS = 100;

// Für die Bestenliste: höchste Klassenstufe und gesammelte Erfahrung über alle Klassen.
const bestLevel = (save) => Math.max(1, ...Object.values(save.classes || {}).map((c) => c.level));
const totalXp = (save) => Object.values(save.classes || {}).reduce((s, c) => s + c.xp, 0);
const HELLO_TIMEOUT_MS = 10000;
const SAVE_EVERY_TICKS = 100;
const PARTY_REFRESH_TICKS = 33; // etwa 10 Sekunden
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
    this.regionId = null;
  }

  async ensureWorld() {
    if (this.world) return this.world;
    const date = berlinDate(new Date());
    const world = createWorld(regionFor(this.regionId, date), Math.floor(Math.random() * 2 ** 31));
    world.date = date;
    await this.loadCommunity(world);
    // Zwei Anmeldungen gleichzeitig: wer zuerst fertig ist, gewinnt.
    if (!this.world) this.world = world;
    return this.world;
  }

  // Gemeinschaftsstand des Tages aus D1 (Leuchtfeuer, Spenden für den aktuellen Zettel).
  async loadCommunity(world) {
    const beacon = await this.env.DB.prepare('SELECT value FROM world_state WHERE key = ?').bind(`beacon:${world.date}`).first();
    const { results } = await this.env.DB.prepare('SELECT option, COUNT(*) AS votes FROM donations WHERE ballot = ? GROUP BY option').bind(BALLOT.day).all();
    world.community = { beacon: beacon?.value ?? 0, ballot: Object.fromEntries(results.map((r) => [r.option, r.votes])) };
  }

  // Was die Simulation dauerhaft festhalten will.
  async flushOutbox(world) {
    if (!world.outbox.length) return;
    const items = world.outbox.splice(0);
    const now = Date.now();
    const stmts = [];
    for (const o of items) {
      const conn = [...this.conns.values()].find((c) => c.pid === o.pid);
      if (o.kind === 'beacon') {
        stmts.push(this.env.DB.prepare(`INSERT INTO world_state (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = value + excluded.value, updated_at = excluded.updated_at`).bind(`beacon:${o.date}`, o.add, now));
      } else if (o.kind === 'prayer' && conn) {
        stmts.push(this.env.DB.prepare('INSERT INTO prayers (account_id, date, text, created_at) VALUES (?, ?, ?, ?)').bind(conn.accountId, o.date, o.text, now));
      } else if (o.kind === 'party') {
        // Gruppe speichern; Mitglieder-IDs sind 'p' + Konto
        const acc = (pid) => Number(String(pid).slice(1));
        if (o.left) stmts.push(this.env.DB.prepare('DELETE FROM party_members WHERE account_id = ?').bind(acc(o.left)));
        if (o.disband) {
          stmts.push(this.env.DB.prepare('DELETE FROM party_members WHERE party_id = ?').bind(o.disband));
          stmts.push(this.env.DB.prepare('DELETE FROM parties WHERE id = ?').bind(o.disband));
        } else if (o.party) {
          stmts.push(this.env.DB.prepare('INSERT INTO parties (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(o.party.id, JSON.stringify(o.party), now));
          for (const m of o.party.members) {
            stmts.push(this.env.DB.prepare('INSERT INTO party_members (account_id, party_id) VALUES (?, ?) ON CONFLICT(account_id) DO UPDATE SET party_id = excluded.party_id').bind(acc(m.id), o.party.id));
          }
        }
      } else if (o.kind === 'vote' && conn) {
        // Tabelle heißt historisch donations; jede Zeile ist jetzt genau eine Stimme (gold = 1).
        stmts.push(this.env.DB.prepare('INSERT INTO donations (account_id, ballot, option, gold, created_at) VALUES (?, ?, ?, 1, ?)').bind(conn.accountId, o.ballot, o.option, now));
      }
    }
    if (stmts.length) await this.env.DB.batch(stmts);
  }

  // Erhörte Gebete, von denen der Spieler noch nichts weiß.
  async answeredFor(ws, accountId) {
    const { results } = await this.env.DB.prepare(
      'SELECT id, answer_note FROM prayers WHERE account_id = ? AND answered_at IS NOT NULL AND notified = 0',
    ).bind(accountId).all();
    if (!results.length) return;
    for (const r of results) {
      ws.send(JSON.stringify({ t: 'answered', note: r.answer_note || '' }));
    }
    await this.env.DB.prepare(`UPDATE prayers SET notified = 1 WHERE id IN (${results.map(() => '?').join(',')})`).bind(...results.map((r) => r.id)).run();
  }

  async fetch(req) {
    const id = req.headers.get('X-Region');
    if (!this.regionId) this.regionId = isRegionId(id) ? id : HOME_REGION;
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
      if (conn.pid) return;
      if (msg.sig && msg.sig !== CONTENT_SIG && await this.restartFor(msg.sig)) return;
      await this.join(ws, conn, msg.token);
      return;
    }
    if (!conn.pid || msg.t === 'ping') return;
    applyIntent(this.world, conn.pid, msg);
  }

  // Eine Seite mit anderen Inhalten meldet sich: Vielleicht läuft dieser Raum noch mit altem Code.
  // Einmal pro fremder Prüfsumme neu starten (danach läuft der zuletzt veröffentlichte Code).
  // Ist danach immer noch etwas anders, ist die Seite veraltet; dann bittet der Browser ums Neuladen.
  async restartFor(sig) {
    const tried = await this.ctx.storage.get('restartedFor');
    const at = (await this.ctx.storage.get('restartedAt')) || 0;
    // Bremse: höchstens ein Neustart pro Minute, egal was die Seiten melden.
    if (tried === sig || Date.now() - at < 60000) return false;
    await this.ctx.storage.put({ restartedFor: sig, restartedAt: Date.now() });
    if (this.world) await this.saveAll().catch(() => {});
    for (const ws of this.conns.keys()) {
      try { ws.close(4006, 'Kindle was rebuilt'); } catch { /* schon zu */ }
    }
    // Kurz warten, damit die Schließnachricht (4006) noch ankommt und der Browser still neu verbindet.
    setTimeout(() => this.ctx.abort('content changed'), 250);
    return true;
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
    const row = await this.env.DB.prepare('SELECT region, data FROM characters WHERE account_id = ?').bind(account.id).first();
    let save = null;
    try { save = row ? JSON.parse(row.data) : null; } catch { save = null; }
    // Steht der Charakter woanders, schicken wir den Browser dorthin (kein Springen durch die Welt).
    const home = row && isRegionId(row.region) ? row.region : HOME_REGION;
    if (home !== this.regionId) {
      ws.send(JSON.stringify({ t: 'tick', tick: 0, ents: [], spawn: [], gone: [], events: [{ type: 'travel', region: home }] }));
      return this.drop(ws, 4005, 'Elsewhere');
    }
    const world = await this.ensureWorld();
    if (!this.conns.has(ws)) return;
    const pid = `p${account.id}`;
    conn.pid = pid;
    conn.accountId = account.id;
    const p = addPlayer(world, pid, account.name, save);
    // Gruppe aus der Datenbank (sie gilt über Gebiete hinweg)
    try {
      const prow = await this.env.DB.prepare('SELECT p.data FROM party_members m JOIN parties p ON p.id = m.party_id WHERE m.account_id = ?').bind(account.id).first();
      applyParty(world, p, prow ? JSON.parse(prow.data) : null);
    } catch (err) { console.error('party load failed', err); }
    ws.send(JSON.stringify(welcomeFor(world, pid)));
    // Drinnen kommt man herein; draußen tritt man ins Licht des Leuchtfeuers
    world.events.push({ type: 'log', text: world.region.sheltered ? `${account.name} comes in.` : `${account.name} steps into the light of the Beacon.`, cls: 'sys' });
    this.start();
    this.answeredFor(ws, account.id).catch((err) => console.error('answered failed', err));
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
      if (this.rebuild) { this.world = null; this.rebuild = false; }
      return;
    }
    const now = new Date();
    world.daylight = regionDaylight(world.region, now);
    const today = berlinDate(now);
    if (today !== world.date) {
      // Mitternacht in Berlin: neuer Tag, das Leuchtfeuer zählt von vorn.
      world.date = today;
      world.community.beacon = 0;
      world.events.push({ type: 'community', community: world.community });
      // Der Drift wird neu gewürfelt: Wer noch drin ist, wird nach Hause geweht.
      if (world.region.daily) {
        // Drift: zurück nach Kindle. Labyrinth: zurück nach Cinderford (foldTo/foldText im Gebiet).
        const r = world.region;
        world.events.push({ type: 'log', text: r.foldText ?? 'The Grey shifts. The Drift folds itself up, and you with it.', cls: 'hurt' });
        for (const p of world.players.values()) travel(world, p, r.foldTo ?? { region: HOME_REGION, ...ARRIVE.rift });
        this.rebuild = true;
      }
    }
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
    this.flushOutbox(world).catch((err) => console.error('outbox failed', err));
    // Gruppen auffrischen (Änderungen aus anderen Gebieten), alle 10 Sekunden
    if (world.tick % PARTY_REFRESH_TICKS === 0) this.refreshParties(world).catch((err) => console.error('party refresh failed', err));
    // Reisende speichern und trennen; der Browser verbindet sich mit dem Zielgebiet.
    for (const [ws, conn] of [...this.conns]) {
      const p = conn.pid && world.players.get(conn.pid);
      if (p?.travel) this.leave(ws).then(() => { try { ws.close(4005, 'Travel'); } catch { /* schon zu */ } });
    }
    // Nach einer Niederlage sofort speichern, sonst alle 30 Sekunden.
    const respawned = new Set(events.filter((e) => e.type === 'respawn').map((e) => e.to));
    if (world.tick % SAVE_EVERY_TICKS === 0 || respawned.size) {
      const which = world.tick % SAVE_EVERY_TICKS === 0 ? null : respawned;
      this.saveAll(which).catch((err) => console.error('save failed', err));
    }
  }

  async refreshParties(world) {
    const conns = [...this.conns.values()].filter((c) => c.pid && world.players.has(c.pid));
    if (!conns.length) return;
    const { results } = await this.env.DB.prepare(
      `SELECT m.account_id, p.data FROM party_members m JOIN parties p ON p.id = m.party_id WHERE m.account_id IN (${conns.map(() => '?').join(',')})`,
    ).bind(...conns.map((c) => c.accountId)).all();
    const byAcc = new Map(results.map((r) => [r.account_id, r.data]));
    for (const c of conns) {
      const p = world.players.get(c.pid);
      if (!p) continue;
      let data = null;
      try { data = byAcc.has(c.accountId) ? JSON.parse(byAcc.get(c.accountId)) : null; } catch { data = null; }
      applyParty(world, p, data);
    }
  }

  async saveAll(only = null) {
    const stmts = [];
    for (const conn of this.conns.values()) {
      if (!conn.pid || (only && !only.has(conn.pid))) continue;
      const save = saveFor(this.world, conn.pid);
      if (save) stmts.push(this.saveStmt(conn.accountId, save));
    }
    if (stmts.length) await this.env.DB.batch(stmts);
  }

  saveStmt(accountId, save) {
    return this.env.DB.prepare(
      `INSERT INTO characters (account_id, region, data, level, xp, updated_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(account_id) DO UPDATE SET region = excluded.region, data = excluded.data,
       level = excluded.level, xp = excluded.xp, updated_at = excluded.updated_at`,
    ).bind(accountId, save.region || HOME_REGION, JSON.stringify(save), bestLevel(save), totalXp(save), Date.now());
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
