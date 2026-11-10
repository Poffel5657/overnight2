-- Gebete (Ideen), Spenden (Stimmen) und Gemeinschaftsstände.
-- Gebetstext ist fremder Text: Nur der Nightwright liest ihn (über /api/admin), Spieler sehen ihn nie.
CREATE TABLE prayers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  answered_at INTEGER,
  answer_note TEXT,
  notified INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX prayers_created ON prayers(created_at);
CREATE INDEX prayers_account ON prayers(account_id, answered_at, notified);

CREATE TABLE donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  ballot INTEGER NOT NULL,
  option TEXT NOT NULL,
  gold INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX donations_ballot ON donations(ballot, option);

-- Zähler der Gemeinschaft, z. B. 'beacon:2026-11-10' -> Brennstoff an diesem Tag.
CREATE TABLE world_state (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
