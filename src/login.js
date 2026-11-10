// Anmeldefenster: Name und Passwort, neu anlegen oder anmelden, oder offline spielen.

import { account } from './net.js';

export function createLogin(server, { onToken, onOffline }) {
  const el = document.getElementById('login');
  const form = document.getElementById('login-form');
  const note = document.getElementById('login-note');
  const error = document.getElementById('login-error');
  const nameIn = document.getElementById('login-name');
  const passIn = document.getElementById('login-pass');
  let busy = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const mode = e.submitter?.value === 'register' ? 'register' : 'login';
    busy = true;
    error.textContent = mode === 'register' ? 'Writing your name in the ledger…' : 'Knocking…';
    try {
      const data = await account(server, mode, { name: nameIn.value.trim(), password: passIn.value });
      passIn.value = '';
      error.textContent = '';
      onToken(data.token);
    } catch (err) {
      error.textContent = err.message === 'Failed to fetch'
        ? 'The Beacon does not answer (server unreachable). You can play offline.'
        : err.message;
    } finally {
      busy = false;
    }
  });

  document.getElementById('login-offline').addEventListener('click', () => onOffline());

  return {
    show(message) {
      el.hidden = false;
      if (message) note.textContent = message;
      nameIn.focus({ preventScroll: true });
    },
    hide() { el.hidden = true; },
    async logout(token) {
      try { await account(server, 'logout', {}, token); } catch { /* egal */ }
    },
  };
}
