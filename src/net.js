// Verbindung zur Welt. Zwei Varianten mit derselben Schnittstelle:
//  - NetConnection: WebSocket zum Gebiets-Server, der rechnet und speichert.
//  - LocalConnection: rechnet die Welt im Browser (offline, nichts landet auf dem Server).
// Beide rufen onMessage mit denselben Nachrichten auf (welcome, tick, error, closed).

import { regionFor, HOME_REGION } from '../content/regions/index.js';
import { TICK_MS, createWorld, step, addPlayer, removePlayer, saveFor, drainEvents } from '../shared/sim.js';
import { applyIntent, welcomeFor, tickFor } from '../shared/protocol.js';
import { regionDaylight, berlinDate } from '../shared/daylight.js';

const LOCAL_SAVE = 'overnight2.offline';

export class LocalConnection {
  constructor(onMessage, { clock = () => new Date() } = {}) {
    this.onMessage = onMessage;
    this.pid = 'local';
    this.clock = clock;
    this.offline = true;
    let save = null;
    try { save = JSON.parse(localStorage.getItem(LOCAL_SAVE) || 'null'); } catch { /* egal */ }
    this.enter(save?.region || HOME_REGION, save);
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  // Gebiet betreten (beim Start und beim Reisen).
  enter(regionId, save) {
    const region = regionFor(regionId, berlinDate(this.clock())) || regionFor(HOME_REGION);
    this.world = createWorld(region, Date.now() & 0xffff);
    addPlayer(this.world, this.pid, 'You', save);
    this.known = new Set();
    queueMicrotask(() => this.onMessage(welcomeFor(this.world, this.pid)));
  }

  tick() {
    const w = this.world;
    w.daylight = regionDaylight(w.region, this.clock());
    w.date = berlinDate(this.clock());
    step(w);
    this.onMessage(tickFor(w, this.pid, this.known));
    drainEvents(w);
    w.outbox.length = 0;
    const p = w.players.get(this.pid);
    if (p?.travel) {
      const save = removePlayer(w, this.pid);
      this.store(save);
      this.enter(save.region, save);
      return;
    }
    if (w.tick % 30 === 0) this.save();
  }

  store(save) {
    try { localStorage.setItem(LOCAL_SAVE, JSON.stringify(save)); } catch { /* egal */ }
  }

  save() {
    const save = saveFor(this.world, this.pid);
    if (save) this.store(save);
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
  constructor(server, token, region, onMessage) {
    this.onMessage = onMessage;
    this.offline = false;
    const url = `${server.replace(/^http/, 'ws')}/api/play?region=${encodeURIComponent(region)}`;
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
