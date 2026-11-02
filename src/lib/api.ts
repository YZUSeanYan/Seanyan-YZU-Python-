// All account data requires a real server session. Never fall back to local admin auth.
const API_BASE = '';
let serverAvailable = false;

async function request(path: string, method = 'GET', body?: unknown) {
  const headers: Record<string, string> = { 'X-Requested-With': 'pymaster' };
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_BASE}${path}`, {
    method, credentials: 'same-origin', headers,
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  let data: Record<string, unknown>;
  try { data = await response.json(); } catch { throw new Error('服务器返回了无效响应'); }
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '请求失败');
  return data;
}

export const api = {
  register: (studentId: string, name: string, password: string) => request('/api/register', 'POST', { studentId, name, password }),
  login: (studentId: string, password: string) => request('/api/login', 'POST', { studentId, password }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', 'POST', {}),
  getUsers: () => request('/api/users'),
  getAdminActivity: () => request('/api/admin/activity?limit=300'),
  recordHeartbeat: (userId: string, path = window.location.pathname) => request('/api/activity/heartbeat', 'POST', { userId, path }),
  getUserData: (userId: string) => request(`/api/userdata/${encodeURIComponent(userId)}`),
  saveUserData: (userId: string, data: Record<string, unknown>) => request(`/api/userdata/${encodeURIComponent(userId)}`, 'POST', data),
  updateUser: (userId: string, data: Record<string, unknown>) => request(`/api/users/${encodeURIComponent(userId)}`, 'PATCH', data),
  deleteUser: (userId: string) => request(`/api/users/${encodeURIComponent(userId)}`, 'DELETE'),
  importQuestionWord: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request('/api/questions/import-word', 'POST', form);
  },
  health: async () => {
    try { const data = await request('/api/health'); serverAvailable = true; return data; }
    catch { serverAvailable = false; return { status: 'offline' }; }
  },
};
export function isServerMode() { return serverAvailable; }
export const localStore = {
  get(key: string) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } },
  set(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); },
};
