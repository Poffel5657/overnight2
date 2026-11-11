-- Gruppen über Gebiete hinweg. data = JSON { id, leader, members: [{ id, name }] } (id = 'p' + account_id).
CREATE TABLE parties (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
-- Wer in welcher Gruppe ist (höchstens eine pro Konto).
CREATE TABLE party_members (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  party_id TEXT NOT NULL
);
CREATE INDEX party_members_party ON party_members(party_id);
