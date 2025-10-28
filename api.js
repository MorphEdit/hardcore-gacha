const API_BASE = 'http://sea.main.rainbowcreation.net:8000';

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
