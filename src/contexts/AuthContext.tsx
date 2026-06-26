import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, AuthState, UserData } from '@/types';
import { api } from '@/lib/api';

const AUTH_STATE_KEY = 'pymaster_current_user';
const USERS_KEY = 'pymaster_users';

interface AuthContextType {
  authState: AuthState;
  login: (studentId: string, password: string) => Promise<User>;
  register: (studentId: string, name: string, password: string) => Promise<User>;
  logout: () => void;
  isAdmin: () => boolean;
  getCurrentUser: () => User | null;
  getAllUsers: () => User[];
  getUserData: (userId: string) => UserData;
  saveUserData: (userId: string, data: UserData) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STATE_KEY);
    if (raw) return { user: JSON.parse(raw) as User, isLoggedIn: true };
  } catch { /* ignore */ }
  return { user: null, isLoggedIn: false };
}

const defaultUserData = (userId: string): UserData => ({
  userId,
  wrongAnswers: [],
  studyStats: {
    totalAnswered: 0,
    totalCorrect: 0,
    correctRate: 0,
    streakDays: 0,
    lastStudyDate: '',
    byType: [
      { type: 'single', answered: 0, correct: 0 },
      { type: 'fill', answered: 0, correct: 0 },
      { type: 'codeFill', answered: 0, correct: 0 },
      { type: 'codeFix', answered: 0, correct: 0 },
      { type: 'ai', answered: 0, correct: 0 },
    ],
    byCategory: [],
    dailyActivity: [],
    weakAreas: [],
  },
  memoryStatus: {},
  examHistory: [],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(getAuthState);

  useEffect(() => {
    if (!authState.isLoggedIn || !authState.user?.id) return;
    const currentUser = authState.user;
    let cancelled = false;

    api.getUsers()
      .then((result) => {
        if (cancelled) return;
        const fresh = ((result as { users?: Partial<User>[] }).users || []).find(
          (user) => user.id === currentUser.id
        );
        if (!fresh) return;

        const updatedUser: User = {
          ...currentUser,
          studentId: fresh.studentId || currentUser.studentId,
          name: fresh.name || currentUser.name,
          role: fresh.role || currentUser.role,
          remarkName: fresh.remarkName || '',
          practice2Enabled: fresh.role === 'admin' || Boolean(fresh.practice2Enabled),
          createdAt: fresh.createdAt || currentUser.createdAt,
          lastLoginAt: fresh.lastLoginAt || currentUser.lastLoginAt,
          lastSeenAt: fresh.lastSeenAt || currentUser.lastSeenAt,
          loginCount: Number(fresh.loginCount) || Number(currentUser.loginCount) || 0,
          lastIp: fresh.lastIp || currentUser.lastIp,
          lastUserAgent: fresh.lastUserAgent || currentUser.lastUserAgent,
          lastPath: fresh.lastPath || currentUser.lastPath,
        };

        const changed =
          updatedUser.name !== currentUser.name ||
          updatedUser.remarkName !== currentUser.remarkName ||
          updatedUser.practice2Enabled !== currentUser.practice2Enabled ||
          updatedUser.lastSeenAt !== currentUser.lastSeenAt ||
          updatedUser.lastLoginAt !== currentUser.lastLoginAt;

        if (!changed) return;
        const users = getUsers().filter((item) => item.id !== updatedUser.id);
        saveUsers([...users, updatedUser]);
        setAuthState({ user: updatedUser, isLoggedIn: true });
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(updatedUser));
      })
      .catch(() => {
        // Keep the cached login state if the server is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [authState.isLoggedIn, authState.user]);

  useEffect(() => {
    if (!authState.isLoggedIn || !authState.user?.id) return;

    let cancelled = false;
    const sendHeartbeat = () => {
      if (cancelled || !authState.user?.id) return;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      api.recordHeartbeat(authState.user.id, currentPath).catch(() => {
        // Online presence is observational; learning data should never depend on it.
      });
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, 60_000);
    const handleVisible = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', sendHeartbeat);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', sendHeartbeat);
    };
  }, [authState.isLoggedIn, authState.user?.id]);

  const login = useCallback(async (studentId: string, password: string): Promise<User> => {
    const response = await api.login(studentId, password) as { user: Omit<User, 'password'> };
    const user: User = { ...response.user, password };
    const users = getUsers().filter((item) => item.id !== user.id);
    saveUsers([...users, user]);
    setAuthState({ user, isLoggedIn: true });
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(user));
    return user;
  }, []);

  const register = useCallback(async (studentId: string, name: string, password: string): Promise<User> => {
    if (studentId.length < 3) throw new Error('学号至少需要3位字符');
    if (password.length < 6) throw new Error('密码至少需要6位字符');

    const response = await api.register(studentId, name, password) as {
      user: Omit<User, 'password' | 'createdAt'> & { createdAt?: string };
    };
    const newUser: User = {
      ...response.user,
      password,
      createdAt: response.user.createdAt || new Date().toISOString(),
    };
    const users = getUsers().filter((item) => item.id !== newUser.id);
    saveUsers([...users, newUser]);
    localStorage.setItem(`pymaster_userdata_${newUser.id}`, JSON.stringify(defaultUserData(newUser.id)));
    setAuthState({ user: newUser, isLoggedIn: true });
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(newUser));
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, isLoggedIn: false });
    localStorage.removeItem(AUTH_STATE_KEY);
  }, []);

  const isAdmin = useCallback((): boolean => authState.user?.role === 'admin', [authState.user]);
  const getCurrentUser = useCallback((): User | null => authState.user, [authState.user]);
  const getAllUsers = useCallback((): User[] => getUsers().filter((u) => u.role === 'student'), []);

  const getUserData = useCallback((userId: string): UserData => {
    try {
      const raw = localStorage.getItem(`pymaster_userdata_${userId}`);
      if (raw) return JSON.parse(raw) as UserData;
    } catch { /* ignore */ }
    return defaultUserData(userId);
  }, []);

  const saveUserData = useCallback((userId: string, data: UserData) => {
    localStorage.setItem(`pymaster_userdata_${userId}`, JSON.stringify(data));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        isAdmin,
        getCurrentUser,
        getAllUsers,
        getUserData,
        saveUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
