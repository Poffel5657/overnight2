# Design: Overnight 2

## Die Idee

Overnight 2 ist ein kleines Browser-MMO, das jede Nacht um 0 Uhr (Europe/Berlin) wächst. Anders als in V1 ist es schon an Tag 0 ein vollständiges Spiel: Skills, Quests, Ausrüstung, Gebiete, ein Boss. Die Nächte erweitern ein Gerüst, das schon trägt, statt es erst zu bauen.

Drei Gründe zum Wiederkommen, ohne dass jemand erinnern muss:
1. **Ich habe noch etwas vor:** tägliche Gefallen, Skills mit langer Kurve, Sammelbuch, Bestenlisten.
2. **Ich will wissen, was passiert ist:** Weltprobleme und Abstimmungen haben Folgen, die man am nächsten Morgen sieht.
3. **Mein Wunsch wurde erhört:** Wer in der Kapelle betet, sieht vielleicht morgen seine Idee in der Welt, mit Namen in der Chronik.

## Die Welt

Siehe `STORY.md`. Kurz: Ein Dorf auf einer Lichtung in einem endlosen Nebel. Jede Nacht drängt der Nightwright den Nebel ein Stück zurück. Die Bewohner beten zu ihm, ohne ihn je gesehen zu haben.

## Ton

- Trocken, freundlich, leicht verwundert. Kleine Witze, keine Zoten, keine Popkultur-Zitate.
- Kurze Sätze. Eine Meldung passt in eine Zeile.
- Spieltexte sind Englisch. Kinderfreundlich genug, dass jeder den Link teilen kann.
- Der Spielleiter heißt im Spiel immer **the Nightwright**, nie Claude. Öffentliche Texte nennen keine KI beim Namen.

## Look

- **Welt:** Gitter-Gelände in 3D mit Höhen und Vertex-Farben, flach schattiert. Objekte aus Grundformen (Kegel-Bäume, Kasten-Häuser). Figuren, Monster und Gegenstände sind **2D-Pixel-Sprites**, die zur Kamera zeigen. Drehbare Kamera, Zoom.
- **Keine Bilddateien:** Gelände, Objekte und Sprites sind Daten (Raster als Text mit Palette). So kann jede Nacht alles dazukommen und es sieht trotzdem aus wie aus einem Guss.
- **CRT:** Scanlines, Glühen, leichte Wölbung als Shader über dem Bild, mit `CRT: OFF` abschaltbar. Die Oberfläche besteht aus Terminal-Fenstern in VT323 und Bernstein (`[ INVENTORY ]`, `[ SKILLS ]`, `[ QUESTS ]`). Systemzeilen sind kurz, groß geschrieben und wundern sich nie.
- **Nebel:** Der Rand der Welt ist sichtbarer, wabernder Nebel und kein schwarzer Abgrund. Wo er zurückweicht, sieht man das Neue.

## Spielregeln, die bleiben

- **Tick-basiert:** Die Welt läuft in Takten von 600 ms. Man klickt, die Figur läuft und handelt im Takt. Das ist ruhig, gut auf dem Handy und leicht auf dem Server zu rechnen.
- **Klicken zum Handeln:** Linksklick führt die Standardaktion aus, Rechtsklick (am Handy langes Drücken) öffnet das Menü mit allen Aktionen.
- **Milde Niederlagen:** Man wacht am Lagerfeuer im Dorf auf und behält alles.
- **Der Server rechnet alles.** Der Browser zeigt nur an und schickt Absichten.
- Am PC mit Maus und Tastatur, am Handy mit Touch spielbar.

## Das Gerüst

Jede Neuerung dockt an ein vorhandenes Gerüst an (Tabelle der Andockpunkte im Plan, später in `ARCHITECTURE.md`). Reihenfolge der Prüfung für jeden Wunsch:
1. Passt er als **Daten** (Gebiet, Item, Monster, NPC, Quest, Rezept, Skill, Daily, Problem)? Dann ist es Inhalt.
2. Braucht er eine **neue Mechanik**? Dann ein Modul in `shared/mechanics/` über die Hooks.
3. Braucht er eine Änderung am **Kern**? Dann `big-change`-Vorschlag an Chris, nichts auf Verdacht bauen.

**Fertig heißt:** Ein Spieler kann es finden, verstehen und benutzen, und es lohnt sich. Der Content-Validator ist grün, und der Probespieler hat es gespielt.

## Die Kapelle

- **Pray** am Altar: Idee einreichen.
- **Donate** an den Opferstöcken: Gold für eine Option des Stimmzettels oder einer Story-Abstimmung spenden. Pro Tag gibt es eine Obergrenze.
- **Erhört:** Wer eine gebaute Idee eingereicht hat, bekommt beim nächsten Login eine Nachricht, einen Titel und einen Eintrag in der Chronik.

## Der lange Bogen

Neben dem täglichen Wachstum läuft jeweils ein Bogen von zwei bis vier Wochen auf ein Ereignis zu, das alle betrifft. Er zeigt sich in Andeutungen, dann in Weltproblemen, dann in Abstimmungen und schließlich im Ernstfall. Wie gut die Gemeinschaft vorbereitet ist, entscheidet den Ausgang. Auch ein schlechter Ausgang ist mild und erzählt weiter.
