// Der Ausguck „The North Watch“ am Nordrand von Hushwood (Tag 2). Objekt 'lookout' (Aktion use = hinaufklettern,
// shared/sim.js climbLookout). Nachts sieht man das Licht im Norden; einmal pro Nacht gibt das ein wenig Erfahrung.
// Der Nightwright passt die Texte an, wenn sich das Licht im Norden verändert.
export const LOOKOUT = {
  day: 'You climb up and look north. In daylight the Grey is just grey, a wall of nothing past the trees. Come back after dark.',
  night: 'You climb up and look north through Brindle\'s spyglass. Past the trees, past miles of Grey, a warm light sits low on the edge of the world, wider than two thumbs now. It gutters and catches, gutters and catches, like a hearth somebody is feeding with whatever is left. Along the edge of the trees, no tiny lights move tonight, south or north. Closer in, the stones that point stand clear in the dark, one, two, three, and then the Grey has them. Behind you, in Kindle, the Beacon is burning very bright.',
  first: 'You note it down, the way Brindle does. Somebody should.',
  xp: 30,
  xpPerLevel: 4,
};
