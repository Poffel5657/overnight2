// Der Ausguck „The North Watch“ am Nordrand von Hushwood (Tag 2). Objekt 'lookout' (Aktion use = hinaufklettern,
// shared/sim.js climbLookout). Nachts sieht man das Licht im Norden; einmal pro Nacht gibt das ein wenig Erfahrung.
// Der Nightwright passt die Texte an, wenn sich das Licht im Norden verändert.
export const LOOKOUT = {
  day: 'You climb up and look north. In daylight the Grey is just grey, a wall of nothing past the trees. Come back after dark.',
  night: 'You climb up and look north through Brindle\'s spyglass. Past the trees, past miles of Grey, a warm light sits low on the edge of the world, wider than two thumbs. It gutters and catches, like a hearth somebody is feeding with whatever is left. No tiny lights move along the trees tonight. Right below you, at the foot of the first stone, the lid of the bread box has been moved, and put back very neatly.',
  first: 'You note it down, the way Brindle does. Somebody should.',
  xp: 30,
  xpPerLevel: 4,
};
