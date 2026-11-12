-- Rückmeldungen an Chris („A Note for the Maker“): Fehler, Balance, Wünsche. Nur Chris liest sie
-- (über /api/admin/feedback bzw. npm run feedback), der Nightwright bekommt sie nicht in die Inbox.
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  context TEXT,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX feedback_created ON feedback(created_at);
CREATE INDEX feedback_account ON feedback(account_id, created_at);
