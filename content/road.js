// The Stone Road (Tag 8, Abstimmung „north-road-fires“): Feuer auf den Steinmännern der alten Nordstraße.
// Jede Feuerschale ist ein Signalfeuer mit stone: n (content/regions/stone-road.js). Wer eins anzündet (oder an einem
// brennenden steht und „Light“ wählt), meldet die Quest-Aktion stone_<n>. Das erste Anzünden pro Stein und Nacht gibt
// Erfahrung (oncePerDay, Schlüssel stone:<n>:<datum>). Brennen alle, hören es alle im Gebiet.
export const ROAD = {
  xp: 30,
  xpPerLevel: 4,
  lit: (name) => `The fire on ${name} catches and stands up straight. Somewhere down the road, the stone before it answers.`,
  allLit: 'Every stone on the road is burning. From the North Watch it must look like a line drawn north with a match.',
};
