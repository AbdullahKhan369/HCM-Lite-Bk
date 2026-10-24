const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const KEY = 'hcm_token';

export const tokenStore = {
  get() { try { return typeof window === 'undefined' ? null : window.localStorage.getItem(KEY); } catch (e) { return null; } },
  set(t) { try { window.localStorage.setItem(KEY, t); } catch (e) { /* ignore */ } },
  clear() { try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
};

function qs(params) {
  if (!params) return '';
  const p = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  const s = p.toString();
  return s ? '?' + s : '';
}

function makeError(res, json) {
  const err = json && json.error;
  const e = new Error((err && err.message) || 'Request failed (' + res.status + ')');
  e.status = res.status;
  e.code = (err && err.code) || 'ERROR';
  e.details = (err && err.details) || [];
  return e;
}

function handle401() {
  tokenStore.clear();
  if (typeof window !== 'undefined') {
    const p = window.location.pathname;
    if (!p.startsWith('/login') && !p.startsWith('/setup')) window.location.href = '/login';
  }
}

// CONTRACT: every route starts with /api. Part A passes paths without it, Part B with it; accept both.
function withApi(path) {
  return path.startsWith('/api/') || path === '/api' ? path : '/api' + (path.startsWith('/') ? '' : '/') + path;
}

async function send(method, path, params, body) {
  const headers = {};
  const t = tokenStore.get();
  if (t) headers.Authorization = 'Bearer ' + t;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  try {
    return await fetch(BASE + withApi(path) + qs(params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const e = new Error('Cannot reach the server. Check NEXT_PUBLIC_API_URL and that the backend is running.');
    e.status = 0; e.code = 'NETWORK_ERROR'; e.details = [];
    throw e;
  }
}

async function request(method, path, params, body) {
  const res = await send(method, path, params, body);
  let json = null;
  try { json = await res.json(); } catch (e) { json = null; }
  if (res.status === 401) handle401();
  if (!res.ok || !json || json.success === false) throw makeError(res, json);
  return json;
}

export const api = {
  async get(path, params) { return (await request('GET', path, params)).data; },
  async getPaged(path, params) {
    const j = await request('GET', path, params);
    return { data: j.data, meta: j.meta || { page: 1, limit: 20, total: Array.isArray(j.data) ? j.data.length : 0 } };
  },
  async post(path, body) { return (await request('POST', path, null, body === undefined ? {} : body)).data; },
  async put(path, body) { return (await request('PUT', path, null, body === undefined ? {} : body)).data; },
  async patch(path, body) { return (await request('PATCH', path, null, body === undefined ? {} : body)).data; },
  async del(path) { return (await request('DELETE', path)).data; },
  async download(path, filename) {
    const res = await send('GET', path);
    if (res.status === 401) handle401();
    if (!res.ok) {
      let json = null;
      try { json = await res.json(); } catch (e) { json = null; }
      throw makeError(res, json);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
