# Tests der Nächte

Jede Nacht legt hier ihren Spielweg-Test an: `NNN-<thema>.test.mjs` (NNN = Tagesnummer, dreistellig).
Er spielt die Neuerung wie ein Spieler über `applyIntent` aus `shared/protocol.js` durch (siehe die
Helfer in `tests/unit/sim.test.mjs`). `tests/unit/` gehört zum Kern und ist für den Nachtlauf geschützt.
