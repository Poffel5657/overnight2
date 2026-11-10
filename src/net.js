// Verbindung zur Welt. Zwei Varianten mit derselben Schnittstelle:
//  - NetConnection: WebSocket zum Gebiets-Server, der rechnet und speichert.
//  - LocalConnection: rechnet die Welt im Browser (offline, nichts landet auf dem Server).
// Beide rufen onMessage mit denselben Nachrichten auf (welcome, tick, error, closed).

import { REGION } from '../content/regions/kindle.js';
import { TICK_MS, createWorld, step, addPlayer, saveOf, drainEvents } from '../shared/sim.js';
import { applyIntent, welcomeFor, tickFor } from '../shared/protocol.js';
import { skyState } from '../shared/daylight.js';

const LOCAL_SAVE = 'overnight2.offline';

export class LocalConnection {
  constructor(onMessage, { clock = () => new Date() } = {}) {
    this.onMessage = onMessage;
    this.world = createWorld(REGION, Date.now() & 0xffff);
    let save = null;
    try { save = JSON.parse(localStorage.getItem(LOCAL_SAVE) || 'null'); } catch { /* egal */ }
    this.pid = 'local';
    addPlayer(this.world, this.pid, 'You', save);
    this.known = new Set();
    this.clock = clock;
    this.offline = true;
    queueMicrotask(() => this.onMessage(welcomeFor(this.world, this.pid)));
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    this.world.daylight = skyState(this.clock()).day;
    step(this.world);
    this.onMessage(tickFor(this.world, this.pid, this.known));
    drainEvents(this.world);
    if (this.world.tick % 30 === 0) this.save();
  }

  save() {
    const p = this.world.players.get(this.pid);
    try { localStorage.setItem(LOCAL_SAVE, JSON.stringify(saveOf(p))); } catch { /* egal */ }
  }

  send(intent) {
    applyIntent(this.world, this.pid, intent);
  }

  close() {
    this.save();
    clearInterval(this.timer);
  }
}

export class NetConnection {
  constructor(server, token, onMessage) {
    this.onMessage = onMessage;
    this.offline = false;
    const url = server.replace(/^http/, 'ws') + '/api/play';
    this.ws = new WebSocket(url);
    this.ws.addEventListener('open', () => this.ws.send(JSON.stringify({ t: 'hello', token })));
    this.ws.addEventListener('message', (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      this.onMessage(msg);
    });
    this.ws.addEventListener('close', (e) => this.onMessage({ t: 'closed', code: e.code, reason: e.reason }));
    this.ping = setInterval(() => this.send({ t: 'ping' }), 20000);
  }

  send(intent) {
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(intent));
  }

  close() {
    clearInterval(this.ping);
    this.ws.close();
  }
}

// ---------- Konten ----------

export async function account(server, path, body, token) {
  const res = await fetch(`${server}/api/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* leer */ }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
