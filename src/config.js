// Feste Einstellungen. Der Spiel-Server ist ein Cloudflare Worker (worker/).
// Lokal (localhost) spricht das Spiel mit `wrangler dev` auf Port 8787.
// ?server=<url> setzt einen anderen Server, ?offline=1 spielt ohne Server (nichts wird gespeichert).
const params = new URLSearchParams(location.search);
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

export const SERVER = params.get('server')
  || (LOCAL ? `http://${location.hostname}:8787` : 'https://overnight2.overnight-rpg.workers.dev');
export const OFFLINE = params.has('offline');
