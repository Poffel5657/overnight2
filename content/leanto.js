// Der Unterstand am Rastplatz der Träger (Tag 9, Abstimmung „carriers-rest“): oben an der Steinstraße steht der
// verfallene Unterstand der Träger. Objekt 'leanto' (Aktion use = „Mend“). Man legt alles, was der Unterstand nimmt,
// auf einmal hinein (höchstens maxEach pro Sorte und Besuch); jeder Gegenstand zählt so viele Punkte (takes).
// Die Punkte zählen für alle im Gebiet, bis die Welt sich um Mitternacht erneuert (world.leanto, nur im Speicher).
// Ab goal Punkten steht der Unterstand für den Rest der Nacht:
//   - eine Lampe brennt darin (Objekt lit), alle im Gebiet lesen built,
//   - Wesen mit truce: true greifen niemanden mehr von selbst an (nur wer sie schlägt, wird bekämpft),
//   - am Herd der Träger (campfire mit hearth: true) ruht man ausgeruht: rested Siege mit Bonus wie im Gasthaus (einmal am Tag).
// Spielstand: mended (Punkte insgesamt, Bedingung mended: n). Quest-Aktionen 'mend', 'leanto' (wenn er gerade fertig
// wurde, für alle im Gebiet) und 'rest_road' (am Herd, während er steht).
export const LEANTO = {
  takes: { split_log: 1, peat_brick: 2, lamp_oil: 2 },
  maxEach: 6,
  goal: 12,
  rested: 20,
  xp: 30,
  xpPerLevel: 6,
  nothing: 'The carriers\' lean-to: poles, birch bark, half of it on the ground. It wants split logs for the poles, peat for the hearth bed, and a flask of oil for the lamp hook.',
  mended: (k, n, goal) => `You set ${k} into the lean-to. (${Math.min(n, goal)} of ${goal}: ${n >= goal ? 'it stands' : 'it needs more'})`,
  first: 'Somewhere below the clearing, somebody with a deep voice says "Hm." Nobody is there when you look.',
  built: 'The carriers\' lean-to stands again. A lamp hangs from the hook inside, and the Hollow Wardens lower their poles.',
  standing: 'The lean-to stands. It is dry inside, and the lamp is lit. Whoever comes up the road tonight can rest here.',
  restBuilt: 'You sit under the lean-to with your back to the north wind. The peat fire ticks. For a while nobody fights anybody.',
  restAgain: 'You warm your hands under the lean-to. You already slept here once today; your legs remember.',
};
