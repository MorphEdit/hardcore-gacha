// เปลี่ยนจาก http://sea.main.rainbowcreation.net:8000 เป็น proxy
const API_BASE = '/api-proxy.php?path=';

function uuidv4() {
  const c = (typeof self !== 'undefined' && (self.crypto || self.msCrypto)) || 
            (typeof window !== 'undefined' && (window.crypto || window.msCrypto));
  
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  
  if (c && typeof c.getRandomValues === 'function') {
    const b = new Uint8Array(16);
    c.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const hex = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const api = {
  async req(path, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const tok = localStorage.getItem('token');
    if (tok) {
      headers['X-Auth'] = tok;
    }

    // สร้าง URL ผ่าน proxy
    const url = API_BASE + encodeURIComponent(path);
    
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      const text = await res.text();
      
      if (!res.ok) {
        throw new Error(text || res.statusText);
      }
      
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Authentication
  register: (u, p) => api.req('/v1/auth/register', 'POST', { username: u, password: p }),
  login: (u, p) => api.req('/v1/auth/login', 'POST', { username: u, password: p }),
  
  // Player & Roster
  player: () => api.req('/v1/player'),
  roster: () => api.req('/v1/roster'),
  
  // Gacha
  pull: (count) => api.req('/v1/gacha/pull', 'POST', { count }),
  
  // Tower
  resolve: (floorId, party) => api.req('/v1/tower/resolve', 'POST', { 
    floorId, 
    party, 
    idempotencyKey: uuidv4() 
  }),
  
  // Game
  restart: () => api.req('/v1/game/restart', 'POST', {}),
  rename: (cid, name) => api.req('/v1/roster/rename', 'POST', { cid, name }),
  
  // Health Check
  health: () => api.req('/v1/health'),
};