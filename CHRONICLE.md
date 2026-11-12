# Chronik (für Entwickler)

Was jede Nacht gebaut wurde, warum, und was offen blieb. Für Spieler steht die Kurzfassung in `content/chronicle.js`.

## Tag 0 (2026-11-10 bis 2026-11-11): Die Welt beginnt

Von Chris und Claude in mehreren Sitzungen gebaut, bevor der Nachtlauf startet.

- **Welt:** Kindle mit Leuchtfeuer, Kapelle, Werkstatt und Häusern (alle betretbar), Oberwelt mit Fernmeadow, Hushwood, Copperdeep und Sinkmarsh, Dungeon Drowned Chapel mit dem Boss The Lamplighter, der tägliche Drift.
- **Systeme:** vier Klassen (Warden, Mender, Flarecaster, Drifter) mit eigenen Sprites, sechs Berufe (höchstens zwei), Quests, Gefallen, Händler (teurer als Ankauf), Handel zwischen Spielern, Gruppen bis vier (geteilte Erfahrung, über Gebiete gespeichert), Licht und Öl, Tag und Nacht nach Berlin.
- **Kampf:** automatischer Angriff im Waffentakt, Fähigkeiten mit globaler Abklingzeit und eigenen Abklingzeiten, angekündigte Flächenangriffe mit langer Vorwarnung.
- **Kapelle:** Beten (Ideen an den Nightwright), Abstimmen (eine Stimme pro Tag, Gold zählt nicht), erhörte Gebete.
- **Oberfläche:** Laternen-Look, alles verschieb- und skalierbar, Sprechblasen und Chat-Tab, Gespräche mit Porträts, Tooltips für Fähigkeiten und Gegenstände, WASD, Ton und leise Musik.

Abstimmung: Zettel 0 (Mühle, Angeln, Nachtmarkt), noch keine Auswertung.

## Tag 1 (Nacht zum 2026-11-12): Schnecken, Motten und ein Licht im Norden

**Teil 1, Gebete: Schneckenrennen und Karte.** Zwei Gebete kamen an, beide mit mehreren Wünschen.
- Gebet 1 (ID 1): *Gewünscht:* Kleine Spiele im Dorf, etwa ein Ring für Zweikämpfe oder Wetten auf Schneckenrennen. *Geliefert:* Schneckenrennen bei Mabb am Westweg: drei Schnecken mit eigenen Quoten (2x, 3x, 4x), Einsatz 5 oder 20 Gold, alle 30 Sekunden plus Laufzeit ein Rennen, sichtbar als Figuren auf der Bahn, Sprechblasen und Log; Quest „Off to the Races“; wer Kindle vor der Auszahlung verlässt, bekommt den Einsatz zurück. Auf lange Sicht zahlt Mabb etwa 92 % aus (Goldsenke, aber Glück zählt). *Fehlt noch:* Zweikämpfe zwischen Spielern (ändern die Kampfregeln, nur mit Chris; unter „Ideen für später“).
- Gebet 2 (ID 2): *Gewünscht:* Eine Truhe im Dorf zum Einlagern, ein Talentbaum mit kleinen Boni, eine Karte auf M. *Geliefert:* Die Karte: Knopf „Map“ und Taste M, Gelände, Gegenden, Gebäude, Lichter, Ausgänge, Figuren mit Quest-Zeichen, Mitspieler, die eigene Lage; Tipp auf die Karte läuft dorthin. *Fehlt noch:* Die Truhe braucht neue Nachrichten im geschützten Protokoll (großer Vorschlag an Chris, Entwurf liegt im Inbox-Repo); der Talentbaum ist ein eigener Umbau für später.

**Teil 2, Abstimmung: der Nachtmarkt.** Zettel 0: night-market 1 Stimme, old-mill 0, fishing 0. *Geliefert:* Mothwicks Stand am Ostrand des Lichtkreises mit eigenem Licht, offen nur nach Einbruch der Dunkelheit (Händler mit `night: true`, Gespräche mit `night`/`day`). Ware: Moth Lantern (Licht +2, 40 % weniger Öl, zwischen Messing- und Glimmlaterne), Moonwick, Night Bread (heilt 30), Lampenöl. Quest „Wisps for the Wicks“ (drei Grey Wisps) gibt Moonwick; neues Lampwright-Rezept Moon Candle (Stufe 11: Moonwick + Wachs, leuchtet lange und gibt 35 Öl). *Fehlt noch:* Wechselnde Ware von Nacht zu Nacht.

**Teil 3, Nightwright: „Not From Here“.** Der Bogen „The Second Light“ beginnt: Nachts glüht über dem Nordrand ein warmer Schein. Fen schickt Spieler ab Stufe 10 zu einer kalten Laterne aus fremdem grünem Glas am Nordrand von Hushwood; Wren erkennt, dass das Glas nicht aus Kindle stammt; der Stranger behält es und spricht vom hungrigen Feuer. Haskel und Mothwick haben den Schein auch gesehen.

**Klassen (Dauerauftrag): Warden** bis Stufe 16. Stand Fast (Stufe 12): heilt 18 und halbiert 2,4 s lang den Schaden. Beacon Slam (Stufe 16, 5 Öl): Stoß im Umkreis 1,5, blendet 1,5 s und bindet alles Getroffene an den Warden. Dafür kann `burst` jetzt `dazzle` und `hold` (statt nur `scare`), Beschreibung und Test dazu.

**Balance-Notizen:** Keine neuen Wesen. Schneckenquoten per Monte-Carlo abgestimmt (Erwartung je Schnecke 0,90 bis 0,93, Test prüft 0,8 bis 1,0). Moth Lantern kostet 225 Gold beim Händler, liegt also zwischen Brass (selbst gebaut ab Lampwright 5) und Glimsteel. Quest-Erfahrung: „Not From Here“ 420 (Stufe 10+, etwa zwei Stufen 11), die anderen klein. Warden-Test: Stufe 16 mit Glimsteel-Schild gegen einen Hushwood-Wolf gewinnt und verliert dabei Leben.

**Abstimmung neu:** Zettel 1 mit old-mill, fishing (zweite Nacht), north-lookout, beekeeper.

**Nachschlag (am Tag nachgereicht von Chris und Claude, die Nacht war mit 17 Minuten zu kurz):**
- **Mender bis Stufe 16:** Cinder Flick (11, Fernschlag mit Waffenkraft, damit Mender allein vorankommen), Hearth Song (13, Wärme über Zeit für alle im Umkreis 4), Rekindle (16, große Heilung mit Stemmen für die Gruppe, 12 Öl).
- **Quest-Kette „The Drowned Choir“** (Tallow, ab Stufe 28, nach „The Older Prayer“): drei Sodden Hymnals von Mire Lurkern (neu, Stufe 31, fünf im tiefen Sinkmarsh am Süd- und Südostrand) oder Drowned Pilgrims, dann die Choir Bell aus einem versunkenen Glockenrahmen im Südwesten, dann sechs Drowned Pilgrims in der Drowned Chapel. Lohn: 2.400 EP, 90 Gold, Choir Mantle (Körper, Abwehr 8, Licht +1, besser als Greyglass) und drei Glow Draughts. Schließt die Lücke zwischen Bog Toads (28) und dem Lamplighter (40).
- **Fehler behoben:** Statusfenster und Log zeigten fest „Day 0“; jetzt kommt die Tagesnummer aus der Chronik.

**Balance-Notizen Nachschlag:** Mire Lurker 200 HP, Angriff 12–15, line-Special mit 6 Takten Vorwarnung. Ein Warden auf 30 mit Glimsteel braucht etwa 6 s; das liegt im Rahmen der Welt (Bog Toad 5 s, Wisp 2 s). Die Oberwelt ist ab Stufe 25 insgesamt zu leicht; das gehört in die große Balance-Runde, die Chris am Ende machen will.

**Von Chris am Tag 1 dazugebaut: die Taverne „The Lantern & Lark“** (östlich der Kapellenhäuser, Innenraum in `kindle_inside`):
- **Eigene Truhe** (48 Fächer, `shared/stash.js`): jede Truhe in der Taverne öffnet die eigene, gespeichert im Spielstand (`stash`). Erfüllt den Truhen-Wunsch aus Gebet 2.
- **Betten** für 8 Gold: Leben und Öl voll, danach **ausgeruht** (die nächsten 30 Siege +50 % Erfahrung, `rested` im Spielstand, Regeln in `content/tavern.js`).
- **Hollis** (Gastwirt) verkauft Hearth Stew, Ember Ale, Brot und Öl und erzählt Gerüchte.
- **Die Band „the Damp Socks“**: Corra (Fiedel), Oswin (Trommel), Pip (Pfeife) mit eigenen Rufen; in der Taverne spielt „The Lark's Jig“ statt der Hintergrundmusik. Oswins Quest „A Skin for the Drum“ (ab Stufe 10, zwei Wolfsfelle).
