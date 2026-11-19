// Der Ausguck „The North Watch“ am Nordrand von Hushwood (Tag 2). Objekt 'lookout' (Aktion use = hinaufklettern,
// shared/sim.js climbLookout). Nachts sieht man das Licht im Norden; einmal pro Nacht gibt das ein wenig Erfahrung.
// Der Nightwright passt die Texte an, wenn sich das Licht im Norden verändert.
export const LOOKOUT = {
  day: 'You climb up and look north. In daylight the Grey is just grey, a wall of nothing past the trees. Come back after dark.',
  night: 'You climb up and look north through Brindle\'s spyglass. Past the trees, past miles of Grey, a warm light sits low on the edge of the world, wider than two thumbs. It gutters and catches, like a hearth somebody is feeding with whatever is left. Right below you, past the bread box, the old road climbs north from stone to stone, and every stone has a fire bowl on top. On a night when somebody has walked up with oil, they burn one above the other like a ladder into the fog. Near the top, something green moves between them, slowly, like somebody walking a round. And above the last fire, on the nights somebody has mended the lean-to, one small steady lamp that does not move at all, the way a lamp hangs in a window when somebody is expected.',
  first: 'You note it down, the way Brindle does. Somebody should.',
  xp: 30,
  xpPerLevel: 4,
};
