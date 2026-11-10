-- Konten, Anmeldungen und Spielstände.
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_lower TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Gespeichert wird nur ein Hash des Tokens. Wer die Datenbank liest, kann sich damit nicht anmelden.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_account ON sessions(account_id);

-- Ein Charakter pro Konto. data ist JSON aus saveOf() in shared/sim.js.
CREATE TABLE characters (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  data TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE INDEX characters_xp ON characters(xp DESC);
