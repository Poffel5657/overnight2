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

## Tag 2 (Nacht zum 2026-11-13): Augen nach Norden

**Inbox:** Die Datei des Abends (`v2/inbox/2026-11-12.json`) lag nicht vor. Der Export-Workflow wird von GitHub per Cron mit über vier Stunden Verspätung gestartet (letzte Nacht: 21:50 UTC geplant, gelaufen um 02:00 und 02:33 UTC) und bricht dann ab, weil es nicht mehr 22 Uhr in Berlin ist. Keine neuen Gebete, keine Stimmen gelesen. Steht unter „Bekannte Probleme“ in `PLAN.md`.

**Teil 1, Gebete:** Entfällt (keine neuen Gebete gelesen). Teil 3 ist dafür größer.

**Teil 2, Abstimmung: der Ausguck am Nordrand.** Zettel 1: old-mill, fishing, north-lookout, beekeeper; Stimmen unbekannt (siehe Inbox). Ohne Stimmen entscheidet der Nightwright: north-lookout, weil er den Bogen trägt.
- *Gewünscht:* Ein Ort am Rand von Hushwood, von dem aus man das Licht im Norden beobachten kann.
- *Geliefert:* „The North Watch“, ein Holzturm mit Windschutz aus Wolfsfell und Laterne am Ende der Nordstraße (eigene Gegend in der Statusanzeige, auf der Karte, Pfad von der Straße). Brindle, Haskels Schwester, hält Wache. Quest-Kette „Eyes on the North“ (Haskel, ab Stufe 10, neun Schritte): Brindle finden, drei Wolfsfelle für den Windschutz, drei Grey Wisps zu Wren, die eine Fernrohrlinse schleift, Linse zu Brindle, nachts hinaufklettern und nach Norden schauen, Brindle berichten. Lohn: 700 EP, 40 Gold, Watcher's Hood (Kopf, Abwehr 3, Licht +1), zwei Moss Salves. Danach: Hinaufklettern geht immer (Aktion „Climb up“), nachts einmal pro Tag etwas Erfahrung (30 + 4 pro Stufe). Gefallen „pelts_for_brindle“ am Anschlagbrett.
- *Fehlt noch:* Der Blick von oben ist ein Text, kein eigenes Bild. Später: Brindles Buch mit dem Stand des Lichts, das sich mit dem Bogen verändert (`content/lookout.js`).

**Teil 3, Nightwright: Unruhe im Norden (Bogen, Akt 1).**
- *Restless Wolves:* neues Wesen Restless Wolf (Stufe 7, normal), sechs am Waldrand nordwestlich der Felder, jenseits des Bachs. Füllt die Lücke zwischen Greylingen (3) und Hushwood-Wölfen (12). Beute: Singed Tuft (füttert das Leuchtfeuer mit +2, Rezept Smoke-Ruff Hood für Tinkering 6: Kopf, Abwehr 2, Licht +0,5), manchmal ein Wolfsfell.
- *Quest „The Restless Pack“* (Ama, ab Stufe 5): fünf Wölfe, drei versengte Fellbüschel, Haskel riecht fremden Rauch (Torf oder Fett, nicht Kiefer), zurück zu Ama. Lohn: 280 EP, 25 Gold, Brass-Toed Boots, Brot.
- *Quest „A Prayer Not Ours“* (Tallow, nach Kindling): ein fremdes Gebet auf Birkenrindenpapier im Opferkasten neben dem Altar (neues Objekt in der Kapelle), Pell erkennt, dass es keine Kindle-Hand ist, Mothwick (nur nachts) erkennt das Papier aus dem Norden und erinnert sich an eine Frau mit grüner Laterne, Tallow legt es auf den Altar. Lohn: 140 EP, 15 Gold, zwei Glow Draughts.
- Gefallen „restless_wolves“ (Haskel) und „tufts_for_ama“ (Ama). Pell ruft die Wölfe und den Ausguck aus. Tallows veralteter Satz „Praying opens soon“ ist ersetzt.

**Klassen (Dauerauftrag): Flarecaster** bis Stufe 16. Glare (10, Fernschlag, blendet 1,8 s), Cinder Brand (13, 6 Öl, neue Wirkung `burn`: das Ziel brennt 3,6 s nach, 4 + Stufe/4 alle 0,6 s), Starfall (16, 14 Öl, Fläche Radius 2 bis 6 Felder weit). `burn` in `shared/sim.js` (castAbility, updateMob), Beschreibung in `shared/describe.js`; Fernschläge beschreiben jetzt auch Blenden.

**Nachschlag:**
- **Drifter bis Stufe 16:** Cheap Shot (10, blendet), Night Edge (13, +50 % Schaden im Dunkeln, neue Eigenschaft `dark`, Hilfsfunktion `inDark`), Caltrops (16, Stoß im Umkreis 2, alles steckt 3 s fest; `burst` kann jetzt `root`). Damit haben alle vier Klassen Fähigkeiten bis Stufe 16.
- **The Old Foreman und „The Last Shift“:** Der verlassene Vorarbeiter aus der Welt-Bibel steht jetzt im Nordosten von Copperdeep (Stufe 21, Einzel-Boss mit zwei angekündigten Angriffen, heilt sich, wenn alle gehen). Brack bietet ab Stufe 18 nach „The Singing Seam“ die Quest an; das Hauptbuch erzählt von Glimmer, der jede Woche nach Norden ging, „for the Hollow fire“. Der Stranger reagiert darauf. Beute: Foreman's Lamp (Laterne, Licht +2,5, 50 % weniger Öl, 30 %), Glimmer, Messing; Lampwrights können die Lampe ab Stufe 19 bauen. Schließt die Lücke zwischen 16 und 22.
- **Mothwicks Ware wechselt jede Nacht:** zwei Dinge aus einem Vorrat von elf (darunter grüne Scherben und Wisp Cores) (`rotating` in `content/shops.js`, `shopStock`), für alle gleich, nach Datum. Neue Antwort „Anything new tonight?“. Erfüllt das „Fehlt noch“ vom Tag 1.
- **Fehler behoben:** Licht aus Rüstung (Choir Mantle, Licht +1) zählte nicht; jetzt rechnet `lanternBonus` Licht aus allen Plätzen, und das Tooltip zeigt es.
- **Warden Stufe 20: Bulwark** (8 Öl): alle Wesen im Umkreis 4 greifen den Warden an, er und alle Verbündeten im selben Umkreis nehmen 3 s halben Schaden (`taunt` kann jetzt `brace`).
- **Flarecaster Stufe 20: Sunlance** (10 Öl): der weiteste Schuss (7 Felder), 14–18 plus Waffenkraft.
- **Drifter Stufe 20: Smoke Bomb**: blendet alles im Umkreis 2 für 1,8 s (angekündigte Angriffe verpuffen), dann verlieren einen die Wesen 3,6 s aus den Augen (`fade` kann `radius` und `dazzle`).
- **Warden Stufe 24: Last Light** (10 Öl, 27 s Abklingzeit): heilt 40 und halbiert 4,8 s lang den Schaden, der große Schutz für Bosse. **Mender Stufe 24: Kindred Glow** (12 Öl): Wärme über Zeit für alle im Umkreis 5, 8 alle 0,6 s für 6 s.
- **Flarecaster Stufe 24: Prism Ward** (8 Öl): alle im Umkreis 3 nehmen 3 s halben Schaden. **Drifter Stufe 24: Gutter Strike**: 14–18 plus Waffenkraft, im Dunkeln 75 % mehr. Damit haben alle vier Klassen Fähigkeiten bis Stufe 24.
- **Mender Stufe 20: Smoulder** (8 Öl): Glut auf allem im Umkreis 2, das 4,8 s nachbrennt (`burst` kann jetzt `burn`). Gibt Mendern allein etwas mehr Schaden.
- **„Lights That Eat Lights“** (Mothwick, nachts, ab Stufe 23): fünf Will-o'-Wisps nach Einbruch der Dunkelheit, drei Wisp Cores (neue Beute, 45 %). Mothwick hält einen Kern an ihre Laterne: Das Licht darin zieht nach Norden. Lohn: 900 EP, 50 Gold, Lily Oil, Moon Candles. Für die dünne Strecke 22 bis 28.
- **„The Oil Rush“** (Marrow, ab Stufe 26, seine erste Quest): Seit dem Schein im Norden hortet Kindle Öl, Marrow hat keinen Talg mehr. Vier Bog Toads, drei Lily Bulbs. Lohn: 1.100 EP, 60 Gold, vier Lily Oil. Für die Strecke 25 bis 28.
- **Gefallen „foreman_again“** (Brack): den Old Foreman noch einmal zur Ruhe bringen, gut zu zweit (40 Gold, 300 EP). Erster Gefallen, der eher für Gruppen gedacht ist.
- **Choir Wraiths** (Stufe 36, normal): zwei Sänger des ertrunkenen Chors in den hinteren Ecken der Seitenschiffe der Drowned Chapel, weit genug vom Lamplighter. Beute: Greyglass, Sodden Hymnals, Grey Wisps. Gefallen „quiet_the_choir“ bei Tallow (zwei Wraiths). Schließt die Lücke zwischen den Pilgern (32) und dem Boss (40). Balance: 170 HP, 15–18 Schaden, ring mit 6 Takten; Warden 36 mit Greyglass gewinnt und verliert Leben.
- **Salvage Stufe 26: Old Shaft** im Nordosten von Copperdeep, neben dem Old Foreman: Glimmer, manchmal Greyglass. Sammeln ging bisher nur bis 23.
- **Cartography Stufe 26: North Cairn** (zwei am Nordrand von Hushwood, links und rechts des Ausgucks): Survey Notes, manchmal eine grüne Glasscherbe. Alte Steinmänner, die nach Norden zeigen (Bogen). Cartography ging bisher nur bis 24.
- **Foraging Stufe 26: Drowned Garden** (zwei im tiefen Sinkmarsh): Nightcaps, manchmal Lily Bulbs. Foraging ging bisher nur bis 22.
- **Tinkering Stufe 30 und 31:** Wraithsilk Hood (Greyglass, Sodden Hymnals, Glimmer) und Wardstone Boots (Greyglass, Beetle Shells, Glimmer), je Abwehr 5, eins mehr als Greyglass. Tinkering hörte bisher bei 28 auf; Hymnals haben jetzt nach der Quest noch einen Zweck.
- **Alchemie Stufe 24: Wisplight Draught** aus Wisp Core und Nightcap (Glühen 90 s, 50 Öl). Alchemie hörte bisher bei 21 auf.
- **Grünes Glas aus Hushwood (Bogen):** Hushwood-Wölfe (15 %) und Moosgeister (20 %) tragen Green Glass Shards, Scherben wie die der kalten Laterne. Fen will davon hören (Gespräch) und hat einen Gefallen am Brett (zwei Scherben); Lampwrights schleifen ab Stufe 12 aus drei Scherben und Messing die Green Glass Lens (Flarecaster, Kraft 7, zwischen Messing und Glimsteel).
- Neue Gespräche und Rufe: Brindle zeigt nach der Quest ihr Wachbuch, Fen zum Ausguck und zu den Scherben, Ama zu den Wölfen, Wren zum grünen Glas, Hollis mit neuen Gerüchten, Tallow zu den Choir Wraiths, der Stranger zum fremden Gebet, Pip hat eine zweite Liedzeile, Brindle und Pell rufen Neues.

**Balance-Notizen:**
- Restless Wolf: 36 HP, 4–6 Schaden, line-Angriff mit 5 Takten Vorwarnung. Warden 7 mit Schrott braucht etwa 4 s pro Wolf und verliert dabei Leben.
- The Old Foreman: 900 HP, 16–19 Schaden, ring und bigplus mit 6 Takten. Gemessen (Glimsteel, Stufe 21, 12 Moss Salves, mit Ausweichen): Warden etwa 70 s und 1 bis 5 Tränke, Flarecaster etwa 42 s und 3 bis 4 Tränke, Drifter 110 bis 220 s mit Niederlagen (braucht Dusk Step und Fade oder einen Partner), Mender allein schafft ihn nicht (wie Mender allein überall). Stufe 14 ohne Rüstung scheitert. `boss-probe` (für Gruppen-Bosse gebaut): zwei Spieler auf 26 ohne Ausrüstung siegen nach 24 s, einer fällt; Gruppen ab 38 brauchen unter 25 s. Er ist ein Einzel-Boss, kein Gruppen-Boss.
- Quest-Erfahrung an `xpStep` angelehnt: Restless Pack 280 (Stufe 5–8, gut zwei Stufen), Eyes on the North 700 (Stufe 10–14, etwa drei Stufen), Last Shift 800 (Stufe 18–21, gut zwei Stufen), Lights That Eat Lights 900 und Oil Rush 1.100 (Stufe 23–27, je knapp zwei Stufen).
- Neue Fähigkeiten im Test gegen Hushwood-Wölfe: Flarecaster 16 und Drifter 16 gewinnen mit Glimsteel-Waffe allein; Night Edge macht nachts im Mittel mindestens 25 % mehr Schaden als bei Tag.

**Abstimmung neu:** Zettel 2 mit old-mill (dritte Nacht), fishing (dritte Nacht), beekeeper, snail-cup (neu, aus „Ideen für später“).

## Tag 3 (Nacht zum 2026-11-14): Teilhaber, ein Pokal und Lampen zwischen den Bäumen

**Inbox:** `v2/inbox/2026-11-13.json` (die erste Datei seit Tag 1). Vier Gebete (IDs 3 bis 6), Zettel 2: snail-cup 2 Stimmen (2 Wähler), sonst keine. 8 Charaktere, 4 aktiv in 24 Stunden. Leuchtfeuer: 362, 295, 350 (Ziel 300).
- Gebet 3 (größerer Beutel) und Gebet 4 (zweite Stadt mit Zufalls-Labyrinth) hat Chris am 2026-11-13 schon gebaut (Cinderford, Unending Maze, Beutel 48). Nicht noch einmal gebaut.

**Teil 1, Gebete: das Counting House und Abels Truhe.**
- Gebet 6 (ID 6): *Gewünscht:* Ein Bankier im Dorf, bei dem man Gold in Läden und künftige Dinge steckt; dazu eine größere Werkstatt, in der Old Rook drinnen lehrt und die Werkbank drinnen steht. *Geliefert:* Das Haus nördlich des Platzes ist jetzt **the Counting House** (blaues Dach, Schild mit Waage). Darin **Coyne**, die Geldverleiherin. Man kauft Anteile (je bis zu 3) an Marrows Stand (120 Gold, 4 pro Tag), der Taverne (150, 5), dem Nachtmarkt (200, 7) und Hesks Stand in Cinderford (180, 6). Einmal am Tag holt man die Ausschüttung bei Coyne ab; Teilhaber sehen beim jeweiligen Händler zusätzliche Ware (Marrow: Moss Salve, Glow Draught; Hollis: Lily Oil, Moon Candle; Mothwick: Wisp Core, Dusk Draught; Hesk: Turn Chalk, Lily Oil). Quest „A Stake in Kindle“ (ersten Anteil kaufen, Marrow erzählen). Marrow, Hollis, Mothwick und Hesk reden mit Teilhabern. Die Werkstatt ist doppelt so groß, mit der guten Werkbank drinnen und **Tansy**, Rooks Lehrling, die Salvage und Tinkering lehrt. *Fehlt noch:* Rook selbst steht weiter draußen (die Kern-Tests erwarten ihn und die Werkbank in Kindle, also bleiben beide; Rook drinnen mit Meisterrezepten steht jetzt auf dem Stimmzettel). Gemeinsame Investitionen, bei denen alle zusammen einem Laden etwas Neues kaufen, bräuchten einen dauerhaften Weltzähler (Datenbank, nur mit Chris).
- Gebet 5 (ID 5): *Gewünscht:* Häuser mit Zweck und Quests mit Rätseln, bei denen man nachdenken muss. *Geliefert:* Ein Haus wurde zum Counting House, und die Rätsel-Quest **„The Old Strongbox“**: Abel, Coynes Vorgänger, hat eine Truhe mit drei Symbolrädern hinterlassen. Seinen Zettel findet man unter einer losen Diele in seinem alten Haus am Lagerfeuer; drei Rätsel, deren Antworten aus der Welt kommen (was ein Warden außer dem Schild trägt, womit der ertrunkene Chor jede Hymne beendete, wonach die Händlerin des Nachtmarkts heißt). Falsch gestellte Räder lassen die Truhe zu, ohne zu verraten, welches falsch war. Ama, Tallow und Mothwick geben Hinweise. Lohn: 160 EP, 45 Gold, zwei Glow Draughts und Abels Anteil an Marrows Stand. *Fehlt noch:* Die anderen Häuser haben noch keinen Zweck; mehr Rätsel in späteren Quests.

**Teil 2, Abstimmung: der Snail Cup.** Zettel 2: snail-cup 2, old-mill 0, fishing 0, beekeeper 0.
- *Gewünscht:* Ein richtiger Pokal mit zwei neuen Schnecken.
- *Geliefert:* Zwei neue Schnecken auf eigenen Bahnen: **Duchess** (aus Cinderford, in einer Hutschachtel, Quote 6) und **Thistle** (winzig, hält sich für ein Pferd, Quote 8). Die Quoten aller fünf sind neu abgestimmt (Bramble 3, Pebble 4, Old Tom 5). **Cup Day** an Samstagen und Sonntagen: Mabb nimmt dann auch 50 Gold. Quest **„The Snail Cup“** (nach „Off to the Races“): drei gewonnene Wetten, Lohn der Kindle Snail Cup, ein Pokal, den man als Hut trägt (Abwehr 1, Licht +0,5). Pell und Mabb rufen es aus.
- *Fehlt noch:* Eine Rangliste der Cup-Sieger.

**Teil 3, Nightwright: „Carriers in the Dark“ (Bogen, Akt 1).** Brindle sieht nachts kleine Lampen in einer Reihe am Nordrand entlangziehen. Quest ab Stufe 16 (nach „Eyes on the North“): ein zerbrochenes Tragegestell am Bach westlich der kalten Laterne mit einem Kerbholz, vier **Grey Gnawer** (neu, Stufe 17, vier am Nordrand) vertreiben, zwei Peat-Smoked Rations retten, Wren liest das Kerbholz (vierzig pro Reihe, zuletzt acht), der Stranger isst das Brot und sagt, sie gingen „den alten Weg nach Süden“. Lohn: 650 EP, 40 Gold, Carrier's Wraps (Füße, Abwehr 3, Licht +0,5), zwei Moss Salves. Der Schein im Norden ist größer, und vom Ausguck sieht man nachts die Lampen der Träger. Gefallen „thin_gnawers“ (Brindle) und „bread_for_stranger“.

**Klassen (Dauerauftrag): Warden** Stufe 28: **Lantern Hook** (4 Öl): Fernschlag bis 5 Felder, zieht das Ziel neben den Warden und bindet es an ihn (neue Wirkung `pull`; Bosse bleiben stehen, werden aber gebunden).

**Nachschlag:**
- **Mender Stufe 28: Ember Mend** (6 Öl, 4,2 s): heilt 30 (plus Stabheilung) für alle im Umkreis 1,5, die schnelle Heilung für den Tank.
- **Flarecaster Stufe 28: Noonbrand** (10 Öl): 12–16 plus Waffenkraft auf 6 Felder, blendet 1,2 s und brennt nach.
- **Drifter Stufe 28: Lampblack Cut**: 10–13 plus Waffenkraft, blendet 1,8 s, im Dunkeln 50 % mehr. Damit haben alle vier Klassen Fähigkeiten bis Stufe 28.
- **Rooks Werkstatt doppelt so groß**, mit der guten Werkbank und Tansy (aus Gebet 6, siehe oben).
- **„Abel's Three Caches“** (Coyne, ab Stufe 12, nach der Truhe, aus Gebet 5): ein zweiter Zettel mit drei Rätseln zu drei Verstecken (beim Holzfällerfeuer in Hushwood, am Ende des alten Wegs nach Westen, oberhalb des Minenfeuers in Copperdeep). Man muss den Ort aus dem Rätsel erraten; die Verstecke geben nur in der richtigen Reihenfolge etwas her. Lohn: 380 EP, 90 Gold, Glow Draughts, Lampenöl.
- **Mender Stufe 32: Sanctuary** (14 Öl, 22,5 s): heilt 16 (plus Stabheilung) und halbiert 3,6 s lang den Schaden für alle im Umkreis 4. 
- **Flarecaster Stufe 32: Corona** (16 Öl, 15 s): Lichtkranz im Umkreis 3, 10–13 plus Waffenkraft, blendet 1,5 s und brennt nach.
- **Warden Stufe 32: Shield Wall** (10 Öl, 24 s): heilt 12 und halbiert 4,8 s lang den Schaden für alle im Umkreis 3. **Drifter Stufe 32: Vanishing Cut**: 18–23 plus Waffenkraft, im Dunkeln 60 % mehr. Damit haben alle vier Klassen Fähigkeiten bis Stufe 32.
- **Tinkering 18: Carrier's Wraps** nachbauen (2 Wolfsfelle, 2 Messing, 1 Grey Wisp), damit die Wickel auch handelbar sind. Ama und Fen reagieren auf die Träger.
- **Hesks Stand als viertes Geschäft** im Counting House (Anteile kauft man bei Coyne in Kindle).
- **Zwei neue Gefallen** am Nordrand und neue Gespräche/Rufe: Pell, Hollis (drittes Gerücht), Brindle, Mabb, Coyne, Tansy.

**Balance-Notizen:**
- Grey Gnawer: Rolle normal, Stufe 17, 66 HP, 7–9 Schaden, plus-Angriff mit 5 Takten Vorwarnung, 52 EP (zwischen Moosgeist 14 und Steinkäfer 18). Warden 18 mit Glimsteel verliert pro Gnawer einige bis 25 Leben; Flarecaster und Drifter 28 gewinnen allein.
- Schneckenquoten per Monte-Carlo (40.000 Rennen): Erwartung je Schnecke 0,91 bis 0,96, Mabb bleibt knapp vorn.
- Anteile: Ausschüttung etwa 3 % pro Tag, ein Anteil zahlt sich nach rund 30 Tagen aus. Höchstens 12 Anteile (alle vier Geschäfte voll) bringen 66 Gold am Tag; das ist so viel wie ein paar Gefallen.
- Quest-Erfahrung: Carriers 650 (Stufe 16–20, etwa zwei Stufen), Strongbox 160 und Stake 70 (für alle Stufen, kleine Belohnung, weil es ums Nachdenken bzw. Gold geht).

**Abstimmung neu:** Zettel 3 mit beekeeper (dritte Nacht), cooking, north-road-fires, rook-masterwork (alle neu). old-mill und fishing sind nach drei Nächten ohne Stimmen heraus und stehen wieder unter „Ideen für später“.
