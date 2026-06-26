// Hybrid API client: uses backend API when available, falls back to localStorage
// 后端API地址：
// - 线上优先使用同源 /api，保证 IP 直连时也能登录和同步数据。
// - 本地 Vite 开发时仍访问线上 API，避免没有 dev proxy 时误判离线。
function getApiBase() {
  if (typeof window === 'undefined') return '';
  const { hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'https://api.seanyan.store';
  }
  return origin;
}

const API_BASE = getApiBase();

// Health-check cache. We re-check at most every HEALTH_TTL_MS, but in-flight
// checks are de-duplicated so a thundering herd of /api/users etc. does not
// hammer the server. Negative caches expire faster than positive ones so a
// transient outage does not lock the user out of server mode for long.
const HEALTH_TTL_OK_MS = 60_000;
const HEALTH_TTL_FAIL_MS = 15_000;
const HEALTH_TIMEOUT_MS = 3000;

interface HealthCache {
  available: boolean;
  expiresAt: number;
}
let healthCache: HealthCache | null = null;
let healthInflight: Promise<boolean> | null = null;

async function probeApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkApiHealth(): Promise<boolean> {
  const now = Date.now();
  if (healthCache && healthCache.expiresAt > now) return healthCache.available;
  if (healthInflight) return healthInflight;

  healthInflight = probeApi().then((ok) => {
    healthCache = { available: ok, expiresAt: Date.now() + (ok ? HEALTH_TTL_OK_MS : HEALTH_TTL_FAIL_MS) };
    healthInflight = null;
    return ok;
  }).catch(() => {
    healthCache = { available: false, expiresAt: Date.now() + HEALTH_TTL_FAIL_MS };
    healthInflight = null;
    return false;
  });

  return healthInflight;
}

async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function apiPatch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function apiUpload(path: string, formData: FormData) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '上传失败');
  return data;
}

// ===== Server API =====
const serverApi = {
  register: async (studentId: string, name: string, password: string) => {
    return apiPost('/api/register', { studentId, name, password });
  },
  login: async (studentId: string, password: string) => {
    return apiPost('/api/login', { studentId, password });
  },
  getUsers: async () => {
    return apiGet('/api/users') as Promise<{ users: unknown[] }>;
  },
  getUserData: async (userId: string) => {
    return apiGet(`/api/userdata/${userId}`) as Promise<Record<string, unknown>>;
  },
  saveUserData: async (userId: string, data: Record<string, unknown>) => {
    return apiPost(`/api/userdata/${userId}`, data);
  },
  updateUser: async (userId: string, data: Record<string, unknown>) => {
    return apiPatch(`/api/users/${userId}`, data);
  },
  deleteUser: async (userId: string) => {
    return apiDelete(`/api/users/${userId}`);
  },
  importQuestionWord: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload('/api/questions/import-word', formData);
  },
};

// ===== LocalStorage API (fallback) =====
const LS_USERS_KEY = 'seanyan_users';
const LS_USERDATA_KEY = 'seanyan_userdata';

interface LocalUser {
  id: string;
  studentId: string;
  name: string;
  password: string;
  role: 'student' | 'admin';
  remarkName?: string;
  practice2Enabled?: boolean;
  createdAt: string;
}

function getLocalUsers(): LocalUser[] {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || '[]'); } catch { return []; }
}
function setLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}
function getLocalUserData(): Record<string, Record<string, unknown>> {
  try { return JSON.parse(localStorage.getItem(LS_USERDATA_KEY) || '{}'); } catch { return {}; }
}
function setLocalUserData(data: Record<string, Record<string, unknown>>) {
  localStorage.setItem(LS_USERDATA_KEY, JSON.stringify(data));
}

const localApi = {
  register: async (studentId: string, name: string, password: string) => {
    const users = getLocalUsers();
    if (users.some((u) => u.studentId === studentId)) {
      throw new Error('该学号已被注册');
    }
    const newUser: LocalUser = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      studentId,
      name,
      password,
      role: studentId === 'admin' ? 'admin' : 'student',
      remarkName: '',
      practice2Enabled: studentId === 'admin',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setLocalUsers(users);
    // Also init user data
    const allData = getLocalUserData();
    allData[newUser.id] = {
      wrong_answers: '[]',
      study_stats: '{}',
      memory_status: '{}',
      exam_history: '[]',
    };
    setLocalUserData(allData);
    return {
      success: true,
      user: {
        id: newUser.id,
        studentId: newUser.studentId,
        name: newUser.name,
        role: newUser.role,
        remarkName: newUser.remarkName || '',
        practice2Enabled: newUser.role === 'admin' || Boolean(newUser.practice2Enabled),
      },
    };
  },
  login: async (studentId: string, password: string) => {
    // Ensure admin exists
    const users = getLocalUsers();
    if (!users.some((u) => u.studentId === 'admin')) {
      users.push({
        id: 'admin-default',
        studentId: 'admin',
        name: '管理员',
        password: 'admin123',
        role: 'admin',
        remarkName: '',
        practice2Enabled: true,
        createdAt: new Date().toISOString(),
      });
      setLocalUsers(users);
    }
    const user = users.find((u) => u.studentId === studentId && u.password === password);
    if (!user) throw new Error('学号或密码错误');
    return {
      success: true,
      user: {
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
        remarkName: user.remarkName || '',
        practice2Enabled: user.role === 'admin' || Boolean(user.practice2Enabled),
      },
    };
  },
  getUsers: async () => {
    const users = getLocalUsers()
      .filter((u) => u.role === 'student' || u.role === 'admin')
      .map((u) => ({
        id: u.id,
        studentId: u.studentId,
        name: u.name,
        role: u.role,
        remarkName: u.remarkName || '',
        practice2Enabled: u.role === 'admin' || Boolean(u.practice2Enabled),
        createdAt: u.createdAt,
      }));
    return { users };
  },
  getUserData: async (userId: string) => {
    const allData = getLocalUserData();
    return allData[userId] || {
      wrong_answers: '[]',
      study_stats: '{}',
      memory_status: '{}',
      exam_history: '[]',
    };
  },
  saveUserData: async (userId: string, data: Record<string, unknown>) => {
    const allData = getLocalUserData();
    const existing = allData[userId] || {};
    allData[userId] = { ...existing, ...data };
    setLocalUserData(allData);
    return { success: true };
  },
  updateUser: async (userId: string, data: Record<string, unknown>) => {
    const users = getLocalUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('用户不存在');
    users[index] = {
      ...users[index],
      name: typeof data.name === 'string' ? data.name : users[index].name,
      remarkName: typeof data.remarkName === 'string' ? data.remarkName : users[index].remarkName,
      practice2Enabled:
        typeof data.practice2Enabled === 'boolean' ? data.practice2Enabled : users[index].practice2Enabled,
    };
    if (users[index].role === 'admin') users[index].practice2Enabled = true;
    setLocalUsers(users);
    return { success: true };
  },
  deleteUser: async (userId: string) => {
    const users = getLocalUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('用户不存在');
    if (user.role === 'admin') throw new Error('不能删除管理员账号');
    setLocalUsers(users.filter((u) => u.id !== userId));
    const allData = getLocalUserData();
    delete allData[userId];
    setLocalUserData(allData);
    return { success: true };
  },
  importQuestionWord: async (): Promise<never> => {
    throw new Error('离线模式不支持题库导入');
  },
};

// ===== Hybrid API: auto-detects server availability =====
export const api = {
  register: async (studentId: string, name: string, password: string) => {
    const useServer = await checkApiHealth();
    return useServer ? serverApi.register(studentId, name, password) : localApi.register(studentId, name, password);
  },
  login: async (studentId: string, password: string) => {
    const useServer = await checkApiHealth();
    return useServer ? serverApi.login(studentId, password) : localApi.login(studentId, password);
  },
  getUsers: async () => {
    const useServer = await checkApiHealth();
    return useServer ? serverApi.getUsers() : localApi.getUsers();
  },
  getUserData: async (userId: string) => {
    const useServer = await checkApiHealth();
    return useServer ? serverApi.getUserData(userId) : localApi.getUserData(userId);
  },
  saveUserData: async (userId: string, data: Record<string, unknown>) => {
    const useServer = await checkApiHealth();
    return useServer ? serverApi.saveUserData(userId, data) : localApi.saveUserData(userId, data);
  },
  updateUser: async (userId: string, data: Record<string, unknown>) => {
    const useServer = await checkApiHealth();
    return useServer ? serverApi.updateUser(userId, data) : localApi.updateUser(userId, data);
  },
  deleteUser: async (userId: string) => {
    const useServer = await checkApiHealth();
    return useServer ? serverApi.deleteUser(userId) : localApi.deleteUser(userId);
  },
  importQuestionWord: async (file: File) => {
    const useServer = await checkApiHealth();
    if (!useServer) return localApi.importQuestionWord();
    return serverApi.importQuestionWord(file);
  },
  health: async () => {
    try {
      return await apiGet('/api/health');
    } catch {
      return { status: 'offline' };
    }
  },
};

export function isServerMode(): boolean {
  return healthCache?.available === true;
}

// LocalStorage helper
export const localStore = {
  get(key: string) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  },
  set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};
