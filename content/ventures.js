// Das Counting House (Tag 3, aus einem Gebet): Bei Coyne kauft man Anteile an Geschäften in Kindle.
// Jeder Anteil bringt einmal am Tag (Berliner Datum) eine kleine Ausschüttung, abzuholen bei Coyne,
// und wer mindestens einen Anteil hat, bekommt beim Händler Ware „für Teilhaber“ (perks).
//   shop: Händler aus content/shops.js.  price: Gold pro Anteil.  dividend: Gold pro Anteil und Tag.
//   perks: zusätzliche Ware für Teilhaber (alles darin braucht noch einen anderen Fundort).
// Abgestimmt: Ein Anteil hat sich nach etwa 30 Tagen bezahlt gemacht; das Gold soll im Dorf arbeiten,
// nicht schnell reich machen. Neue Geschäfte (auch in Cinderford) kommen in späteren Nächten dazu.
export const SHARE_MAX = 3;

export const VENTURES = {
  marrow: {
    name: "Marrow's Stall", shop: 'marrow', price: 120, dividend: 4, perks: ['moss_salve', 'glow_draught'],
    text: 'Marrow wants a second cart and a roof that does not leak.',
  },
  hollis: {
    name: 'The Lantern & Lark', shop: 'hollis', price: 150, dividend: 5, perks: ['lily_oil', 'moon_candle'],
    text: 'Hollis wants to brew his own oil and buy candles in bulk.',
  },
  mothwick: {
    name: 'The Night Market', shop: 'mothwick', price: 200, dividend: 7, perks: ['wisp_core', 'dusk_draught'],
    text: 'Mothwick wants a proper roof over the stall. And more lanterns. Always more lanterns.',
  },
  // Hesk in Cinderford: Anteile kauft man trotzdem bei Coyne in Kindle (sie hat einen Vetter dort)
  hesk: {
    name: "Hesk's Stall", shop: 'hesk', price: 180, dividend: 6, perks: ['turn_chalk', 'lily_oil'],
    text: 'Hesk, down in Cinderford, wants a second rope and a cart that does not fall down the Maze stairs.',
  },
};

// Welches Geschäft gehört zu diesem Händler?
export function ventureOfShop(shopId) {
  return Object.keys(VENTURES).find((id) => VENTURES[id].shop === shopId) ?? null;
}
