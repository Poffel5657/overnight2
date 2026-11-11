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
