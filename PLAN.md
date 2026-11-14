# Plan (Arbeitsdatei des Nachtlaufs)

Der Nightwright pflegt diese Datei jede Nacht (Regeln in `CLAUDE.md`).

## Inbox gelesen bis

`v2/inbox/2026-11-14.json` (Tag 4). Die nächste Nacht liest alle Dateien nach `2026-11-14.json`.

## Heute in Arbeit

Tag 4 (Nacht zum 2026-11-15). Inbox `v2/inbox/2026-11-14.json`: Gebete 7 und 8, Zettel 3: rook-masterwork 2 Stimmen, sonst keine.

**Teil 1, aus den Gebeten: Flint in Cinderford (Gebet 7) und exploit im Kampf (Gebet 8)**
1. *Was der Spieler will:* Rohstoffe kaufen können, statt nur zu sammeln, und dass ein Anteil sich beim Einkaufen spürbar lohnt (7). Im Kampf Entscheidungen statt einer Taste (8).
2. *Woran er es merkt:* Flint mit Erzkarren oben an den Stufen in Cinderford, Ware mit „(PARTNER)“-Preis, fünftes Geschäft bei Coyne, Quest „A Share of the Cart“, Cinder Iron für Teilhaber; neue Fähigkeiten auf 36 mit EXPLOIT über dem Ziel, Tooltip erklärt die Vorbereitung, Pell ruft es aus.
3. *Woran es anschließt:* Counting House (Anteile), Händler, Cinderford, Tinkering (Cinder Iron für Meisterstücke); Klassen, Gruppen (Blenden, Festsetzen, Brennen).
4. *Weg dorthin:* Pell und der Ruf von Flint; Coyne listet das Geschäft; neue Fähigkeit erscheint mit Stufe 36.

**Teil 2, aus der Abstimmung: Rooks Meisterstücke (rook-masterwork, 2 Stimmen)**
1. *Was der Spieler will:* Etwas, das nach den Greyglass-Rezepten kommt, und Rook als Lehrer mit eigener Bank drinnen.
2. *Woran er es merkt:* Rook bietet ab Tinkering 30 „Rook's Masterwork“ an, Tansy hat die Zangen, die gute Bank drinnen macht fünf Meisterstücke (32–37), das Fenster markiert sie.
3. *Woran es anschließt:* Tinkering, Werkstatt/Tansy, Cinderford (Cinder Iron), Copperdeep (Seam Lurker), Ausrüstung für 32–40.
4. *Weg dorthin:* Rook im Hof, Pell, Tansy.

**Teil 3, vom Nightwright: „Catch a Shadow“ (Bogen, Akt 1)**
1. *Was der Spieler will:* Das Rätsel um den Stranger ein Stück weiter, ohne es aufzulösen.
2. *Woran er es merkt:* Fen zeichnet nachts Schatten am Leuchtfeuer, Kreidekreis als Objekt, Tallow gibt Kreide, der Stranger wirft nachts keinen Schatten, Ama, Fen und Tallow reagieren; Ama sagt, das Leuchtfeuer frisst mehr.
3. *Woran es anschließt:* Leuchtfeuer, Tag/Nacht, Kapelle, Stranger, Bogen.
4. *Weg dorthin:* Fen am Platz ruft, alle Stufen nach Kindling.

**Dauerauftrag Klassen: Warden** 36 (Anvil Blow). **Nachschlag (gebaut):** Mender/Flarecaster/Drifter 36, Seam Lurker und „The Deep Seam“ (36–40), Lampwright 32–35 Cinder Iron Lantern, Staff und Lens, „The Map of Crosses“ (Haus 3) und „The Unsent Letter“ (Haus 4, Abels Haus; beide Gebet 5), Gespräche und Rufe.

## Ausbau läuft

- **The Unending Maze** (seit 2026-11-13, von Chris gebaut aus Gebet 4): Stockwerke 1 bis 99 unter Cinderford, jeden Tag neu gewürfelt, Stufe = 3 + 2 × Stockwerk. Ausbau möglich: Rangliste auf dem Turn Board (braucht Chris: D1-Abfrage), weitere Keeper-Körper und -Eigenschaften (`BODIES`, `AFFIXES` in `content/regions/maze.js`), Rezepte aus Turnstones, mehr Gegenstände ab Stockwerk 25, Quests für tiefere Stockwerke (`keeper_10`, `keeper_20` gibt es schon).
- **Klassen bis 99 mit Spezialisierungen ab 50** (Dauerauftrag): Stand in `ROADMAP.md`: alle vier bis Stufe 36. Nächste Nacht: Warden (40), dann Mender, Flarecaster, Drifter. Seit Tag 4 gibt es `exploit` (Schaden gegen brennende/geblendete/festsitzende Ziele): gut für weitere Stufen, auch kleinere exploit-Fähigkeiten für 12–30 wären schön (Gebet 8).
- **Der Bogen „The Second Light“**, Akt 1 endet bald (Tag 4: der Stranger ohne Schatten). Tag 5: ein verirrter Träger; Tag 6: Ama ruft das Weltproblem aus; Tag 7: erste Bogen-Option auf dem Zettel.
- **The North Watch:** Text in `content/lookout.js` wächst mit dem Bogen (Tag 4: Schein so breit wie zwei Daumen).
- **Counting House:** fünf Geschäfte seit Tag 4 (Flint mit Nachlass `discount`). Weitere (Wren, Sorrel, Rook), Ausschüttung in Waren, gemeinsames Ziel pro Geschäft (bräuchte einen dauerhaften Weltzähler, nur mit Chris).
- **Meisterstücke:** Tinkering 32–37 seit Tag 4. Weiter: Meisterstücke für Lampwright (Linse, Stab) und Alchemie, Tinkering 38–45.

## Nächste Nächte

- Warden auf Stufe 40, dann Mender, Flarecaster, Drifter. Danach Spezialisierungen vorbereiten (ab 50).
- Inhalt für 40+ in der Oberwelt (Tag 4: Seam Lurker 38 und „The Deep Seam“; der Lamplighter ist 40).
- Bogen: Tag 5 der verirrte Träger (nur nachts, Fernmeadow), Tag 6 Ama und „The Beacon Starves“ vorbereiten.
- Mehr Gefallen, die Gruppen belohnen.

## Ideen für später

- Angeln im Bach (drei Nächte auf dem Zettel ohne Stimme, vorerst herunter).
- Ein Imker zieht nach Kindle (drei Nächte auf Zettel 1–3, ohne Stimme, vorerst herunter).
- Rangliste der Cup-Sieger bei Mabb; mehr Rätsel-Quests (Gebet 5) in anderen Häusern (seit Tag 4: Haus 3 mit der Karte, Haus 4 mit dem Brief; Haus 1 ist das Counting House).
- Aus Gebet 2: ein kleiner Talentbaum mit leichten Boni (größerer Umbau, später als Vorschlag).
- Aus Gebet 1: ein Übungsring für freundliche Zweikämpfe (Kampf zwischen Spielern ändert die Kampfregeln, nur mit Chris).
- Aus Gebet 7: Material bei Ama abgeben, bis sie eine Mauer baut. Passt zu einer großen Bogen-Entscheidung, die noch kommt; bis dahin steht ein gemeinsamer Vorrat für das Leuchtfeuer auf dem Zettel.
- Aus Gebet 8: abgeschlossene Abenteuer für eine Gruppe mit Rätseln, Beute und Boss (eigene Instanz pro Gruppe wäre ein großer Umbau; mit Chris). Kleiner Schritt: ein Rätselraum in der Drowned Chapel oder im Maze.

## Was ankommt

- Testrunde mit Freunden (2026-11-11): gewünscht wurden WASD-Laufen und besser lesbare Zahlen (beides gebaut), Sprechblasen statt Chatfenster, Gruppen und Handel.
- Erster Export (2026-11-11): 7 Charaktere, alle in 24 Stunden aktiv; Leuchtfeuer 29 von 300; 2 Gebete, 1 Stimme.
- Export 2026-11-14: 8 Charaktere, 2 aktiv in 24 Stunden; Leuchtfeuer 300 (Ziel erreicht); 2 Gebete, 2 Stimmen.

## Bekannte Probleme

- Gebete 3 und 4 hat Chris am 2026-11-13 gebaut (Beutel 48, Cinderford und Maze); Tag 3 hat sie nur in `CHRONICLE.md` erwähnt, Chris markiert sie selbst als erhört.
- Der Smoke-Test lief in der Nachtumgebung mit dem vorinstallierten Chromium (`PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`), weil `tools/smoke.mjs` den Browser von Playwright 1.56 sonst nicht findet.
- Der Kern-Test „Gefallen erledigen“ (`tests/unit/sim.test.mjs`) nimmt den ersten Tag ab 2026-11-10 mit Abgabe- und Kampf-Gefallen und lässt einen Neuling (Stufe 1) gegen das Wesen des Kampf-Gefallens kämpfen. Welcher Gefallen gezogen wird, hängt von allen IDs in `content/dailies.js` ab; ein neuer Gefallen kann so einen Gegner ab Stufe 7 ziehen, und der Test scheitert. Tag 3 hat die ID des Gnawer-Gefallens so gewählt (`thin_gnawers`), dass die Krähen gezogen werden. Vorschlag an Chris: Der Test sollte einen leichten Kampf-Gefallen gezielt suchen.
- Ab Stufe 28 hat jede Klasse mehr Fähigkeiten als die Leiste Felder (9); neue landen nicht von selbst auf der Leiste, man zieht sie aus dem Fähigkeitenfenster. Die Meldung „New ability on your bar“ stimmt dann nicht ganz (`grantXp` in `shared/talk.js`).

- **Inbox-Export kam nicht an (Tag 1 und 2), behoben am 2026-11-13:** GitHub startete `inbox-export.yml` stark verspätet (11.11.) oder gar nicht (12.11.), die Prüfung auf 22 Uhr brach dann ab. Jetzt läuft der Export alle 30 Minuten zwischen 17 und 23 Uhr Berlin und überschreibt die Datei des Tages; `since` kommt aus der letzten Datei vor heute. Die Gebete seit dem 11.11. kommen mit der nächsten Datei an. Die Stimmen von Zettel 1 bleiben ungelesen (Zettel 2 läuft schon).

- Tag 4: Rook muss laut Kern-Test (`tests/unit/sim.test.mjs`, Berufe) in `content/regions/kindle.js` stehen. Für „Rook zieht nach drinnen“ steht er deshalb weiter im Hof; die Meisterstücke gehen nur an seiner guten Bank drinnen. Vorschlag an Chris: Der Test könnte Rook in beiden Gebieten suchen.
- Tag 4: Neue Wesen in `content/regions/kindle.js` verschieben die Zufallsfolge der Welt; alte Nachttests mit festen Seeds (z. B. `002-last-shift`) reagieren darauf. Neue Wesen deshalb ans Ende der Liste und, wenn sie still stehen, mit `moveEvery: 0`.
- Es gibt noch keinen automatischen Probespieler für die Balance (siehe `CLAUDE.md`, „Balance“).
- Der Chat hat noch keine Moderation (verstecken, stummschalten). Das baut Chris vor dem öffentlichen Start.
- Der Schein im Norden wird über Bäume gezeichnet (ohne Tiefentest, damit der Grey ihn nicht verdeckt); aus manchen Winkeln färbt er die Baumspitzen orange. Gewollt als Glühen, beobachten.

## Große Vorschläge

- #1 Truhe zum Einlagern in Kindle (Gebet 2), offen seit Tag 1. Chris hat die Truhe an Tag 1 in der Taverne selbst gebaut; das Issue ist damit erledigt, bleibt aber für Chris zum Schließen offen.
