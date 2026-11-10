# Architektur (Stand: Prototyp Phase 1)

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
shared/                   Reine Spiellogik ohne DOM, läuft später auch auf dem Server
  sim.js                  Welt im Takt (300 ms): Laufen, Kampf, Licht/Öl, Wesen
  path.js                 Wegfindung (A*, acht Richtungen)
src/                      Browser
  main.js                 Verbindet Logik, Darstellung, Eingabe
  ui.js                   Fenster, Leiste, Menü, Dialog, Zahlen
  render/view.js          Renderer, Kamera, CRT-Shader, Nebelwand
  render/light.js         Licht und Nebel als Shader-Zusatz für alle Materialien
  render/terrain.js       Gelände aus dem Raster (Vertex-Farben, flach schattiert)
  render/objects.js       Objekte aus Grundformen (BUILDERS), Bäume/Felsen als Instanzen
  render/sprites.js       Billboards aus den Pixel-Sprites
```

**Regel:** Der Browser schickt nur Absichten an `shared/sim.js` (`walkTo`, `interact`, `useAbility`, …) und zeigt `world.events` an. So lässt sich die Simulation in Phase 2 auf den Server verschieben, ohne die Darstellung umzubauen.

## Lokal starten

```
python3 -m http.server 4180
```
Dann http://localhost:4180 öffnen. In der Konsole liegt `window.__overnight` mit der Welt.
