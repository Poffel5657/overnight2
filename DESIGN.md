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

## Kern: Licht und Expeditionen

Overnight 2 ist kein Klon eines bestehenden MMOs. Der Kern kommt aus der Welt selbst:

- **Das Dorf ist sicher, der Grey nicht.** Kindle ist die Basis: Handwerk, Handel, Kapelle, Gemeinschaft. Draußen sieht man nur so weit, wie das eigene Licht reicht.
- **Licht ist die wichtigste Ressource.** Laterne und Brennstoff bestimmen Sichtweite und wie lange man draußen bleiben kann. Nebelwesen sind im Dunkeln stärker und weichen im Licht zurück. Geht das Licht aus, wird es gefährlich, aber nie grausam.
- **Expeditionen:** Hinter der festen Welt liegt ein Streifen Grey, den der Nightwright **jede Nacht neu würfelt**, mit Funden, Wracks, Fremden, Gefahren und manchmal einem Ort, der danach fest bleibt. Das ist ein täglicher Grund, reinzuschauen.
- **Funde bauen das Dorf aus.** Spenden von Funden und Rohstoffen schalten Gebäude und Ausbauten frei (Werkstatt, Wachturm, Gasthaus …), die allen neue Möglichkeiten geben.

## Klassen: dein Platz im Kampf

Jeder kann **jede Klasse** lernen und leveln, und man wechselt einfach zu der, auf die man gerade Lust hat. Am Anfang wählt man eine Klasse. **Ab Stufe 10** schaltet man die anderen über eine kurze Klassenquest beim jeweiligen Lehrer frei. Gewechselt wird **im Dorf** vor dem Aufbruch, indem man die Hauptwaffe tauscht. **Der Fortschritt bleibt immer erhalten.** Jede Klasse hat **eigene Stufe, eigene Fähigkeiten und eine eigene Belegung der Leiste 1–9**. Ausrüstung teilen sich die Klassen, soweit sie passt.

| Klasse | Rolle | Waffe | Kern |
|---|---|---|---|
| **Warden** | Tank | Schild + Laterne | steht vorne, bindet Gegner, hält das Licht für die Gruppe |
| **Mender** | Heiler | Stab mit Glut | heilt und schützt mit warmem Licht |
| **Flarecaster** | Fernkampf | Linse/Fokus | Licht als Waffe, blendet und verbrennt Nebelwesen aus der Distanz |
| **Drifter** | Nahkampf | zwei Klingen | schnell, im Dunkeln stark, Fallen und Ausweichen |

Neue Klassen dürfen sich Spieler wünschen. Sie docken an dasselbe Gerüst an (Waffe, Fähigkeiten, Stufen).

## Berufe: dein Platz im Dorf

Jeder lernt **2 Hauptberufe** aus etwa 6, mehr nicht. So ist jeder in etwas anderem gut und braucht die anderen. Wer wechseln will, **verlernt** einen Beruf beim Lehrer im Dorf, und **der Fortschritt darin ist weg**. Die Wahl soll etwas bedeuten. (Anders als bei Klassen, dort bleibt alles.)

| Sammeln | Herstellen |
|---|---|
| **Salvage:** Schrott, Messing, Glimmstein aus Wracks und Adern | **Tinkering:** Waffen, Rüstung, Vorrichtungen |
| **Foraging:** Kräuter, Pilze, Talg | **Alchemy:** Tränke, Öle, Brennstoff |
| **Cartography:** Karten zu tieferen und reicheren Stellen im Drift | **Lampwright:** Laternen, Linsen, Glut für Lichtklassen |

**Nebenfähigkeiten für alle:** Kindling (Laterne füllen, Feuer, Signalfeuer), Cooking (Essen heilt), Wayfinding (Wegmarken, Spuren, wie tief man in den Drift kommt).

**So hängen Klassen und Berufe zusammen:** ohne feste Kopplung, aber jede Klasse braucht Dinge aus fremden Berufen. Der Schild des Wardens kommt vom Tinkerer, die Heilöle des Menders vom Alchemisten, die Linse des Flarecasters vom Lampwright, die Fallen des Drifters vom Tinkerer und die Karten zu reichen Stellen vom Kartografen. Daraus entsteht Handel zwischen Spielern (Markt und Tausch). Jeder Beruf hat außerdem ein paar Rezepte für sich selbst.

## Kampf

Eine Mischung aus Klick-Bewegung und Tab-Target-MMO, **nicht** Kampf über das Inventar.

- **Bewegung mit der Maus** (Klick zum Laufen), am Handy per Tippen.
- **Ziel wählen:** Klick auf einen Gegner oder `Tab` wechselt zum nächsten Gegner. Das Ziel bekommt einen Rahmen und einen Lebensbalken.
- **Fähigkeitenleiste 1–9:** Angriffe, Techniken, Licht-Fähigkeiten, Essen, Tränke. Jede Taste ist frei belegbar, auch mit eigenen Tastenkürzeln. Am Handy gibt es eine Knopfleiste. Fähigkeiten haben Abklingzeiten, eine globale Abklingzeit hält das Tempo ruhig.
- **Der Server rechnet im Takt** (300–600 ms), damit alle Spieler dasselbe sehen und nicht geschummelt wird.
- **Gegner kündigen an:** Starke Angriffe markieren vorher den Boden, und man weicht aus. Licht schwächt Nebelwesen oder blendet sie, Dunkelheit stärkt sie.
- **Rollen über Klassen:** Tank, Heiler, Fern- und Nahkampf. Gruppeninhalte (Boss, tiefer Drift) sind für gemischte Gruppen gebaut, aber auch allein oder zu zweit schaffbar, nur langsamer.

## Spielregeln, die bleiben

- **Handeln mit der Maus:** Linksklick führt die Standardaktion aus, Rechtsklick (am Handy langes Drücken) öffnet ein Menü mit allen Aktionen.
- **Milde Niederlagen:** Man wacht am Lagerfeuer im Dorf auf. Auf einer Expedition verliert man höchstens einen Teil der ungesicherten Funde.
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
