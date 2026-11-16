# Plan (Arbeitsdatei des Nachtlaufs)

Der Nightwright pflegt diese Datei jede Nacht (Regeln in `CLAUDE.md`).

## Inbox gelesen bis

`v2/inbox/2026-11-15.json` (Tag 5). **Tag 6 fand keine neuere Datei** (`2026-11-16.json` fehlte um 23 Uhr und bis zum Ende der Nacht). Die nächste Nacht liest alle Dateien nach `2026-11-15.json`, also auch eine nachträglich angekommene `2026-11-16.json` (dort stehen die Stimmen für Zettel 5, der schon entschieden ist, und Gebete, die noch offen sind).

## Heute in Arbeit

Tag 6 (Nacht zum 2026-11-17). **Die Inbox-Datei `v2/inbox/2026-11-16.json` fehlte um 23 Uhr** (letzte Datei: 2026-11-15). Keine neuen Gebete, kein Ergebnis für Zettel 5: Teil 1 entfällt, Teil 3 wird größer, den Gewinner von Zettel 5 wählt der Nightwright selbst (`beacon-stockpile`, passt zum Bogen).

**Teil 1, aus den Gebeten:** entfällt (keine neuen Gebete gelesen). Dafür wird Teil 3 größer, und der Nachschlag nimmt Gebet 9 (Lightsworn) weiter.

**Teil 2, aus der Abstimmung: Ama's Woodpile (beacon-stockpile, ohne gelesene Stimmen gewählt)**
1. *Was der Spieler will:* Etwas, das alle zusammen füllen und das man wachsen sieht; das Gefühl, dass das eigene Holz zählt.
2. *Woran er es merkt:* Neben dem Leuchtfeuer steht ein Holzstapel, der mit dem Tageszähler des Leuchtfeuers sichtbar höher wird. Im Wald liegt **Deadfall** (Totholz), das jeder ohne Beruf zu **Split Logs** spaltet (einmal am Tag pro Stelle). „Stack“ am Stapel legt alle Scheite auf einmal nach (zählt fürs Leuchtfeuer, einmal am Tag etwas Erfahrung). Ama gibt die Quest „The Woodpile“, Pell ruft es aus, Haskel weiß, wo Totholz liegt.
3. *Woran es anschließt:* Leuchtfeuer und Tageszähler (`BEACON_FUEL`, `world.community.beacon`), Quests, Haskels Holzfällerlager, Bogen („The Beacon Starves“).
4. *Weg dorthin:* Ama ab Kindling, Pell, Haskel; Totholz am Waldrand von Fernmeadow (niedrige Stufen) und in Hushwood.
*Grenze:* Ein Vorrat über mehrere Tage bräuchte einen dauerhaften Weltzähler (Worker, geschützt). Der Stapel zeigt deshalb den Tagesstand.

**Teil 3, vom Nightwright: „Oil for the Road“ (Bogen, Übergang zu Akt 2)**
1. *Was der Spieler will:* Dass Wenna nicht einfach verschwindet, sondern dass man ihr hilft, heimzugehen, und dabei etwas Neues über den Norden erfährt.
2. *Woran er es merkt:* Wenna (nachts, nach „The Last Sack“) will nach Norden: Öl für die Reise, ein Scheit für Kindles Feuer in ihrem Namen auf Amas Stapel, nachts vom Ausguck prüfen, ob die Steine frei sind, Brindle fragen, zurück zu Wenna. Danach ruft Ama „The Beacon Starves“ aus. Stranger, Fen und Brindle reagieren.
3. *Woran es anschließt:* Holzstapel (Teil 2), Ausguck, Leuchtfeuer, Händler (Öl), Bogen.
4. *Weg dorthin:* Folgt aus „The Last Sack“; Ama und Pell erwähnen es.

**Dauerauftrag Klassen:** Warden-Spezialisierungen ab 50, gewählt bei Ama: **Lightsworn** (Licht, Gelübde, heilt beim Schlag) und **Ironwall** (Cinder Iron, steht und hält). Je eine Fähigkeit auf 50.

**Nachschlag (gebaut):** Mender-Wege bei Tallow, Flarecaster-Wege bei Wren, Drifter-Wege beim Stranger (je eine Fähigkeit auf 50); neue Wirkung: `zone` kann blenden, brennen und festhalten. The Spillway unter den Sumps (Stufe 46 bis 50, Weir Eel, The Old Sluicegate, „Below the Weir“, Spillway Mail). „Fen's Map“. Alle acht Wege auch auf 54. Lampwright 16 Carrier's Lamp. „Ama's Tally“ (Spielstand `stacked`, Woodward's Hood). Gefallen logs_for_ama, eels_for_hesk, sluicegate_again. Hollis' sechstes Gerücht, Mothwick zu Wenna, Rufe, Ausguck-Text.

## Ausbau läuft

- **The Unending Maze** (seit 2026-11-13, von Chris gebaut aus Gebet 4): Stockwerke 1 bis 99 unter Cinderford, jeden Tag neu gewürfelt, Stufe = 3 + 2 × Stockwerk. Ausbau möglich: Rangliste auf dem Turn Board (braucht Chris: D1-Abfrage), weitere Keeper-Körper und -Eigenschaften (`BODIES`, `AFFIXES` in `content/regions/maze.js`), Rezepte aus Turnstones, mehr Gegenstände ab Stockwerk 25, Quests für tiefere Stockwerke (`keeper_10`, `keeper_20` gibt es schon).
- **Klassen bis 99 mit Spezialisierungen ab 50** (Dauerauftrag): Stand in `ROADMAP.md`: alle vier bis Stufe 48, seit Tag 6 jede Klasse mit zwei Wegen und je einer Fähigkeit auf 50 (Warden Lightsworn/Ironwall, Mender Hearthkeeper/Ashbinder, Flarecaster Sunwright/Prismist, Drifter Nightblade/Snarewright). Seit dem Nachschlag von Tag 6 haben alle acht Wege auch eine Fähigkeit auf 54. Nächste Nächte: pro Nacht eine Klasse, beide Wege auf 58 (Warden zuerst), dann 62 usw. Seit Tag 6 kann `zone` dazzle, root und burn. Seit Tag 5 kann `burst` auch `mend` (Gruppe heilt). Seit Tag 4 gibt es `exploit` (Schaden gegen brennende/geblendete/festsitzende Ziele): gut für weitere Stufen, auch kleinere exploit-Fähigkeiten für 12–30 wären schön (Gebet 8).
- **Der Bogen „The Second Light“**: Tag 6 hat Ama „The Beacon is starving“ ausgerufen (nach „Oil for the Road“), Wenna geht „morgen Nacht“. Tag 7: Wenna ist fort (Mühle leer, Zettel für Marrow), Weltproblem 1 sichtbar machen; Zettel 6 trägt die erste Bogen-Wahl (bread-north gegen bar-north-road).
- **Ama's Woodpile** (seit Tag 6): Stapel wächst mit dem Tageszähler. Ausbau: ein Vorrat über mehrere Tage (Weltzähler im Worker, nur mit Chris), Belohnung für die Gemeinschaft, wenn der Stapel voll ist, mehr Totholz in Copperdeep/Sinkmarsh.
- **The Spillway** (seit Tag 6): Stufe 46 bis 50. Ausbau: Inhalt 50 bis 56 (ein weiterer Gang, ein Gruppen-Wesen), Rezepte aus Sluicegate-Eisen.
- **The North Watch:** Text in `content/lookout.js` wächst mit dem Bogen (Tag 4: Schein so breit wie zwei Daumen).
- **Counting House:** fünf Geschäfte seit Tag 4 (Flint mit Nachlass `discount`). Weitere (Wren, Sorrel, Rook), Ausschüttung in Waren, gemeinsames Ziel pro Geschäft (bräuchte einen dauerhaften Weltzähler, nur mit Chris).
- **The Sumps** (seit Tag 5, Gebet 9): Stufe 40–46, seit Tag 6 der Spillway (46–50). Ausbau: Gruppen-Wesen, eine Leiter zur Burg der Quarrymen (Gebet 9: Burg und Markt).
- **The Old Mill** (seit Tag 5): mahlt Gerste und Glas. Ausbau: weitere Mahlregeln (`content/mill.js`), Cooking, falls gewählt.
- **Meisterstücke:** Tinkering 32–37 seit Tag 4. Weiter: Meisterstücke für Lampwright (Linse, Stab) und Alchemie, Tinkering 38–45.

## Nächste Nächte

- Tag 7 ist eine **Aufräumnacht** (7 teilbar): erst alle drei Teile, dann Code-Review der Tage 1 bis 7, Aufräumen, Tests, Doku.
- Inbox: prüfen, ob `2026-11-16.json` nachträglich kam (Gebete nachholen).
- Klassen: Warden-Wege auf 58 (Lightsworn, Ironwall).
- Inhalt für 50+ (Spillway reicht bis 50).
- Bogen: Wenna ist fort, Weltproblem 1 sichtbar; Zettel 6 auswerten (bread-north / bar-north-road).
- Mehr Gefallen, die Gruppen belohnen.

## Ideen für später

- Cooking bei Hollis (drei Nächte auf Zettel 3–5, ohne Stimmen gelesen, vorerst herunter).
- Signalfeuer entlang der Nordstraße (drei Nächte auf Zettel 3–5, vorerst herunter; passt zu Weltproblem 2 „The Northern Road“).

- Angeln im Bach (drei Nächte auf dem Zettel ohne Stimme, vorerst herunter).
- Ein Imker zieht nach Kindle (drei Nächte auf Zettel 1–3, ohne Stimme, vorerst herunter).
- Rangliste der Cup-Sieger bei Mabb; mehr Rätsel-Quests (Gebet 5) in anderen Häusern (seit Tag 4: Haus 3 mit der Karte, Haus 4 mit dem Brief; Haus 1 ist das Counting House; seit Tag 5 Gran's Locker bei Hesk).
- Aus Gebet 2: ein kleiner Talentbaum mit leichten Boni (größerer Umbau, später als Vorschlag).
- Aus Gebet 1: ein Übungsring für freundliche Zweikämpfe (Kampf zwischen Spielern ändert die Kampfregeln, nur mit Chris).
- Aus Gebet 7: Material bei Ama abgeben, bis sie eine Mauer baut. Passt zu einer großen Bogen-Entscheidung, die noch kommt; bis dahin steht ein gemeinsamer Vorrat für das Leuchtfeuer auf dem Zettel.
- Aus Gebet 9: eine Burg und ein belebter Markt in einer großen Stadt, ein neuer Beruf, eine Paladin-Klasse (als „Lightsworn“-Weg des Wardens auf Zettel 5). Die Sumps sind das erste Stück.
- Aus Gebet 10: ein feindliches Lager, dem Spieler beitreten und das Kindle angreift. Kampf zwischen Spielern ändert die Kampfregeln (nur mit Chris). Ohne Spielerkampf denkbar: ein Lager der Hollow Wardens (Bogen, Akt 2), das nachts Brennstoff stiehlt.
- Aus Gebet 8: abgeschlossene Abenteuer für eine Gruppe mit Rätseln, Beute und Boss (eigene Instanz pro Gruppe wäre ein großer Umbau; mit Chris). Kleiner Schritt: ein Rätselraum in der Drowned Chapel oder im Maze.

## Was ankommt

- Testrunde mit Freunden (2026-11-11): gewünscht wurden WASD-Laufen und besser lesbare Zahlen (beides gebaut), Sprechblasen statt Chatfenster, Gruppen und Handel.
- Erster Export (2026-11-11): 7 Charaktere, alle in 24 Stunden aktiv; Leuchtfeuer 29 von 300; 2 Gebete, 1 Stimme.
- Export 2026-11-14: 8 Charaktere, 2 aktiv in 24 Stunden; Leuchtfeuer 300 (Ziel erreicht); 2 Gebete, 2 Stimmen.
- Export 2026-11-15: 9 Charaktere, 3 aktiv; Leuchtfeuer der letzten Tage 295 bis 362; 2 Gebete, 1 Stimme.

## Bekannte Probleme

- Gebete 3 und 4 hat Chris am 2026-11-13 gebaut (Beutel 48, Cinderford und Maze); Tag 3 hat sie nur in `CHRONICLE.md` erwähnt, Chris markiert sie selbst als erhört.
- Der Smoke-Test lief in der Nachtumgebung mit dem vorinstallierten Chromium (`PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`), weil `tools/smoke.mjs` den Browser von Playwright 1.56 sonst nicht findet.
- Der Kern-Test „Gefallen erledigen“ (`tests/unit/sim.test.mjs`) nimmt den ersten Tag ab 2026-11-10 mit Abgabe- und Kampf-Gefallen und lässt einen Neuling (Stufe 1) gegen das Wesen des Kampf-Gefallens kämpfen. Welcher Gefallen gezogen wird, hängt von allen IDs in `content/dailies.js` ab; ein neuer Gefallen kann so einen Gegner ab Stufe 7 ziehen, und der Test scheitert. Tag 3 hat die ID des Gnawer-Gefallens so gewählt (`thin_gnawers`), dass die Krähen gezogen werden. Vorschlag an Chris: Der Test sollte einen leichten Kampf-Gefallen gezielt suchen.
- Ab Stufe 28 hat jede Klasse mehr Fähigkeiten als die Leiste Felder (9); neue landen nicht von selbst auf der Leiste, man zieht sie aus dem Fähigkeitenfenster. Die Meldung „New ability on your bar“ stimmt dann nicht ganz (`grantXp` in `shared/talk.js`).

- **Inbox-Export kam nicht an (Tag 1 und 2), behoben am 2026-11-13:** GitHub startete `inbox-export.yml` stark verspätet (11.11.) oder gar nicht (12.11.), die Prüfung auf 22 Uhr brach dann ab. Jetzt läuft der Export alle 30 Minuten zwischen 17 und 23 Uhr Berlin und überschreibt die Datei des Tages; `since` kommt aus der letzten Datei vor heute. Die Gebete seit dem 11.11. kommen mit der nächsten Datei an. Die Stimmen von Zettel 1 bleiben ungelesen (Zettel 2 läuft schon).

- Tag 4: Rook muss laut Kern-Test (`tests/unit/sim.test.mjs`, Berufe) in `content/regions/kindle.js` stehen. Für „Rook zieht nach drinnen“ steht er deshalb weiter im Hof; die Meisterstücke gehen nur an seiner guten Bank drinnen. Vorschlag an Chris: Der Test könnte Rook in beiden Gebieten suchen.
- Tag 4: Neue Wesen in `content/regions/kindle.js` verschieben die Zufallsfolge der Welt; alte Nachttests mit festen Seeds (z. B. `002-last-shift`) reagieren darauf. Neue Wesen deshalb ans Ende der Liste und, wenn sie still stehen, mit `moveEvery: 0`.
- Tag 5: Nachttests prüfen manchmal Pells Tagestext (z. B. `004-rook-masterwork` sucht „masterwork“). Pells Ausruf ändert sich jede Nacht; deshalb nennt er weiter Rooks Meisterstücke. Besser wäre, wenn alte Tests Pell nicht wörtlich prüfen.
- Tag 6: **Die Inbox-Datei `2026-11-16.json` fehlte** um 23 Uhr und bis Mitternacht. Die Nacht lief ohne Gebete und ohne Stimmen (den Gewinner von Zettel 5 wählte der Nightwright). Bitte `inbox-export.yml` prüfen.
- Tag 6: Im Kampf gibt es keine Sichtlinie: Fernkämpfer können The Undertow über die Mauer der Zisterne beschießen, ohne dass er sie erreicht. Eine Sichtlinie wäre eine Kampfregel (nur mit Chris); bis dahin Bosse nicht direkt hinter dünne Mauern setzen.
- Es gibt noch keinen automatischen Probespieler für die Balance (siehe `CLAUDE.md`, „Balance“).
- Der Chat hat noch keine Moderation (verstecken, stummschalten). Das baut Chris vor dem öffentlichen Start.
- Der Schein im Norden wird über Bäume gezeichnet (ohne Tiefentest, damit der Grey ihn nicht verdeckt); aus manchen Winkeln färbt er die Baumspitzen orange. Gewollt als Glühen, beobachten.

## Große Vorschläge

- #1 Truhe zum Einlagern in Kindle (Gebet 2), offen seit Tag 1. Chris hat die Truhe an Tag 1 in der Taverne selbst gebaut; das Issue ist damit erledigt, bleibt aber für Chris zum Schließen offen.
