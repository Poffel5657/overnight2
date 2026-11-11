// Gruppen: bis zu PARTY_MAX Spieler. Wer einlädt, führt (sonst nur der Anführer).
// Mitglieder in der Nähe teilen Erfahrung und Quest-Fortschritt bei besiegten Wesen (sim.js),
// auch wer nur heilt oder schützt. Die Gruppe gilt über Gebiete hinweg: Der Server speichert sie
// (world.outbox 'party') und gibt sie beim Betreten eines Gebiets zurück (applyParty).
import { emit, tell } from './events.js';

export const PARTY_MAX = 4;
const INVITE_TICKS = 100; // 30 Sekunden

// Gruppen dieses Gebiets: id -> { id, leader, members: [{ id, name }] }
function parties(world) {
  world.parties ??= new Map();
  return world.parties;
}

export function partyOf(world, p) {
  return p.partyId ? parties(world).get(p.partyId) ?? null : null;
}

// Mitglieder, die gerade in diesem Gebiet sind (ohne p selbst, wenn others)
export function partyHere(world, p, others = false) {
  const g = partyOf(world, p);
  if (!g) return others ? [] : [p];
  return g.members.map((m) => world.players.get(m.id)).filter((q) => q && (!others || q !== p));
}

// Jede Änderung merkt sich den Takt: Ein Auffrischen vom Server, das älter sein könnte, wartet dann kurz.
const FRESH_TICKS = 40;
function touch(world, g) { g.changedAt = world.tick; }
function save(world, g) {
  touch(world, g);
  world.outbox.push({ kind: 'party', party: { id: g.id, leader: g.leader, members: g.members.map((m) => ({ ...m })) } });
}
function announce(world, g, text) {
  for (const m of g.members) if (world.players.has(m.id)) tell(world, m.id, text, 'good');
}

export function invite(world, p, otherId) {
  const q = world.players.get(otherId);
  if (!q || q === p) return;
  const g = partyOf(world, p);
  if (g && g.leader !== p.id) return tell(world, p.id, 'Only the party leader can invite.', 'sys');
  if (g && g.members.length >= PARTY_MAX) return tell(world, p.id, `A party holds ${PARTY_MAX} at most.`, 'sys');
  if (q.partyId) return tell(world, p.id, `${q.name} is already in a party.`, 'sys');
  q.partyInvite = { from: p.id, until: world.tick + INVITE_TICKS };
  emit(world, { to: q.id, type: 'partyInvite', from: p.id, name: p.name });
  tell(world, p.id, `You invite ${q.name} to your party.`, 'sys');
}

export function answer(world, q, fromId, yes) {
  const inv = q.partyInvite;
  q.partyInvite = null;
  const p = world.players.get(fromId);
  if (!inv || inv.from !== fromId || world.tick > inv.until || !p || q.partyId) return;
  if (!yes) return tell(world, p.id, `${q.name} would rather go alone for now.`, 'sys');
  let g = partyOf(world, p);
  if (g && g.leader !== p.id) return;
  if (!g) {
    g = { id: `g${p.id}t${world.tick}`.slice(0, 24), leader: p.id, members: [{ id: p.id, name: p.name }] };
    parties(world).set(g.id, g);
    p.partyId = g.id;
  }
  if (g.members.length >= PARTY_MAX) return tell(world, q.id, 'That party is full.', 'sys');
  g.members.push({ id: q.id, name: q.name });
  q.partyId = g.id;
  announce(world, g, `${q.name} joins the party.`);
  save(world, g);
}

// Verlassen (oder vom Anführer entfernt werden). Bleibt einer allein, löst sich die Gruppe auf.
export function leave(world, p, kickedBy = null) {
  const g = partyOf(world, p);
  if (!g) return;
  g.members = g.members.filter((m) => m.id !== p.id);
  p.partyId = null;
  tell(world, p.id, kickedBy ? 'You were asked to leave the party.' : 'You leave the party.', 'sys');
  if (g.members.length <= 1) {
    for (const m of g.members) {
      const x = world.players.get(m.id);
      if (x) { x.partyId = null; tell(world, x.id, 'The party breaks up.', 'sys'); }
    }
    parties(world).delete(g.id);
    world.recentlyLeft = world.tick;
    world.outbox.push({ kind: 'party', disband: g.id, left: p.id });
    return;
  }
  if (g.leader === p.id) g.leader = g.members[0].id;
  touch(world, g);
  announce(world, g, `${p.name} leaves the party.`);
  world.outbox.push({ kind: 'party', party: { id: g.id, leader: g.leader, members: g.members.map((m) => ({ ...m })) }, left: p.id });
}

export function kick(world, leader, otherId) {
  const g = partyOf(world, leader);
  if (!g || g.leader !== leader.id || otherId === leader.id) return;
  const q = world.players.get(otherId);
  if (q && q.partyId === g.id) return leave(world, q, leader.id);
  // Mitglied ist woanders: nur aus der Liste nehmen, der Server speichert es
  const m = g.members.find((x) => x.id === otherId);
  if (!m) return;
  g.members = g.members.filter((x) => x.id !== otherId);
  if (g.members.length <= 1) {
    leader.partyId = null;
    parties(world).delete(g.id);
    world.recentlyLeft = world.tick;
    tell(world, leader.id, 'The party breaks up.', 'sys');
    world.outbox.push({ kind: 'party', disband: g.id, left: otherId });
    return;
  }
  touch(world, g);
  announce(world, g, `${m.name} is no longer in the party.`);
  world.outbox.push({ kind: 'party', party: { id: g.id, leader: g.leader, members: g.members.map((x) => ({ ...x })) }, left: otherId });
}

// Vom Server: gespeicherte Gruppe für einen Spieler (beim Betreten oder Auffrischen). null = keine.
export function applyParty(world, p, data) {
  // Gerade hier geändert: Der Server kennt das vielleicht noch nicht, also nichts überschreiben.
  const local = partyOf(world, p);
  if (local && world.tick - (local.changedAt ?? -1e9) < FRESH_TICKS) return;
  if (!local && world.tick - (world.recentlyLeft ?? -1e9) < FRESH_TICKS && !data) return;
  if (!data || !Array.isArray(data.members) || !data.members.some((m) => m.id === p.id)) {
    p.partyId = null;
    return;
  }
  const map = parties(world);
  let g = map.get(data.id);
  if (!g) {
    g = { id: data.id, leader: data.leader, members: [] };
    map.set(g.id, g);
  }
  g.leader = data.leader;
  g.members = data.members.slice(0, PARTY_MAX).map((m) => ({ id: String(m.id), name: String(m.name) }));
  p.partyId = g.id;
}

// Für den Browser: eigene Gruppe mit Anführer und Mitgliedern
export function partyView(world, p) {
  const g = partyOf(world, p);
  return g ? { leader: g.leader, members: g.members } : null;
}

export function tickParty(world, p) {
  if (p.partyInvite && world.tick > p.partyInvite.until) p.partyInvite = null;
}
