# Plan (Arbeitsdatei des Nachtlaufs)

Der Nightwright pflegt diese Datei jede Nacht (Regeln in `CLAUDE.md`).

## Inbox gelesen bis

`v2/inbox/2026-11-13.json` (Tag 3). Die nächste Nacht liest alle Dateien nach `2026-11-13.json`.

## Heute in Arbeit

Tag 3 (Nacht zum 2026-11-14). Inbox `v2/inbox/2026-11-13.json`: Gebete 3 bis 6 (3 und 4 hat Chris schon gebaut), Zettel 2: snail-cup 2 Stimmen, sonst keine.

**Teil 1, aus den Gebeten: das Zählhaus und ein Rätsel (Gebete 6 und 5)**
1. *Was der Spieler will:* Gold, das nicht nur im Beutel liegt, sondern im Dorf etwas bewegt und zurückkommt (Gebet 6); Häuser, die einen Zweck haben, und Quests, bei denen man nachdenken muss (Gebet 5).
2. *Woran er es merkt:* Das Haus nördlich des Platzes wird „the Counting House“ (eigener Name, Gegend im Innenraum). Darin sitzt Coyne, die Geldverleiherin. Man kauft Anteile (bis zu drei) an Marrows Stand, der Taverne und dem Nachtmarkt; jeder Anteil bringt einmal am Tag eine kleine Ausschüttung bei Coyne und schaltet beim jeweiligen Händler Ware „für Teilhaber“ frei. Pell ruft es aus, Marrow und Hollis reden darüber. Quest „A Stake in Kindle“ (ersten Anteil kaufen, Marrow davon erzählen). Rätsel-Quest „The Old Strongbox“: Coynes Vorgänger hat eine Truhe mit drei Symbolrädern hinterlassen; der Zettel mit drei Rätseln liegt in seinem alten Haus, Antworten kennt man aus der Welt (Tallow, Mabb, Ama geben Hinweise), falsche Einstellung lässt die Truhe zu.
3. *Woran es anschließt:* Händler (Ware für Teilhaber), Gold, Quests, Kapelle/Chor (Rätsel), Schneckenrennen (Rätsel), Häuser in Kindle.
4. *Weg dorthin:* Pell und Marrow schicken einen ins Counting House direkt am Platz; Coyne hat ein `!`.

**Teil 2, aus der Abstimmung: der Snail Cup (Zettel 2, 2 Stimmen)**
1. *Was der Spieler will:* Mehr aus den Schneckenrennen: neue Schnecken, ein Ziel, etwas zum Vorzeigen.
2. *Woran er es merkt:* Zwei neue Schnecken (Duchess, Thistle) auf zwei neuen Bahnen; Mabb hat eine Pokal-Quest „The Snail Cup“ (drei gewonnene Wetten), der Pokal ist ein tragbarer Hut; am Wochenende ist „Cup Day“ mit höherem Einsatz (50 Gold). Pell ruft es aus.
3. *Woran es anschließt:* Schneckenrennen, Gold, Ausrüstung (Kopf), Quests.
4. *Weg dorthin:* Mabb am Westweg, Pell, die Quest-Laterne.

**Teil 3, vom Nightwright: die Spur der Träger (Bogen, Akt 1)**
1. *Was der Spieler will:* Weiterkommen im Rätsel um das Licht im Norden, mit Inhalt für Stufe 14 bis 20.
2. *Woran er es merkt:* Brindle sah nachts Laternen, die sich am Nordrand bewegten. Quest „Carriers in the Dark“ (Brindle, ab 14): ein zerbrochenes Tragegestell und ein Kerbholz am Nordrand finden, Wren und der Stranger deuten es; neue Wesen „Grey Gnawer“ am Nordrand, die die Vorräte der Träger fressen. Der Schein im Norden wird heller (Ausguck-Text, `farLight`).
3. *Woran es anschließt:* Quests, Kampf, Ausguck, Licht, der Bogen, der Stranger.
4. *Weg dorthin:* Brindle am Ausguck (Nordstraße), Pell ruft es aus.

**Dauerauftrag Klassen: Warden** Stufe 28: Lantern Hook (neue Wirkung `pull`: holt ein Wesen aus der Ferne vor den Schild).

**Nachschlag (gebaut):** alle vier Klassen bis 32 (Shield Wall, Sanctuary, Corona, Vanishing Cut), Tinkering 18 Carrier's Wraps, Ama und Fen zu den Trägern; Mender Ember Mend, Flarecaster Noonbrand, Drifter Lampblack Cut (alle 28); Rooks Werkstatt doppelt so groß mit der guten Werkbank und Tansy; Hesks Stand als viertes Geschäft; Rätsel-Schatzsuche „Abel's Three Caches“; zwei Gefallen am Nordrand; Gespräche und Rufe. Alles gebaut und getestet (`tests/night/003-*`). Rook selbst bleibt draußen (Kern-Tests erwarten ihn in Kindle), steht als „rook-masterwork“ auf dem Stimmzettel.

## Ausbau läuft

- **The Unending Maze** (seit 2026-11-13, von Chris gebaut aus Gebet 4): Stockwerke 1 bis 99 unter Cinderford, jeden Tag neu gewürfelt, Stufe = 3 + 2 × Stockwerk. Gerüst fertig, Ausbau in späteren Nächten möglich: Rangliste der Tiefsten auf dem Turn Board (braucht Chris: D1-Abfrage), weitere Keeper-Körper und -Eigenschaften (`BODIES`, `AFFIXES` in `content/regions/maze.js`), Rezepte aus Turnstones, mehr Gegenstände ab Stockwerk 25 (Stufe 53+), Quests für tiefere Stockwerke (Aktion `keeper_10`, `keeper_20` gibt es schon).

- **Klassen bis 99 mit Spezialisierungen ab 50** (Dauerauftrag, siehe `CLAUDE.md`): jede Nacht mindestens eine Klasse ein Stück weiter, Reihenfolge Warden, Mender, Flarecaster, Drifter. Stand in `ROADMAP.md`: alle vier bis Stufe 32. Nächste Nacht: Warden (36), dann Mender, Flarecaster, Drifter.
- **Der Bogen „The Second Light“**, Akt 1 läuft (Licht im Norden, Ausguck, fliehende Wölfe, fremdes Gebet, Hauptbuch des Foreman). Weitere Andeutungen in den nächsten Nächten.
- **The North Watch:** Der Text in `content/lookout.js` soll mit dem Bogen wachsen (Tag 3: Schein größer, Lampen der Träger sichtbar).
- **Counting House:** weitere Geschäfte (Wren, Rook, Sorrel), Ausschüttung in Waren statt Gold, ein gemeinsames Ziel pro Geschäft (bräuchte einen dauerhaften Weltzähler, nur mit Chris).

## Nächste Nächte

- Warden auf Stufe 36, dann Mender, Flarecaster, Drifter (36). Danach Spezialisierungen vorbereiten (ab 50). Ab 30 braucht es neue Gegner und Ausrüstung.
- Inhalt für 40+ (Tag 2 brachte „Lights That Eat Lights“ ab 23 und „The Oil Rush“ ab 26).
- Bogen: Tag 3 brachte die Träger (Kerbholz, Torfbrot, „der alte Weg nach Süden“). Als Nächstes: der Stranger ohne Schatten im Leuchtfeuer (jemand bemerkt es), Ama rechnet mit mehr Brennstoff (Vorbereitung auf „The Beacon Starves“ ab Tag 7).
- Mehr Gefallen, die Gruppen belohnen (Tag 2: der erste, „foreman_again“).
- Wesen und Gebiete für 40+ (die Klassen wachsen schneller als der Inhalt).

## Ideen für später

- Eine alte Mühle im Grey, die sich von selbst dreht (drei Nächte auf dem Zettel ohne Stimme, vorerst herunter).
- Angeln im Bach (drei Nächte auf dem Zettel ohne Stimme, vorerst herunter).
- Ein Imker zieht nach Kindle (steht auf dem Stimmzettel, dritte Nacht).
- Kochen bei Hollis, Signalfeuer an der Nordstraße, Rook drinnen mit Meisterrezepten (alle auf Zettel 3).
- Rangliste der Cup-Sieger bei Mabb; mehr Rätsel-Quests (Gebet 5) in anderen Häusern (Haus 3 mit der Karte voller Kreuze).
- Aus Gebet 2: ein kleiner Talentbaum mit leichten Boni (größerer Umbau, später als Vorschlag). Die Truhe steht seit Tag 1 in der Taverne.
- Aus Gebet 1: ein Übungsring für freundliche Zweikämpfe (Kampf zwischen Spielern ändert die Kampfregeln, nur mit Chris).

## Was ankommt

- Testrunde mit Freunden (2026-11-11): gewünscht wurden WASD-Laufen und besser lesbare Zahlen (beides gebaut), Sprechblasen statt Chatfenster, Gruppen und Handel.
- Erster Export (2026-11-11): 7 Charaktere, alle in 24 Stunden aktiv; Leuchtfeuer 29 von 300; 2 Gebete, 1 Stimme.

## Bekannte Probleme

- Gebete 3 und 4 hat Chris am 2026-11-13 gebaut (Beutel 48, Cinderford und Maze); Tag 3 hat sie nur in `CHRONICLE.md` erwähnt, Chris markiert sie selbst als erhört.
- Der Smoke-Test lief in der Nachtumgebung mit dem vorinstallierten Chromium (`PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`), weil `tools/smoke.mjs` den Browser von Playwright 1.56 sonst nicht findet.
- Der Kern-Test „Gefallen erledigen“ (`tests/unit/sim.test.mjs`) nimmt den ersten Tag ab 2026-11-10 mit Abgabe- und Kampf-Gefallen und lässt einen Neuling (Stufe 1) gegen das Wesen des Kampf-Gefallens kämpfen. Welcher Gefallen gezogen wird, hängt von allen IDs in `content/dailies.js` ab; ein neuer Gefallen kann so einen Gegner ab Stufe 7 ziehen, und der Test scheitert. Tag 3 hat die ID des Gnawer-Gefallens so gewählt (`thin_gnawers`), dass die Krähen gezogen werden. Vorschlag an Chris: Der Test sollte einen leichten Kampf-Gefallen gezielt suchen.
- Ab Stufe 28 hat jede Klasse mehr Fähigkeiten als die Leiste Felder (9); neue landen nicht von selbst auf der Leiste, man zieht sie aus dem Fähigkeitenfenster. Die Meldung „New ability on your bar“ stimmt dann nicht ganz (`grantXp` in `shared/talk.js`).

- **Inbox-Export kam nicht an (Tag 1 und 2), behoben am 2026-11-13:** GitHub startete `inbox-export.yml` stark verspätet (11.11.) oder gar nicht (12.11.), die Prüfung auf 22 Uhr brach dann ab. Jetzt läuft der Export alle 30 Minuten zwischen 17 und 23 Uhr Berlin und überschreibt die Datei des Tages; `since` kommt aus der letzten Datei vor heute. Die Gebete seit dem 11.11. kommen mit der nächsten Datei an. Die Stimmen von Zettel 1 bleiben ungelesen (Zettel 2 läuft schon).

- Es gibt noch keinen automatischen Probespieler für die Balance (siehe `CLAUDE.md`, „Balance“).
- Der Chat hat noch keine Moderation (verstecken, stummschalten). Das baut Chris vor dem öffentlichen Start.
- Der Schein im Norden wird über Bäume gezeichnet (ohne Tiefentest, damit der Grey ihn nicht verdeckt); aus manchen Winkeln färbt er die Baumspitzen orange. Gewollt als Glühen, beobachten.

## Große Vorschläge

- #1 Truhe zum Einlagern in Kindle (Gebet 2), offen seit Tag 1. Chris hat die Truhe an Tag 1 in der Taverne selbst gebaut; das Issue ist damit erledigt, bleibt aber für Chris zum Schließen offen.
