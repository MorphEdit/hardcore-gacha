const API_BASE = 'http://sea.main.rainbowcreation.net:8000';

function uuidv4() {
  const c = (typeof self !== 'undefined' && (self.crypto || self.msCrypto)) || (typeof window !== 'undefined' && (window.crypto || window.msCrypto));
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  if (c && typeof c.getRandomValues === 'function') {
    const b = new Uint8Array(16);
    c.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const hex = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16);
  });
}

const api = {
  async req(path, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const tok = localStorage.getItem('token');
    if (tok) headers['X-Auth'] = tok;

    const url = path.startsWith('http') ? path : API_BASE + path;
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || res.statusText);
    return text ? JSON.parse(text) : {};
  },

  register: (u, p) => api.req('/v1/auth/register', 'POST', { username: u, password: p }),
  login: (u, p) => api.req('/v1/auth/login', 'POST', { username: u, password: p }),
  player: () => api.req('/v1/player'),
  roster: () => api.req('/v1/roster'),
  pull: (count) => api.req('/v1/gacha/pull', 'POST', { count }),
  resolve: (floorId, party) => api.req('/v1/tower/resolve', 'POST', { floorId, party, idempotencyKey: uuidv4() }),
  restart: () => api.req('/v1/game/restart', 'POST', {}),
  rename: (cid, name) => api.req('/v1/roster/rename', 'POST', { cid, name }),
  health: () => api.req('/v1/health'),
};
