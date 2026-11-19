# Plan (Arbeitsdatei des Nachtlaufs)

Der Nightwright pflegt diese Datei jede Nacht (Regeln in `CLAUDE.md`).

## Inbox gelesen bis

`v2/inbox/2026-11-15.json` (Tag 5). **Tag 6, 7, 8 und 9 fanden keine neuere Datei** (`2026-11-16.json` bis `2026-11-19.json` fehlten um 23 Uhr; Ursache unter „Bekannte Probleme“). Die nächste Nacht liest alle Dateien nach `2026-11-15.json`, auch nachträglich angekommene (Gebete darin sind noch offen; Stimmen für Zettel 5 bis 8 sind schon entschieden).

## Heute in Arbeit

Tag 9 (Nacht zum 2026-11-20). **Inbox fehlte zum vierten Mal** (keine Datei nach `2026-11-15.json`): keine neuen Gebete, Zettel 8 ohne Stimmen. Der Nightwright wählt `carriers-rest` (Bogen-Haken; passt zur Nacht mit Sedge).

**Teil 1, aus den Gebeten:** entfällt (keine neuen Gebete). Ersatz im Nachschlag: der Rätselraum in der Drowned Chapel (aus Gebet 8, letzte Nacht auf dem Zettel).

**Teil 2, aus der Abstimmung: Der Unterstand am Rastplatz (carriers-rest)**
1. *Was der Spieler will:* Oben an der Steinstraße einen Ort, der nicht nur Kampfplatz ist: wo man rasten kann und wo Kindle und die Leute aus dem Norden am selben Feuer sitzen.
2. *Woran er es merkt:* Der Unterstand am Rastplatz hat die Aktion „Mend“: Scheite, Torf und Birkenrinde hineinlegen (alle zusammen, Tageszähler). Steht er, leuchtet eine Lampe darin, alle im Gebiet lesen es, die Hollow Wardens greifen niemanden mehr von selbst an (Waffenruhe bis Mitternacht), und am Herd der Träger ruht man „ausgeruht“ (Bonus-Erfahrung wie im Gasthaus). Quest „A Roof at the Rest“ bei Brindle (ab 28): Rinde sammeln, Unterstand flicken, am Herd rasten. Neue Fundstelle Birkenrinde (Foraging) und Totholz.
3. *Woran es anschließt:* Amas Holzstapel (Scheite), Foraging (Torf, Birkenrinde), Gasthaus-Ruhe (`rested`), Gruppen-Wesen (Wardens), Bogen.
4. *Weg dorthin:* Brindle am Ausguck, nach „Stone by Stone“; die Steinstraße hinauf.

**Teil 3, vom Nightwright: „A Peg Still Hanging“ (Bogen, Akt 2: Sedge)**
1. *Was der Spieler will:* Einen Hollow Warden kennenlernen, der redet; erfahren, was Wenna bevorsteht.
2. *Woran er es merkt:* Unter dem geflickten Unterstand sitzt **Sedge**, ein alter Warden, der nicht aufsteht. Wer mitgeflickt hat, dem erzählt er: Wennas Pflock hängt noch (sie ist im Süden und lebt), er kannte ihre Mutter. Quest: Asche vom Herd zu Wenna, Wennas Zettel für Marrow („Barley, fair price“), Marrows Zusage, zurück zu Sedge („one night, when the moon is down“). Lohn: Warden's Birch Wrap.
3. *Woran es anschließt:* Wenna (Mühle), Marrow (Händler), Unterstand (Teil 2), Bogen (Wennas Aufbruch morgen).
4. *Weg dorthin:* Teil 2 (wer am Unterstand geflickt hat), Wenna nennt Sedge auch.

**Dauerauftrag Klassen:** Warden auf 74 (Lightsworn und Ironwall).

**Nachschlag:** Mender, Flarecaster, Drifter auf 74; Rätselraum in der Drowned Chapel (aus Gebet 8, „The Choir Door“); The Glimmer Galleries unter Copperdeep (Stufe 55–60, „Forty Crates“, „Back Monday“, Deep Lode, Lode-Rezepte, zwei Gefallen); alle Wege schon auf 78; „A Peg for Fen“ (niedrige Stufen); Drift-Fundstücke, Keeper-Körper; Rufe, Pell, Ausguck, Hollis, Gespräche (Ama, Haskel und der Stranger zu Sedge).

## Ausbau läuft

- **The Unending Maze** (seit 2026-11-13, von Chris gebaut aus Gebet 4): Stockwerke 1 bis 99 unter Cinderford, jeden Tag neu gewürfelt, Stufe = 3 + 2 × Stockwerk. Ausbau möglich: Rangliste auf dem Turn Board (braucht Chris: D1-Abfrage), weitere Keeper-Körper und -Eigenschaften (`BODIES`, `AFFIXES` in `content/regions/maze.js`), Rezepte aus Turnstones, mehr Gegenstände ab Stockwerk 25, Quests für tiefere Stockwerke (`keeper_10`, `keeper_20` gibt es schon).
- **Klassen bis 99 mit Spezialisierungen ab 50** (Dauerauftrag): Stand in `ROADMAP.md`: alle acht Wege haben Fähigkeiten auf 50, 54 und 58 (Tag 7). Stand Tag 9: alle acht Wege bis 78. Nächste Nächte: Warden 82, dann die anderen. Seit Tag 7 können Nahschläge `mend` (Gruppe heilt). Seit Tag 6 kann `zone` dazzle, root und burn. Seit Tag 5 kann `burst` auch `mend` (Gruppe heilt). Seit Tag 4 gibt es `exploit` (Schaden gegen brennende/geblendete/festsitzende Ziele): gut für weitere Stufen, auch kleinere exploit-Fähigkeiten für 12–30 wären schön (Gebet 8).
- **Der Bogen „The Second Light“**: Tag 7: Zettel 6 → bread-north (Kiste am ersten Stein), Wenna bleibt, bis die Kiste eine Last ist; der Stranger hat einen Schatten und gibt zu, aus dem Norden zu kommen. Tag 8: Zettel 7 → north-road-fires (die Steinstraße mit Feuern), Hollow Wardens am Rastplatz der Träger („Not Thieves“, „Beads for Home“). Tag 9: Zettel 8 → carriers-rest (Unterstand, Waffenruhe), Sedge am Herd, Wennas Pflock, Wenna packt. Nächste: Wennas Aufbruch (Tag 10, Zettel 9 walk-her-home), Vorstufe der großen Wahl.
- **The Stone Road** (seit Tag 8, Stufe 26–34): sechs Feuer, Rastplatz der Träger, drei Hollow Wardens (Gruppe). Seit dem Nachschlag: the Grey Heron an der Furt (Boss 36), Gefallen für Torf und Motten. Seit Tag 9: der Unterstand (`leanto`, Tageszähler, Waffenruhe `truce`, ausgeruht am Herd) und Sedge. Ausbau: was hinter dem achten Stein liegt (Bogen, nicht vor Akt 3), ein dauerhafter Unterstand (Weltzähler, nur mit Chris), Gefallen für Torf und Scheite am Unterstand.
- **Ama's Woodpile** (seit Tag 6): Stapel wächst mit dem Tageszähler. Ausbau: ein Vorrat über mehrere Tage (Weltzähler im Worker, nur mit Chris), Belohnung für die Gemeinschaft, wenn der Stapel voll ist, mehr Totholz in Copperdeep/Sinkmarsh.
- **The Spillway** (seit Tag 6, 46–50) und **The Overflow Run** (seit Tag 7, 50–54): Ausbau: ein Gruppen-Wesen, das Tor nach Norden (Bogen), Rezepte bis Tinkering 50.
- **Die Kiste am ersten Stein** (seit Tag 7): zählt pro Spieler (`sentNorth`). Ausbau: gemeinsamer Stand (Weltzähler, nur mit Chris), Antwort aus dem Norden (ein Geschenk in der Kiste?).
- **The Glimmer Galleries** (seit Tag 9, 55–60): Lode Crawler, Lampless Miners, „Forty Crates“, Deep Lode (Salvage 44), Lode Lantern (Lampwright 48). Ausbau: ein Boss an der letzten Wand (Zettel 9 `gallery-boss`), Ausrüstung über 60, Tinkering-Rezepte aus Lode Glimmer, der Name auf dem Zettel (Bogen).
- **Die Drowned Chapel** (seit Tag 9 die Chortür und die Sakristei): Ausbau: der ausgekratzte Name über dem vierzigsten Haken (Faden für Bogen 2), weitere Rätsel (Zettel 9 `maze-riddles`).
- **The North Watch:** Text in `content/lookout.js` wächst mit dem Bogen (Tag 4: Schein so breit wie zwei Daumen).
- **Counting House:** fünf Geschäfte seit Tag 4 (Flint mit Nachlass `discount`). Weitere (Wren, Sorrel, Rook), Ausschüttung in Waren, gemeinsames Ziel pro Geschäft (bräuchte einen dauerhaften Weltzähler, nur mit Chris).
- **The Sumps** (seit Tag 5, Gebet 9): Stufe 40–46, seit Tag 6 der Spillway (46–50). Ausbau: Gruppen-Wesen, eine Leiter zur Burg der Quarrymen (Gebet 9: Burg und Markt).
- **The Old Mill** (seit Tag 5): mahlt Gerste und Glas. Ausbau: weitere Mahlregeln (`content/mill.js`), Cooking, falls gewählt.
- **Meisterstücke:** Tinkering 32–37 seit Tag 4. Weiter: Meisterstücke für Lampwright (Linse, Stab) und Alchemie, Tinkering 38–45.

## Nächste Nächte

- Inbox: prüfen, ob `2026-11-16.json` bis `2026-11-19.json` nachträglich kamen (Gebete nachholen). Fehlt wieder eine Datei, steht es unter „Bekannte Probleme“ für Chris.
- Klassen: alle acht Wege haben 78 (Tag 9). Nächste: Warden 82, dann die anderen. Inhalt für 60 bis 78 fehlt (nur das Maze); das ist dringender als weitere Stufen. Ausrüstung über 60 fehlt noch.
- Inhalt für 60+: ein Boss in den Glimmer Galleries (Zettel 9 `gallery-boss`), danach ein Gebiet für 60–66.
- Bogen: Zettel 9 auswerten. Wennas Aufbruch an Tag 10 (Sedge wartet eine Nacht am Unterstand; gewinnt `walk-her-home`, begleiten Spieler sie mit Lampen). Ihre Neulings-Quests brauchen danach ein Ersatz-Gespräch an der Mühle. Dann die Vorstufe der großen Wahl auf den Zettel.
- Mehr Gefallen, die Gruppen belohnen (Vorsicht mit dem Kern-Test „Gefallen erledigen“).

## Ideen für später

- Cooking bei Hollis (Zettel 3–5, seit Zettel 7 als hollis-kitchen wieder drauf).
- Rangliste der Cup-Sieger bei Mabb (Zettel 6 bis 8 ohne Stimme, vorerst herunter).

- Angeln im Bach (drei Nächte auf dem Zettel ohne Stimme, vorerst herunter).
- Ein Imker zieht nach Kindle (drei Nächte auf Zettel 1–3, ohne Stimme, vorerst herunter).
- Rangliste der Cup-Sieger bei Mabb; mehr Rätsel-Quests (Gebet 5) in anderen Häusern (seit Tag 4: Haus 3 mit der Karte, Haus 4 mit dem Brief; Haus 1 ist das Counting House; seit Tag 5 Gran's Locker bei Hesk).
- Aus Gebet 2: ein kleiner Talentbaum mit leichten Boni (größerer Umbau, später als Vorschlag).
- Aus Gebet 1: ein Übungsring für freundliche Zweikämpfe (Kampf zwischen Spielern ändert die Kampfregeln, nur mit Chris).
- Aus Gebet 7: Material bei Ama abgeben, bis sie eine Mauer baut. Passt zu einer großen Bogen-Entscheidung, die noch kommt; bis dahin steht ein gemeinsamer Vorrat für das Leuchtfeuer auf dem Zettel.
- Aus Gebet 9: eine Burg und ein belebter Markt in einer großen Stadt, ein neuer Beruf, eine Paladin-Klasse (als „Lightsworn“-Weg des Wardens auf Zettel 5). Die Sumps sind das erste Stück.
- Aus Gebet 10: ein feindliches Lager, dem Spieler beitreten und das Kindle angreift. Kampf zwischen Spielern ändert die Kampfregeln (nur mit Chris). Ohne Spielerkampf denkbar: ein Lager der Hollow Wardens (Bogen, Akt 2), das nachts Brennstoff stiehlt.
- Aus Gebet 8: abgeschlossene Abenteuer für eine Gruppe mit Rätseln, Beute und Boss (eigene Instanz pro Gruppe wäre ein großer Umbau; mit Chris). Erster Schritt seit Tag 9: die Chortür in der Drowned Chapel; als Nächstes Rätselräume im Maze (Zettel 9 `maze-riddles`).

## Was ankommt

- Testrunde mit Freunden (2026-11-11): gewünscht wurden WASD-Laufen und besser lesbare Zahlen (beides gebaut), Sprechblasen statt Chatfenster, Gruppen und Handel.
- Erster Export (2026-11-11): 7 Charaktere, alle in 24 Stunden aktiv; Leuchtfeuer 29 von 300; 2 Gebete, 1 Stimme.
- Export 2026-11-14: 8 Charaktere, 2 aktiv in 24 Stunden; Leuchtfeuer 300 (Ziel erreicht); 2 Gebete, 2 Stimmen.
- Export 2026-11-15: 9 Charaktere, 3 aktiv; Leuchtfeuer der letzten Tage 295 bis 362; 2 Gebete, 1 Stimme.

## Bekannte Probleme

- Tag 7/8/9: **Die Inbox-Dateien `2026-11-16.json` bis `2026-11-19.json` fehlen** (vier Nächte ohne Gebete und Stimmen). Ursache (Tag 8 nachgesehen): GitHub startet `inbox-export.yml` nur noch einmal am Tag, und zwar nach Mitternacht (Läufe 2026-11-16 01:05, 2026-11-17 00:17, 2026-11-18 00:32 Berlin). Das Skript arbeitet nur zwischen 17 und 22:59 Uhr und beendet sich sonst grün mit „nichts zu tun“. Vorschlag an Chris: den Export zusätzlich vom Nachtlauf-Start aus anstoßen (workflow_dispatch mit force) oder das Fenster bis 2 Uhr öffnen und die Datei dann für den Vortag schreiben; `.github/` ist geschützt.
- Tag 7: Ein Abgabe-Gefallen „Brot für die Kiste“ (Brindle, zwei Millbread) ließ den Kern-Test „Gefallen erledigen“ mit jeder ausprobierten ID scheitern (er zieht dann einen Gefallen, den ein Neuling nicht schafft) und wurde weggelassen. Der Vorschlag an Chris von oben (Test sucht einen leichten Kampf-Gefallen gezielt) würde das lösen.
- Tag 7 (Review): Die Wegfindung (`pathFor` in `shared/sim.js`) läuft für jeden Spieler mit Ziel in jedem Takt. Zwischenspeichern brach den Kern-Test „Sammeln, Herstellen, …“ und wurde zurückgenommen; braucht einen sorgfältigeren Versuch.
- Tag 7 (Review): Offline setzt `src/net.js` den Leuchtfeuer-Zähler um Mitternacht nicht zurück (nur Anzeige, Stapel bleibt hoch). `src/net.js` ist geschützt; Vorschlag an Chris: in `tick` bei Datumswechsel `w.community.beacon = 0`.

- Gebete 3 und 4 hat Chris am 2026-11-13 gebaut (Beutel 48, Cinderford und Maze); Tag 3 hat sie nur in `CHRONICLE.md` erwähnt, Chris markiert sie selbst als erhört.
- Der Smoke-Test lief in der Nachtumgebung mit dem vorinstallierten Chromium (`PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`), weil `tools/smoke.mjs` den Browser von Playwright 1.56 sonst nicht findet.
- Der Kern-Test „Gefallen erledigen“ (`tests/unit/sim.test.mjs`) nimmt den ersten Tag ab 2026-11-10 mit Abgabe- und Kampf-Gefallen und lässt einen Neuling (Stufe 1) gegen das Wesen des Kampf-Gefallens kämpfen. Welcher Gefallen gezogen wird, hängt von allen IDs in `content/dailies.js` ab; ein neuer Gefallen kann so einen Gegner ab Stufe 7 ziehen, und der Test scheitert. Tag 3 hat die ID des Gnawer-Gefallens so gewählt (`thin_gnawers`), dass die Krähen gezogen werden. Vorschlag an Chris: Der Test sollte einen leichten Kampf-Gefallen gezielt suchen.
- Ab Stufe 28 hat jede Klasse mehr Fähigkeiten als die Leiste Felder (9); neue landen nicht von selbst auf der Leiste, man zieht sie aus dem Fähigkeitenfenster. Die Meldung „New ability on your bar“ stimmt dann nicht ganz (`grantXp` in `shared/talk.js`).

- **Inbox-Export kam nicht an (Tag 1 und 2), behoben am 2026-11-13:** GitHub startete `inbox-export.yml` stark verspätet (11.11.) oder gar nicht (12.11.), die Prüfung auf 22 Uhr brach dann ab. Jetzt läuft der Export alle 30 Minuten zwischen 17 und 23 Uhr Berlin und überschreibt die Datei des Tages; `since` kommt aus der letzten Datei vor heute. Die Gebete seit dem 11.11. kommen mit der nächsten Datei an. Die Stimmen von Zettel 1 bleiben ungelesen (Zettel 2 läuft schon).

- Tag 4: Rook muss laut Kern-Test (`tests/unit/sim.test.mjs`, Berufe) in `content/regions/kindle.js` stehen. Für „Rook zieht nach drinnen“ steht er deshalb weiter im Hof; die Meisterstücke gehen nur an seiner guten Bank drinnen. Vorschlag an Chris: Der Test könnte Rook in beiden Gebieten suchen.
- Tag 4: Neue Wesen in `content/regions/kindle.js` verschieben die Zufallsfolge der Welt; alte Nachttests mit festen Seeds (z. B. `002-last-shift`) reagieren darauf. Neue Wesen deshalb ans Ende der Liste und, wenn sie still stehen, mit `moveEvery: 0`.
- Tag 5/7: Nachttests sollen Pells Tagestext nicht wörtlich prüfen (seit Tag 7 behoben für `004-rook-masterwork`).
- Tag 6: Im Kampf gibt es keine Sichtlinie: Fernkämpfer können The Undertow über die Mauer der Zisterne beschießen, ohne dass er sie erreicht. Eine Sichtlinie wäre eine Kampfregel (nur mit Chris); bis dahin Bosse nicht direkt hinter dünne Mauern setzen.
- Es gibt noch keinen automatischen Probespieler für die Balance (siehe `CLAUDE.md`, „Balance“).
- Der Chat hat noch keine Moderation (verstecken, stummschalten). Das baut Chris vor dem öffentlichen Start.
- Der Schein im Norden wird über Bäume gezeichnet (ohne Tiefentest, damit der Grey ihn nicht verdeckt); aus manchen Winkeln färbt er die Baumspitzen orange. Gewollt als Glühen, beobachten.

## Große Vorschläge

- #1 Truhe zum Einlagern in Kindle (Gebet 2), offen seit Tag 1. Chris hat die Truhe an Tag 1 in der Taverne selbst gebaut; das Issue ist damit erledigt, bleibt aber für Chris zum Schließen offen.
