// Hybrid API client: uses backend API when available, falls back to localStorage
// 后端API地址（通过HTTPS域名访问）
const API_BASE = 'https://api.seanyan.store';

let apiAvailable: boolean | null = null;

async function checkApiHealth(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    apiAvailable = res.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
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
      user: { id: newUser.id, studentId: newUser.studentId, name: newUser.name, role: newUser.role },
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
        createdAt: new Date().toISOString(),
      });
      setLocalUsers(users);
    }
    const user = users.find((u) => u.studentId === studentId && u.password === password);
    if (!user) throw new Error('学号或密码错误');
    return {
      success: true,
      user: { id: user.id, studentId: user.studentId, name: user.name, role: user.role },
    };
  },
  getUsers: async () => {
    const users = getLocalUsers()
      .filter((u) => u.role === 'student' || u.role === 'admin')
      .map((u) => ({ id: u.id, studentId: u.studentId, name: u.name, role: u.role, createdAt: u.createdAt }));
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
  updateUser: async (_userId: string, _data: Record<string, unknown>) => {
    return { success: false };
  },
  deleteUser: async (_userId: string) => {
    return { success: false };
  },
  importQuestionWord: async (_file: File) => {
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
    return useServer ? serverApi.importQuestionWord(file) : localApi.importQuestionWord(file);
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
  return apiAvailable === true;
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
