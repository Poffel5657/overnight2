# Plan (Arbeitsdatei des Nachtlaufs)

Der Nightwright pflegt diese Datei jede Nacht (Regeln in `CLAUDE.md`).

## Inbox gelesen bis

`v2/inbox/2026-11-11.json` (Tag 1). Tag 2: keine neue Datei vorhanden (Export verspätet, siehe „Bekannte Probleme“). Die nächste Nacht liest alle Dateien nach `2026-11-11.json`.

## Heute in Arbeit

Tag 2 (Nacht zum 2026-11-13). Die Inbox-Datei des Abends lag um 23 Uhr noch nicht vor (Export-Lauf verspätet); geplant ohne neue Gebete und ohne Stimmen, bei Gleichstand entscheidet der Nightwright.

**Teil 1, aus den Gebeten:** Keine neuen Gebete gelesen (siehe oben). Entfällt, Teil 3 wird größer (zwei Quests, ein Wesen, ein Rezept).

**Teil 2, aus der Abstimmung: der Ausguck am Nordrand (Zettel 1, ohne Stimmen; Wahl des Nightwrights, weil er den Bogen trägt)**
1. *Was der Spieler will:* Einen Ort, an dem man dem Licht im Norden näher ist und es wirklich sehen kann; das Gefühl, mitzuhelfen, statt nur zuzusehen.
2. *Woran er es merkt:* Ein Holzturm mit Laterne am Ende der Nordstraße (eigene Gegend „THE NORTH WATCH“ in der Statusanzeige, auf der Karte); Brindle ruft Vorbeigehende; Pell ruft ihn aus; Haskel bietet die Quest „Eyes on the North“ ab Stufe 10 an. Man sammelt Wolfsfelle für den Windschutz, holt bei Wren eine Fernrohrlinse (mit Grey Wisps poliert), klettert nachts hinauf und sieht das Licht (Log). Danach: einmal pro Nacht hinaufklettern gibt ein wenig Erfahrung; Brindle hat einen Gefallen (Wolfsfelle) am Anschlagbrett.
3. *Woran es anschließt:* Quests (neue Aktion `watch`), Tag und Nacht, Licht (Watcher's Hood mit Licht +1), Händler/Handel (Felle, Wisps), Gefallen, der Bogen.
4. *Weg dorthin:* Nordstraße von Kindle durch Hushwood bis zum Ende; Haskel am Holzfällerfeuer schickt einen hin.

**Teil 3, vom Nightwright: Unruhe im Norden (Bogen, Akt 1)**
1. *Was der Spieler will:* Merken, dass das Licht im Norden Folgen hat, und Inhalt zwischen Stufe 5 und 10 (bisher fast leer).
2. *Woran er es merkt:* Neue Wesen „Restless Wolf“ (Stufe 7) am Waldrand nordwestlich der Felder; Ama ab Stufe 5 mit „The Restless Pack“ (fünf Wölfe, versengtes Fell, Haskel riecht fremden Rauch); Tallow mit „A Prayer Not Ours“ (fremdes Gebet im Opferkasten der Kapelle, Pell, nachts Mothwick). Versengtes Fell füttert das Leuchtfeuer und wird zur Smoke-Ruff Hood (Tinkering 6). Gefallen bei Haskel und Ama.
3. *Woran es anschließt:* Kampf, Quests, Leuchtfeuer, Tinkering, Gefallen, Kapelle, Nachtmarkt.
4. *Weg dorthin:* Ama und Tallow stehen mitten im Dorf und rufen; Pell ruft die Wölfe aus.

**Dauerauftrag Klassen: Flarecaster** bis Stufe 16: Glare (10, blendet aus der Ferne), Cinder Brand (13, neue Wirkung `burn`: Ziel brennt nach), Starfall (16, große Fläche).

**Nachschlag (gebaut):** Drifter bis Stufe 16; Warden Bulwark (20); Mender Smoulder (20); Flarecaster Sunlance (20); Drifter Smoke Bomb (20); Warden Last Light (24); Mender Kindred Glow (24); Flarecaster Prism Ward (24); Drifter Gutter Strike (24); Mothwicks Quest „Lights That Eat Lights“ (23+); Marrows Quest „The Oil Rush“ (26+); Choir Wraiths (36) in der Drowned Chapel; Alchemie Wisplight Draught (24); Tinkering Wraithsilk Hood (30) und Wardstone Boots (31); Salvage Old Shaft (26); Foraging Drowned Garden (26); Cartography North Cairn (26); grüne Glasscherben in Hushwood mit Gefallen bei Fen und Green Glass Lens; Mothwicks Ware wechselt jede Nacht; The Old Foreman mit „The Last Shift“ (Copperdeep, Stufe 18–21, Faden „for the Hollow fire“); Fehler behoben: Licht aus Rüstung (Choir Mantle) zählte nicht. Alles gebaut und getestet (`tests/night/002-*`).

## Ausbau läuft

- **Klassen bis 99 mit Spezialisierungen ab 50** (Dauerauftrag, siehe `CLAUDE.md`): jede Nacht mindestens eine Klasse ein Stück weiter, Reihenfolge Warden, Mender, Flarecaster, Drifter. Stand in `ROADMAP.md`: alle vier bis Stufe 24. Nächste Nacht: Warden (28).
- **Der Bogen „The Second Light“**, Akt 1 läuft (Licht im Norden, Ausguck, fliehende Wölfe, fremdes Gebet, Hauptbuch des Foreman). Weitere Andeutungen in den nächsten Nächten.
- **The North Watch:** Der Text in `content/lookout.js` soll mit dem Bogen wachsen (das Licht wird heller, Brindles Buch).

## Nächste Nächte

- Warden auf Stufe 28, dann Mender, Flarecaster, Drifter (28). Ab 30 braucht es neue Gegner und Ausrüstung.
- Inhalt für 40+ (Tag 2 brachte „Lights That Eat Lights“ ab 23 und „The Oil Rush“ ab 26).
- Bogen: Fen zählt die grünen Scherben (seit Tag 2); als Nächstes Spuren von Trägern am Nordrand; der Schein wird heller (`farLight` größer, Text am Ausguck).
- Mehr Gefallen, die Gruppen belohnen (Tag 2: der erste, „foreman_again“).
- Wesen und Gebiete für 40+ (die Klassen wachsen schneller als der Inhalt).

## Ideen für später

- Eine alte Mühle im Grey, die sich von selbst dreht (steht auf dem Stimmzettel).
- Angeln im Bach (steht auf dem Stimmzettel).
- Ein Imker zieht nach Kindle (steht auf dem Stimmzettel).
- Aus Gebet 2: ein kleiner Talentbaum mit leichten Boni (größerer Umbau, später als Vorschlag). Die Truhe steht seit Tag 1 in der Taverne.
- Aus Gebet 1: ein Übungsring für freundliche Zweikämpfe (Kampf zwischen Spielern ändert die Kampfregeln, nur mit Chris).
- Mehr Schnecken, ein Schneckenpokal am Wochenende (steht seit Zettel 2 auf dem Stimmzettel).

## Was ankommt

- Testrunde mit Freunden (2026-11-11): gewünscht wurden WASD-Laufen und besser lesbare Zahlen (beides gebaut), Sprechblasen statt Chatfenster, Gruppen und Handel.
- Erster Export (2026-11-11): 7 Charaktere, alle in 24 Stunden aktiv; Leuchtfeuer 29 von 300; 2 Gebete, 1 Stimme.

## Bekannte Probleme

- **Inbox-Export kam nicht an (Tag 1 und 2), behoben am 2026-11-13:** GitHub startete `inbox-export.yml` stark verspätet (11.11.) oder gar nicht (12.11.), die Prüfung auf 22 Uhr brach dann ab. Jetzt läuft der Export alle 30 Minuten zwischen 17 und 23 Uhr Berlin und überschreibt die Datei des Tages; `since` kommt aus der letzten Datei vor heute. Die Gebete seit dem 11.11. kommen mit der nächsten Datei an. Die Stimmen von Zettel 1 bleiben ungelesen (Zettel 2 läuft schon).

- Es gibt noch keinen automatischen Probespieler für die Balance (siehe `CLAUDE.md`, „Balance“).
- Der Chat hat noch keine Moderation (verstecken, stummschalten). Das baut Chris vor dem öffentlichen Start.
- Der Schein im Norden wird über Bäume gezeichnet (ohne Tiefentest, damit der Grey ihn nicht verdeckt); aus manchen Winkeln färbt er die Baumspitzen orange. Gewollt als Glühen, beobachten.

## Große Vorschläge

- #1 Truhe zum Einlagern in Kindle (Gebet 2), offen seit Tag 1, Entwurf in `v2/proposals/stash.md` im Inbox-Repo.
