// Der Ausguck „The North Watch“ am Nordrand von Hushwood (Tag 2). Objekt 'lookout' (Aktion use = hinaufklettern,
// shared/sim.js climbLookout). Nachts sieht man das Licht im Norden; einmal pro Nacht gibt das ein wenig Erfahrung.
// Der Nightwright passt die Texte an, wenn sich das Licht im Norden verändert.
export const LOOKOUT = {
  day: 'You climb up and look north. In daylight the Grey is just grey, a wall of nothing past the trees. Come back after dark.',
  night: 'You climb up and look north through Brindle\'s spyglass. Past the trees, past miles of Grey, a warm light sits low on the edge of the world, bigger than last week. It flickers, like a hearth somebody is feeding by hand. Closer in, along the edge of the trees, a few tiny lights move in a line, then go out one by one.',
  first: 'You note it down, the way Brindle does. Somebody should.',
  xp: 30,
  xpPerLevel: 4,
};
