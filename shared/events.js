// Ereignisse an Spieler. Mit `to` geht ein Ereignis nur an diesen Spieler, sonst an alle im Gebiet.
export function tell(world, to, text, cls = '') {
  world.events.push({ to, type: 'log', text, cls });
}

export function emit(world, event) {
  world.events.push(event);
}

// Zahl oder Text über einer Figur (Schaden, Heilung, Beute).
export function float(world, ent, text, cls = '', to = undefined) {
  world.events.push({ to, type: 'float', ent, text, cls });
}
