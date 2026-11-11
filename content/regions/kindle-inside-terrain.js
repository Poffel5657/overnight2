// Raster der Innenräume von Kindle (Legende in content/tiles.js). Jeder Raum ist von Wand umgeben,
// dazwischen liegt Nichts (' ', schwarz), damit man aus einem Raum die anderen nicht sieht.
// Kapelle links, Werkstatt in der Mitte, vier Häuser rechts.
export const TILES = [
  '#############     ###########    ########    ######## ',
  '#fffffffffff#     #ppppppppp#    #pppppp#    #pppppp# ',
  '#fffffffffff#     #ppppppppp#    #pppppp#    #pppppp# ',
  '#fffffffffff#     #ppppppppp#    #pppppp#    #pppppp# ',
  '#fffffffffff#     #ppppppppp#    #pppppp#    #pppppp# ',
  '#fffffffffff#     #ppppppppp#    #pppppp#    #pppppp# ',
  '#fffffffffff#     #ppppppppp#    ########    ######## ',
  '#fffffffffff#     #ppppppppp#                         ',
  '#fffffffffff#     ###########                         ',
  '#fffffffffff#                                         ',
  '#fffffffffff#                    ########    ######## ',
  '#fffffffffff#                    #pppppp#    #pppppp# ',
  '#fffffffffff#                    #pppppp#    #pppppp# ',
  '#fffffffffff#                    #pppppp#    #pppppp# ',
  '#fffffffffff#                    #pppppp#    #pppppp# ',
  '#fffffffffff#                    #pppppp#    #pppppp# ',
  '#fffffffffff#                    ########    ######## ',
  '#############                                         ',
];
export const HEIGHTS = TILES.map((r) => 'c'.repeat(r.length));
