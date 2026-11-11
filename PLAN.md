# Plan (Arbeitsdatei des Nachtlaufs)

Der Nightwright pflegt diese Datei jede Nacht (Regeln in `CLAUDE.md`).

## Inbox gelesen bis

`v2/inbox/2026-11-11.json` (Tag 1)

## Heute in Arbeit

Tag 1 (Nacht zum 2026-11-12). Gebaut und getestet, Stand für den PR:

**Teil 1, aus den Gebeten: Schneckenrennen (Gebet 1) und die Karte (Gebet 2)**
1. *Was der Spieler will:* Etwas im Dorf, das Spaß macht, ohne zu kämpfen, mit einem kleinen Nervenkitzel; und eine Übersicht, wo was ist, ohne sich durch die Welt zu tasten.
2. *Woran er es merkt:* Mabb ruft am Westweg „Bets on the snails!“, Pell erwähnt es; man spricht mit Mabb, nimmt die Quest „Off to the Races“, setzt 5 oder 20 Gold auf eine von drei Schnecken, sieht sie die Bahn entlangkriechen (Sprechblasen, Log), bekommt bei Sieg Einsatz mal Quote. Die Karte: Knopf „Map“ in der Leiste und Taste M; sie zeigt Gelände, Gebäude, Lichter, Ausgänge, Figuren mit `!`/`?`, sich selbst, und ein Tipp darauf läuft hin.
3. *Woran es anschließt:* Gold und Händler (Wetten sind eine Goldsenke mit leichtem Vorteil für Mabb), Quests (Aktionen `bet`/`race`), Gespräche (neue Bedingung `gold`, Wirkung `bet`), Quest-Laternen (Karte zeigt sie), Laufen (Tipp auf die Karte).
4. *Weg dorthin:* Jeder nach Kindling sieht Mabb auf dem Weg von der Brücke ins Dorf; die Karte hat jeder sofort.

**Teil 2, aus der Abstimmung: der Nachtmarkt (Zettel 0, 1 Stimme)**
1. *Was der Spieler will:* Einen Grund, nachts im Dorf etwas zu tun, und Dinge, die es nur dann gibt.
2. *Woran er es merkt:* Ein Stand mit lila Markise und eigenen Laternen am Rand des Lichtkreises; Mothwick ruft nachts; bei Tag verweist sie auf die Dunkelheit. Sie verkauft Moth Lantern (zwischen Messing- und Glimmlaterne), Moonwick, Night Bread und Öl; Quest „Wisps for the Wicks“ (drei Grey Wisps) bringt Moonwick; Lampwrights machen daraus Moon Candles (Stufe 11).
3. *Woran es anschließt:* Händler (neu: `night: true`), Tag und Nacht (Bedingungen `night`/`day`), Licht/Öl (Laterne, Kerze), Lampwright (Rezept), Greylinge (Wisps), der Bogen (Mothwick folgt dem Licht im Norden).
4. *Weg dorthin:* Pell ruft es aus, Mothwick ruft Vorbeigehende an; nachts sieht man ihre Lichter östlich vom Markt.

**Teil 3, vom Nightwright: „Not From Here“, das Licht im Norden (Bogen, Akt 1)**
1. *Was der Spieler will:* Merken, dass die Welt eine Geschichte hat, die weitergeht.
2. *Woran er es merkt:* Nachts glüht über dem Nordrand von Hushwood ein warmer Schein; Fen (ab Stufe 10) schickt einen zur kalten Laterne am Nordrand, Wren erkennt fremdes Glas, der Stranger spricht vom hungrigen Feuer; Haskel und Mothwick erzählen davon.
3. *Woran es anschließt:* Quests, Hushwood (Wölfe auf dem Weg), Figuren aus Tag 0 (Fen, Wren, Stranger, Haskel), Licht.
4. *Weg dorthin:* Fen hat ein `!`, sobald man Stufe 10 hat; vorher ein Hinweis.

**Dauerauftrag Klassen: Warden** bekommt Stand Fast (Stufe 12, heilt und stemmt sich) und Beacon Slam (Stufe 16, Stoß im Nahbereich, blendet und bindet alles Getroffene an den Warden; neue Wirkung `dazzle`/`hold` für `burst`).

## Ausbau läuft

- **Klassen bis 99 mit Spezialisierungen ab 50** (Dauerauftrag, siehe `CLAUDE.md`): jede Nacht mindestens eine Klasse ein Stück weiter, Reihenfolge Warden, Mender, Flarecaster, Drifter. Stand in `ROADMAP.md`. Nächste Nacht: Mender (ab Stufe 12).
- **Der Bogen „The Second Light“**, Akt 1 läuft (Licht im Norden gezeigt). Weitere Andeutungen in den nächsten Nächten.

## Nächste Nächte

- Mender ausbauen (Stufe 12 bis 16), dann Flarecaster, Drifter.
- Bogen: Hushwood-Wölfe kommen näher ans Dorf (Gefallen bei Haskel), Tallow findet ein fremdes Gebet im Altar.
- Erste Gefallen, die Gruppen belohnen.
- Wesen und Gebiete für 40+ (die Klassen wachsen schneller als der Inhalt).

## Ideen für später

- Eine alte Mühle im Grey, die sich von selbst dreht (steht auf dem Stimmzettel).
- Angeln im Bach (steht auf dem Stimmzettel).
- Ein Ausguck am Nordrand von Hushwood (steht auf dem Stimmzettel, passt zum Bogen).
- Ein Imker zieht nach Kindle (steht auf dem Stimmzettel).
- Aus Gebet 2: eine Truhe im Dorf zum Einlagern (braucht neue Absichten im Protokoll, siehe `Große Vorschläge`), ein kleiner Talentbaum mit leichten Boni (größerer Umbau, später als Vorschlag).
- Aus Gebet 1: ein Übungsring für freundliche Zweikämpfe (Kampf zwischen Spielern ändert die Kampfregeln, nur mit Chris).
- Mehr Schnecken, ein Schneckenpokal am Wochenende.

## Was ankommt

- Testrunde mit Freunden (2026-11-11): gewünscht wurden WASD-Laufen und besser lesbare Zahlen (beides gebaut), Sprechblasen statt Chatfenster, Gruppen und Handel.
- Erster Export (2026-11-11): 7 Charaktere, alle in 24 Stunden aktiv; Leuchtfeuer 29 von 300; 2 Gebete, 1 Stimme.

## Bekannte Probleme

- Es gibt noch keinen automatischen Probespieler für die Balance (siehe `CLAUDE.md`, „Balance“).
- Der Chat hat noch keine Moderation (verstecken, stummschalten). Das baut Chris vor dem öffentlichen Start.
- Der Schein im Norden wird über Bäume gezeichnet (ohne Tiefentest, damit der Grey ihn nicht verdeckt); aus manchen Winkeln färbt er die Baumspitzen orange. Gewollt als Glühen, beobachten.

## Große Vorschläge

- #1 Truhe zum Einlagern in Kindle (Gebet 2), offen seit Tag 1, Entwurf in `v2/proposals/stash.md` im Inbox-Repo.
