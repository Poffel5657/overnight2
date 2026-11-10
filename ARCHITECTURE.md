# Architektur (Stand: Phase 2, Server und Konten)

Statische Seite ohne Build-Schritt. Three.js liegt als ES-Modul in `vendor/` (0.186.0, Lizenz daneben).

```
index.html, style.css     Seite und Terminal-Oberfläche (VT323, Bernstein)
content/                  Alles, was Inhalt ist, als Daten. Hier wächst das Spiel.
  tiles.js                Legende der Geländezeichen (Farbe, begehbar, Objekt)
  regions/kindle*.js      Gebiet: Gelände- und Höhenraster als Text, Objekte, Figuren, Wesen
  sprites.js              Pixel-Sprites als Text mit Palette ('!' = leuchtet im Dunkeln)
  mobs.js                 Wesen (Werte, angekündigte Angriffe)
  abilities.js            Fähigkeiten der Leiste 1-9
  npcs.js                 Gespräche und Beschreibungen
shared/                   Reine Spiellogik ohne DOM, läuft auf dem Server und offline im Browser
  sim.js                  Welt eines Gebiets im Takt (300 ms): Spieler, Laufen, Kampf, Licht/Öl, Wesen
  protocol.js             Nachrichten: Absichten prüfen (parseIntent), Takt pro Spieler (tickFor)
  path.js                 Wegfindung (A*, acht Richtungen)
  daylight.js             Tag und Nacht nach der echten Sonne über Berlin
src/                      Browser
  main.js                 Spiegelwelt aus den Server-Nachrichten, Darstellung, Eingabe
  net.js                  NetConnection (WebSocket) und LocalConnection (offline, gleiche Nachrichten)
  login.js, config.js     Anmelden, Server-Adresse (?server=, ?offline=1)
  ui.js                   Fenster, Leiste, Menü, Dialog, Zahlen
  render/view.js          Renderer, Kamera, CRT-Shader, Nebelwand
  render/light.js         Licht und Nebel als Shader-Zusatz für alle Materialien
  render/terrain.js       Gelände aus dem Raster (Vertex-Farben, flach schattiert)
  render/objects.js       Objekte aus Grundformen (BUILDERS), Bäume/Felsen als Instanzen
  render/sprites.js       Billboards aus den Pixel-Sprites
```

worker/                   Cloudflare Worker (wrangler.toml im Wurzelverzeichnis)
  index.js                Konten: /api/register, /api/login, /api/logout, /api/me; /api/play -> Gebiet
  auth.js                 PBKDF2-Passwörter, Tokens (nur Hash in D1), Sitzungen 30 Tage
  region.js               Durable Object RegionRoom: Welt im Speicher, Takt, WebSocket, Speichern in D1
migrations/               D1-Schema (accounts, sessions, characters)
tests/unit/               node --test: Spiellogik und Protokoll

## Ablauf

1. Browser meldet sich an (`/api/login`), bekommt ein Token (localStorage `overnight2.token`).
2. WebSocket `/api/play`, erste Nachricht `{t:'hello', token}`. Das Gebiet prüft das Token in D1,
   lädt den Charakter (`characters.data`, JSON aus `saveOf`) und schickt `welcome`.
3. Alle 300 ms: `step(world)`, dann pro Spieler `tickFor` (Positionen, HP, neue Figuren mit Metadaten,
   gegangene, Ereignisse für ihn, eigener Stand). Danach `drainEvents`.
4. Absichten vom Browser (`walk`, `act`, `ability`, `target`, `cycle`, `dialog`) prüft `parseIntent`.
   Pro Verbindung höchstens 15 Nachrichten pro Sekunde (Token-Bucket).
5. Gespeichert wird beim Gehen, alle 30 s und nach einer Niederlage. Die Welt selbst (Wesen,
   angezündete Signalfeuer) lebt nur im Speicher.

Schließcodes: 4001 Anmeldung ungültig, 4002 woanders angemeldet, 4003 zu viele Nachrichten, 4004 voll.

**Regel:** Der Browser rechnet nichts, was zählt. Er schickt Absichten und zeigt, was der Server sagt.
Neue Spielstand-Felder: in `saveOf` ergänzen und in `addPlayer` mit Standardwert prüfen (alte Stände
haben sie nicht).

## Prüfen

`node tools/check-world.mjs` prüft alle Gebiete: Rasterlängen, unbekannte Zeichen, Objekte im Wasser
oder übereinander, Figuren und Wesen auf nicht begehbaren Feldern oder direkt an Gebäuden,
fehlende Sprites, Gespräche und Palettenfarben. Muss vor jedem Commit grün sein.

Der Boden unter Objekten wird beim Rendern eingeebnet (`buildTerrain(region, objects)`),
Gebäude haben ein Fundament, Figuren stehen auf dem höchsten Punkt unter ihren Füßen.

## Lokal starten

```
npm install
npm run dev:db                      # lokale D1-Datenbank anlegen (einmal)
npm run dev:server                  # Spiel-Server auf :8787
python3 -m http.server 4180         # Seite
npm test                            # Unit-Tests
```
Dann http://localhost:4180 öffnen. Ohne Server: http://localhost:4180/?offline=1.
In der Konsole liegt `window.__overnight` mit Spiegelwelt und Verbindung.
Uhrzeit testen: `?hour=16.7` setzt die Berliner Uhrzeit, `?speed=600` lässt die Zeit schneller laufen.

## Look

PS1-Stil: Die Szene wird etwa 240 Pixel hoch gerendert, Eckpunkte springen auf dieses Raster
(`uSnap` in `render/light.js`, das typische Wackeln), Farben auf 5 Bit pro Kanal ohne Dithering
(`ps1()` im CRT-Shader). Tag und Nacht ändern Nebelfarbe, Sichtweite und Sonne (`setSky`).
