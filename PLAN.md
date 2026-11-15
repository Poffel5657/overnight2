# Plan (Arbeitsdatei des Nachtlaufs)

Der Nightwright pflegt diese Datei jede Nacht (Regeln in `CLAUDE.md`).

## Inbox gelesen bis

`v2/inbox/2026-11-15.json` (Tag 5). Die nächste Nacht liest alle Dateien nach `2026-11-15.json`.

## Heute in Arbeit

Tag 5 (Nacht zum 2026-11-16). Inbox `v2/inbox/2026-11-15.json`: Gebete 9 und 10, Zettel 4: old-mill 1 Stimme, sonst keine. 9 Charaktere, 3 aktiv.

**Teil 1, aus den Gebeten: The Sumps unter Cinderford (Gebet 9)**
1. *Was der Spieler will:* Eine Stadt, die sich groß anfühlt, mit Kanälen und Verliesen zum Erkunden, und Licht als Glauben. Darunter: Neues zum Entdecken für hohe Stufen.
2. *Woran er es merkt:* Ein Gitter am Bach in Cinderford führt in die Sumps (Stufe 40–46): Drain Rats, Silt Crawler, alte Lampen-Nischen der Quarrymen (Kohlebecken), eine Truhe, ein Boss **The Undertow** am Wehr. Hesk sucht jemanden, der die Abflüsse frei macht (Quest-Kette in 3 Schritten), Sorrel und Flint reden davon, neue Beute (Verdigris) für Rezepte.
3. *Woran es anschließt:* Cinderford, Kampf/Klassen (Stufe 40+), Tinkering (neue Rezepte aus Verdigris), Licht/Kohlebecken, Truhen, Gefallen.
4. *Weg dorthin:* Pell ruft es aus, Hesk ab Stufe 38 („The Drains“), Flint erwähnt das Wasser.

**Teil 2, aus der Abstimmung: The Old Mill (old-mill, 1 Stimme)**
1. *Was der Spieler will:* Ein rätselhafter Ort, der etwas tut, und eine Antwort auf „wer mahlt hier was“.
2. *Woran er es merkt:* Mühle am Bach westlich der Straße nach Süden, das Rad dreht sich; am Mühlstein kann jeder mahlen (Gerste zu Mehl, Glas zu Glasgrieß), Gerste von Krähen und von Marrow; Hollis backt aus Mehl Millbread; nachts hat jemand im Trichter fremde Gerste gemahlen. Quest „Who Grinds at Night“.
3. *Woran es anschließt:* Händler (Marrow), Taverne (Hollis), Lampwright (Glasgrieß), Quests, Bogen.
4. *Weg dorthin:* Pell, Marrow schickt einen hin, Weg von der Straße bis vor die Mühle.

**Teil 3, vom Nightwright: Wenna, eine verirrte Trägerin (Bogen, Akt 1)**
1. *Was der Spieler will:* Endlich jemanden aus dem Norden treffen, ohne alles zu erfahren.
2. *Woran er es merkt:* Nachts mahlt eine erschöpfte Frau mit leerer grüner Laterne in der Mühle (tagsüber schläft sie). Quest „The Last Sack“: Brot bringen, ihre Laterne an der Leuchtfeuer füllen, sie zum Gebet fragen; sie erkennt das Birkenpapier-Gebet. Stranger und Ama reagieren.
3. *Woran es anschließt:* Mühle, Leuchtfeuer/Öl, Kapelle (Opferkasten-Gebet), Stranger, Bogen.
4. *Weg dorthin:* Folgt aus „Who Grinds at Night“; Fen und Pell erwähnen sie.

**Dauerauftrag Klassen:** Warden 44 **Hallowed Ground** (neue Wirkung: burst heilt Verbündete, `mend`). **Nachschlag (gebaut):** Mender, Flarecaster, Drifter 44 (Vesper Bell, Lanternfall, Gloaming); Tinkering 38–40 Sumpwalker; Lampwright 38/39 Verdigris Staff und Lens; Alchemie 36 Sluice Draught; Glass Grit aus der Mühle und Lampwright 22 Hollow-Glass Lantern; „The Lamp Under the Hill“ (Gebet 9, Licht als Glaube); „The Miller's Ledger“; Gefallen rats_for_hesk und flour_for_hollis; Rufe, Gerücht, Ausguck. Gebet 10 (Spielerkampf) unter „Ideen für später“.

## Ausbau läuft

- **The Unending Maze** (seit 2026-11-13, von Chris gebaut aus Gebet 4): Stockwerke 1 bis 99 unter Cinderford, jeden Tag neu gewürfelt, Stufe = 3 + 2 × Stockwerk. Ausbau möglich: Rangliste auf dem Turn Board (braucht Chris: D1-Abfrage), weitere Keeper-Körper und -Eigenschaften (`BODIES`, `AFFIXES` in `content/regions/maze.js`), Rezepte aus Turnstones, mehr Gegenstände ab Stockwerk 25, Quests für tiefere Stockwerke (`keeper_10`, `keeper_20` gibt es schon).
- **Klassen bis 99 mit Spezialisierungen ab 50** (Dauerauftrag): Stand in `ROADMAP.md`: alle vier bis Stufe 44 (Tag 5). Nächste Nacht: Warden (48), dann Mender, Flarecaster, Drifter. Seit Tag 5 kann `burst` auch `mend` (Gruppe heilt). Seit Tag 4 gibt es `exploit` (Schaden gegen brennende/geblendete/festsitzende Ziele): gut für weitere Stufen, auch kleinere exploit-Fähigkeiten für 12–30 wären schön (Gebet 8).
- **Der Bogen „The Second Light“**, Akt 1 endet (Tag 5: Wenna in der Mühle, „ihr Feuer hungert“). Tag 6: Ama ruft das Weltproblem aus; Tag 7: erste Bogen-Option auf dem Zettel. Wenna sitzt noch in der Mühle und kann später nach Norden aufbrechen.
- **The North Watch:** Text in `content/lookout.js` wächst mit dem Bogen (Tag 4: Schein so breit wie zwei Daumen).
- **Counting House:** fünf Geschäfte seit Tag 4 (Flint mit Nachlass `discount`). Weitere (Wren, Sorrel, Rook), Ausschüttung in Waren, gemeinsames Ziel pro Geschäft (bräuchte einen dauerhaften Weltzähler, nur mit Chris).
- **The Sumps** (seit Tag 5, Gebet 9): Stufe 40–46. Ausbau: ein zweiter Flügel hinter dem Wehr für 46–50, Gruppen-Wesen, eine Leiter zur Burg der Quarrymen (Gebet 9: Burg und Markt).
- **The Old Mill** (seit Tag 5): mahlt Gerste und Glas. Ausbau: weitere Mahlregeln (`content/mill.js`), Cooking, falls gewählt.
- **Meisterstücke:** Tinkering 32–37 seit Tag 4. Weiter: Meisterstücke für Lampwright (Linse, Stab) und Alchemie, Tinkering 38–45.

## Nächste Nächte

- Warden auf Stufe 48, dann Mender, Flarecaster, Drifter (alle haben 44 seit Tag 5). Danach Spezialisierungen (ab 50).
- Inhalt für 46+ (Tag 5: The Sumps bis 46).
- Bogen: Tag 6 Ama und „The Beacon Starves“ vorbereiten (Wenna hat den Hunger angekündigt).
- Mehr Gefallen, die Gruppen belohnen.

## Ideen für später

- Angeln im Bach (drei Nächte auf dem Zettel ohne Stimme, vorerst herunter).
- Ein Imker zieht nach Kindle (drei Nächte auf Zettel 1–3, ohne Stimme, vorerst herunter).
- Rangliste der Cup-Sieger bei Mabb; mehr Rätsel-Quests (Gebet 5) in anderen Häusern (seit Tag 4: Haus 3 mit der Karte, Haus 4 mit dem Brief; Haus 1 ist das Counting House).
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
- Es gibt noch keinen automatischen Probespieler für die Balance (siehe `CLAUDE.md`, „Balance“).
- Der Chat hat noch keine Moderation (verstecken, stummschalten). Das baut Chris vor dem öffentlichen Start.
- Der Schein im Norden wird über Bäume gezeichnet (ohne Tiefentest, damit der Grey ihn nicht verdeckt); aus manchen Winkeln färbt er die Baumspitzen orange. Gewollt als Glühen, beobachten.

## Große Vorschläge

- #1 Truhe zum Einlagern in Kindle (Gebet 2), offen seit Tag 1. Chris hat die Truhe an Tag 1 in der Taverne selbst gebaut; das Issue ist damit erledigt, bleibt aber für Chris zum Schließen offen.
