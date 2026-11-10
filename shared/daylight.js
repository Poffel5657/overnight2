// Tag und Nacht nach der echten Sonne über Kindle (wir tun so, als läge es bei Berlin).
// Alle Spieler sehen denselben Himmel. Um Mitternacht (Europe/Berlin) wächst die Welt.

const LAT = 52.5 * Math.PI / 180;
const LON = 13.4;

// Sonnenhöhe in Grad für einen Zeitpunkt (Näherung, reicht für Licht und Stimmung).
export function sunElevation(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const doy = (date.getTime() - start) / 86400000;
  const decl = -23.44 * Math.cos((2 * Math.PI / 365) * (doy + 10)) * Math.PI / 180;
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const hourAngle = ((utcHours + LON / 15 - 12) * 15) * Math.PI / 180;
  const s = Math.sin(LAT) * Math.sin(decl) + Math.cos(LAT) * Math.cos(decl) * Math.cos(hourAngle);
  return Math.asin(s) * 180 / Math.PI;
}

function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// day: 0 = tiefe Nacht, 1 = voller Tag. dusk: wie stark Abend- oder Morgenrot ist (0 bis 1).
export function skyState(date) {
  const elev = sunElevation(date);
  const day = smooth(-7, 8, elev);
  const dusk = Math.max(0, 1 - Math.abs(elev - 0.5) / 7.5);
  const rising = sunElevation(new Date(date.getTime() + 600000)) > elev;
  let phase = 'NIGHT';
  if (day > 0.85) phase = 'DAY';
  else if (day > 0.05) phase = rising ? 'DAWN' : 'DUSK';
  return { elev, day, dusk, phase, rising };
}

const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function berlinClock(date) {
  return clockFmt.format(date);
}

// Minuten bis Mitternacht in Berlin (dann kommt die neue Nacht des Nightwright).
export function minutesToMidnight(date) {
  const [h, m] = berlinClock(date).split(':').map(Number);
  return (24 * 60 - (h * 60 + m)) % (24 * 60);
}

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

// Tageslicht in einem Gebiet: unter der Erde nie, im Drift höchstens ein wenig.
export function regionDaylight(region, date) {
  if (region.indoor) return 0;
  const day = skyState(date).day;
  return region.murk !== undefined ? Math.min(day, region.murk) : day;
}

// Kalendertag in Berlin (JJJJ-MM-TT). Um Mitternacht beginnt ein neuer Tag: neue Gefallen, neue Nacht.
export function berlinDate(date) {
  return dateFmt.format(date);
}
