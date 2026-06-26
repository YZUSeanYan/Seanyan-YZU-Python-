import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  Trophy,
  Activity,
  ChevronRight,
  Search,
  BarChart3,
  UserCircle,
  ArrowLeft,
  Shield,
  Database,
  UploadCloud,
  RefreshCw,
  AlertTriangle,
  Clock,
  Wifi,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { User, UserData, ExamRecord, AdminActivityRecord, AdminActivityUser } from '@/types';
import { api } from '@/lib/api';

type AdminTab = 'overview' | 'users' | 'activity' | 'exams' | 'recovery' | 'questionBank';

type PracticeProgress = {
  currentIndex?: number;
  total?: number;
  answerStates?: string[];
  userAnswers?: Record<string, string | null> | (string | null)[];
  results?: Record<string, boolean | null> | (boolean | null)[];
  currentQuestionId?: number;
};

const typeLabels: Record<string, string> = {
  single: '单选题',
  fill: '填空题',
  codeFill: '程序填空',
  codeFix: '程序改错',
  ai: 'AI通识',
};

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function parsePracticeProgress(memoryStatus?: Record<number, string>): PracticeProgress | null {
  const raw = memoryStatus?.[-1] || (memoryStatus as Record<string, string> | undefined)?.['-1'];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PracticeProgress;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function countProgressValues(values: unknown, matcher: (value: unknown) => boolean): number {
  if (Array.isArray(values)) return values.filter(matcher).length;
  if (values && typeof values === 'object') return Object.values(values).filter(matcher).length;
  return 0;
}

function formatDate(value?: string): string {
  if (!value) return '暂无';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN');
}

function formatDateTime(value?: string): string {
  if (!value) return '暂无';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function timeAgo(value?: string): string {
  if (!value) return '暂无记录';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  const diff = Date.now() - time;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  return `${Math.floor(diff / 86_400_000)}天前`;
}

function isToday(value?: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
}

function isOnline(value?: string): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && Date.now() - time <= 5 * 60_000;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapServerUser(value: unknown): User | null {
  const item = value as Partial<User>;
  if (!item?.id || !item?.studentId || !item?.name) return null;
  return {
    id: item.id,
    studentId: item.studentId,
    name: item.name,
    password: item.password || '',
    role: item.role || 'student',
    remarkName: item.remarkName || '',
    practice2Enabled: item.role === 'admin' || Boolean(item.practice2Enabled),
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

function mapServerUserData(userId: string, raw: Record<string, unknown>): UserData {
  return {
    userId,
    wrongAnswers: parseJsonField(raw.wrong_answers, []),
    studyStats: parseJsonField(raw.study_stats, {
      totalAnswered: 0,
      totalCorrect: 0,
      correctRate: 0,
      streakDays: 0,
      lastStudyDate: '',
      byType: [],
      byCategory: [],
      dailyActivity: [],
      weakAreas: [],
    }),
    memoryStatus: parseJsonField(raw.memory_status, {}),
    examHistory: parseJsonField(raw.exam_history, []),
  };
}

function mapActivityUser(value: unknown): AdminActivityUser | null {
  const item = value as Partial<AdminActivityUser>;
  if (!item?.id || !item?.studentId || !item?.name) return null;
  return {
    id: item.id,
    studentId: item.studentId,
    name: item.name,
    role: item.role === 'admin' ? 'admin' : 'student',
    remarkName: item.remarkName || '',
    practice2Enabled: item.role === 'admin' || Boolean(item.practice2Enabled),
    createdAt: item.createdAt || new Date().toISOString(),
    lastLoginAt: item.lastLoginAt || '',
    lastSeenAt: item.lastSeenAt || '',
    loginCount: Number(item.loginCount) || 0,
    lastIp: item.lastIp || '',
    lastUserAgent: item.lastUserAgent || '',
    lastPath: item.lastPath || '',
    dataUpdatedAt: item.dataUpdatedAt || '',
    activeSource: item.activeSource || 'registration',
    totalAnswered: Number(item.totalAnswered) || 0,
    totalCorrect: Number(item.totalCorrect) || 0,
    correctRate: Number(item.correctRate) || 0,
    streakDays: Number(item.streakDays) || 0,
    lastStudyDate: item.lastStudyDate || '',
    wrongCount: Number(item.wrongCount) || 0,
    examCount: Number(item.examCount) || 0,
  };
}

function mapActivityRecord(value: unknown): AdminActivityRecord | null {
  const item = value as Partial<AdminActivityRecord>;
  if (!item?.id || !item?.userId || !item?.eventType || !item?.createdAt) return null;
  return {
    id: item.id,
    userId: item.userId,
    studentId: item.studentId || '',
    name: item.name || '',
    remarkName: item.remarkName || '',
    role: item.role === 'admin' ? 'admin' : 'student',
    eventType: item.eventType,
    path: item.path || '',
    detail: item.detail && typeof item.detail === 'object' ? item.detail : {},
    ip: item.ip || '',
    userAgent: item.userAgent || '',
    createdAt: item.createdAt,
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const { authState, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allUserData, setAllUserData] = useState<Record<string, UserData>>({});
  const [activityUsers, setActivityUsers] = useState<AdminActivityUser[]>([]);
  const [activityRecords, setActivityRecords] = useState<AdminActivityRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  // Redirect non-admin
  useEffect(() => {
    if (!authState.isLoggedIn || !isAdmin()) {
      navigate('/');
    }
  }, [authState.isLoggedIn, isAdmin, navigate]);

  const loadUsers = useCallback(async (cancelledRef?: { cancelled: boolean }) => {
    let cancelled = false;
    const isCancelled = () => cancelled || Boolean(cancelledRef?.cancelled);
    setIsLoadingUsers(true);
    try {
      const result = await api.getUsers();
      const users = ((result as { users?: unknown[] }).users || [])
        .map(mapServerUser)
        .filter((user): user is User => Boolean(user));
      const dataEntries = await Promise.all(
        users.map(async (user) => {
          try {
            const raw = await api.getUserData(user.id);
            return [user.id, mapServerUserData(user.id, raw)] as const;
          } catch {
            return [user.id, mapServerUserData(user.id, {})] as const;
          }
        })
      );

      if (!isCancelled()) {
        setAllUsers(users);
        setAllUserData(Object.fromEntries(dataEntries));
      }
    } finally {
      if (!isCancelled()) setIsLoadingUsers(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const loadActivity = useCallback(async (cancelledRef?: { cancelled: boolean }) => {
    const isCancelled = () => Boolean(cancelledRef?.cancelled);
    setIsLoadingActivity(true);
    try {
      const result = await api.getAdminActivity();
      const users = ((result as { users?: unknown[] }).users || [])
        .map(mapActivityUser)
        .filter((user): user is AdminActivityUser => Boolean(user));
      const records = ((result as { records?: unknown[] }).records || [])
        .map(mapActivityRecord)
        .filter((record): record is AdminActivityRecord => Boolean(record));

      if (!isCancelled()) {
        setActivityUsers(users);
        setActivityRecords(records);
      }
    } catch (err) {
      if (!isCancelled()) {
        setAdminMessage(err instanceof Error ? err.message : '活跃数据加载失败');
      }
    } finally {
      if (!isCancelled()) setIsLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    if (!authState.isLoggedIn || !isAdmin()) return;
    const state = { cancelled: false };
    loadUsers(state);
    loadActivity(state);
    return () => {
      state.cancelled = true;
    };
  }, [authState.isLoggedIn, isAdmin, loadUsers, loadActivity]);

  const handleUpdateUser = useCallback(async (user: User) => {
    const name = window.prompt('修改姓名', user.name);
    if (name === null) return;
    const remarkName = window.prompt('备注姓名/昵称', user.remarkName || '');
    if (remarkName === null) return;
    try {
      await api.updateUser(user.id, { name, remarkName, practice2Enabled: Boolean(user.practice2Enabled) });
      setAdminMessage('用户信息已更新');
      await loadUsers();
      await loadActivity();
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : '更新失败');
    }
  }, [loadUsers, loadActivity]);

  const handleTogglePractice2 = useCallback(async (user: User) => {
    if (user.role === 'admin') {
      setAdminMessage('管理员默认拥有练习模式2权限');
      return;
    }
    try {
      await api.updateUser(user.id, {
        name: user.name,
        remarkName: user.remarkName || '',
        practice2Enabled: !user.practice2Enabled,
      });
      setAdminMessage(!user.practice2Enabled ? '已开启练习模式2权限' : '已关闭练习模式2权限');
      await loadUsers();
      await loadActivity();
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : '权限更新失败');
    }
  }, [loadUsers, loadActivity]);

  const handleDeleteUser = useCallback(async (user: User) => {
    if (user.role === 'admin') {
      setAdminMessage('不能删除管理员账号');
      return;
    }
    if (!window.confirm(`确定删除账号 ${user.studentId} / ${user.name} 吗？该用户学习数据也会删除。`)) return;
    try {
      await api.deleteUser(user.id);
      setSelectedUser((current) => (current?.id === user.id ? null : current));
      setAdminMessage('账号已删除');
      await loadUsers();
      await loadActivity();
    } catch (err) {
      setAdminMessage(err instanceof Error ? err.message : '删除失败');
    }
  }, [loadUsers, loadActivity]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;
    const q = searchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.studentId.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.remarkName || '').toLowerCase().includes(q)
    );
  }, [allUsers, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalUsers = allUsers.length;
    const todayActive = activityUsers.length > 0
      ? activityUsers.filter((u) => isToday(u.lastSeenAt) || isToday(u.dataUpdatedAt) || isToday(u.lastStudyDate)).length
      : allUsers.filter((u) => {
          const ud = allUserData[u.id];
          return ud?.studyStats?.dailyActivity?.some((d) => isToday(d.date));
        }).length;
    const onlineNow = activityUsers.filter((u) => isOnline(u.lastSeenAt)).length;
    const totalAnswered = allUsers.reduce(
      (sum, u) => sum + (allUserData[u.id]?.studyStats?.totalAnswered || 0),
      0
    );
    const totalExams = allUsers.reduce(
      (sum, u) => sum + (allUserData[u.id]?.examHistory?.length || 0),
      0
    );
    return { totalUsers, todayActive, onlineNow, totalAnswered, totalExams };
  }, [allUsers, allUserData, activityUsers]);

  // All exam records
  const allExamRecords = useMemo(() => {
    const records: (ExamRecord & { studentName: string; studentId: string })[] = [];
    allUsers.forEach((u) => {
      const exams = allUserData[u.id]?.examHistory || [];
      exams.forEach((e) => {
        records.push({
          ...e,
          studentName: u.name,
          studentId: u.studentId,
        });
      });
    });
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allUsers, allUserData]);

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return allExamRecords;
    const q = searchQuery.toLowerCase();
    return allExamRecords.filter(
      (e) =>
        e.studentId.toLowerCase().includes(q) ||
        e.studentName.toLowerCase().includes(q) ||
        e.date.includes(q)
    );
  }, [allExamRecords, searchQuery]);

  const filteredActivityUsers = useMemo(() => {
    if (!searchQuery.trim()) return activityUsers;
    const q = searchQuery.toLowerCase();
    return activityUsers.filter(
      (u) =>
        u.studentId.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.remarkName || '').toLowerCase().includes(q) ||
        (u.lastPath || '').toLowerCase().includes(q)
    );
  }, [activityUsers, searchQuery]);

  const filteredActivityRecords = useMemo(() => {
    if (!searchQuery.trim()) return activityRecords;
    const q = searchQuery.toLowerCase();
    return activityRecords.filter(
      (record) =>
        record.studentId.toLowerCase().includes(q) ||
        record.name.toLowerCase().includes(q) ||
        record.eventType.toLowerCase().includes(q) ||
        record.path.toLowerCase().includes(q)
    );
  }, [activityRecords, searchQuery]);

  const recentActiveUsers = useMemo(
    () => activityUsers.slice(0, 10),
    [activityUsers]
  );

  const adminInsights = useMemo(() => {
    const dormantUsers = activityUsers.filter((u) => {
      const lastSeen = new Date(u.lastSeenAt || u.createdAt).getTime();
      return !Number.isNaN(lastSeen) && Date.now() - lastSeen > 7 * 24 * 60 * 60 * 1000;
    }).length;
    const strugglingUsers = activityUsers.filter((u) => u.totalAnswered >= 20 && u.correctRate < 60).length;
    const noPractice2Users = activityUsers.filter((u) => u.role !== 'admin' && !u.practice2Enabled).length;
    const highWrongUsers = activityUsers.filter((u) => u.wrongCount >= 10).length;

    return [
      { label: '7天未活跃', value: dormantUsers, hint: '适合课前提醒或单独关注' },
      { label: '正确率低于60%', value: strugglingUsers, hint: '建议查看薄弱知识点和错题本' },
      { label: '未开通专项练习2', value: noPractice2Users, hint: '可按需给重点复习同学开通' },
      { label: '错题较多', value: highWrongUsers, hint: '建议安排错题回炉复习' },
    ];
  }, [activityUsers]);

  const handleViewUserDetail = (user: User) => {
    setSelectedUser(user);
    setActiveTab('users');
  };

  const handleViewActivityUser = (activityUser: AdminActivityUser) => {
    const user = allUsers.find((item) => item.id === activityUser.id) || {
      ...activityUser,
      password: '',
    };
    setSelectedUser(user);
    setActiveTab('users');
  };

  if (!authState.isLoggedIn || !isAdmin()) {
    return null;
  }

  const navItems: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '概览', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'users', label: '用户管理', icon: <Users className="w-4 h-4" /> },
    { key: 'activity', label: '活跃成员', icon: <Activity className="w-4 h-4" /> },
    { key: 'exams', label: '考试记录', icon: <Trophy className="w-4 h-4" /> },
    { key: 'recovery', label: '数据恢复', icon: <Database className="w-4 h-4" /> },
    { key: 'questionBank', label: '题库管理', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[100dvh] bg-pm-bg-primary">
      {/* Top bar */}
      <div className="bg-white border-b border-pm-border">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-pm-text-secondary hover:text-pm-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-pm-primary" />
              <h1 className="font-heading font-semibold text-lg text-pm-text-primary">
                管理后台
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-pm-text-secondary">
            <UserCircle className="w-4 h-4" />
            <span>{authState.user?.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-56 shrink-0">
            <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
              <nav className="p-2 flex lg:block gap-1 overflow-x-auto scrollbar-hide lg:space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);
                      if (item.key !== 'users') setSelectedUser(null);
                    }}
                    className={`shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-pm-md text-sm font-medium transition-colors ${
                      activeTab === item.key
                        ? 'bg-pm-primary text-white'
                        : 'text-pm-text-secondary hover:bg-pm-bg-primary hover:text-pm-text-primary'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search bar */}
            <div className="mb-4">
              <div className="relative max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'users'
                      ? '搜索学号或姓名...'
                      : activeTab === 'activity'
                        ? '搜索学号、姓名、路径或记录...'
                        : '搜索学号、姓名或日期...'
                  }
                  className="w-full pl-9 pr-4 py-2 rounded-pm-lg border border-pm-border bg-white text-sm text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-primary/20 focus:border-pm-primary transition-all"
                />
              </div>
            </div>

            {isLoadingUsers && (
              <div className="mb-4 rounded-pm-lg border border-pm-border bg-white px-4 py-3 text-sm text-pm-text-secondary">
                正在从服务器加载用户数据...
              </div>
            )}

            {isLoadingActivity && activeTab === 'activity' && (
              <div className="mb-4 rounded-pm-lg border border-pm-border bg-white px-4 py-3 text-sm text-pm-text-secondary">
                正在加载上线时间与活跃记录...
              </div>
            )}

            {adminMessage && (
              <div className="mb-4 rounded-pm-lg border border-pm-border bg-white px-4 py-3 text-sm text-pm-text-secondary">
                {adminMessage}
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                      icon={<Users className="w-5 h-5" />}
                      label="总注册学生"
                      value={stats.totalUsers}
                      color="primary"
                    />
                    <StatCard
                      icon={<Activity className="w-5 h-5" />}
                      label="今日活跃"
                      value={stats.todayActive}
                      color="accent"
                    />
                    <StatCard
                      icon={<Wifi className="w-5 h-5" />}
                      label="当前在线"
                      value={stats.onlineNow}
                      color="accent"
                    />
                    <StatCard
                      icon={<BookOpen className="w-5 h-5" />}
                      label="总答题数"
                      value={stats.totalAnswered}
                      color="purple"
                    />
                    <StatCard
                      icon={<Trophy className="w-5 h-5" />}
                      label="总考试次数"
                      value={stats.totalExams}
                      color="orange"
                    />
                  </div>

                  <AdminInsightPanel insights={adminInsights} />

                  {/* Recent active users */}
                  <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-pm-border flex items-center justify-between">
                      <h2 className="font-semibold text-pm-text-primary">最近活跃成员</h2>
                      <button
                        onClick={() => setActiveTab('activity')}
                        className="text-xs text-pm-primary hover:underline flex items-center gap-0.5"
                      >
                        查看全部 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="divide-y divide-pm-border">
                      {recentActiveUsers.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-pm-text-muted">
                          暂无活跃记录
                        </div>
                      ) : (
                        recentActiveUsers.map((u) => {
                          return (
                            <div
                              key={u.id}
                              className="px-6 py-3 flex items-center justify-between hover:bg-pm-bg-primary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pm-primary-light flex items-center justify-center">
                                  <span className="text-xs font-semibold text-pm-primary">
                                    {u.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-pm-text-primary">
                                    {u.name}
                                  </p>
                                  <p className="text-xs text-pm-text-muted">
                                    {u.studentId} · {u.lastPath || '未记录页面'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-pm-text-secondary">
                                  {isOnline(u.lastSeenAt) ? '在线' : timeAgo(u.lastSeenAt)}
                                </p>
                                <p className="text-xs text-pm-text-muted">
                                  答题 {u.totalAnswered} · 正确率 {u.correctRate}%
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {selectedUser ? (
                    <UserDetailPanel
                      user={selectedUser}
                      userData={allUserData[selectedUser.id]}
                      onBack={() => setSelectedUser(null)}
                    />
                  ) : (
                    <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
                      <div className="px-6 py-4 border-b border-pm-border">
                        <h2 className="font-semibold text-pm-text-primary">
                          学生列表（{filteredUsers.length}人）
                        </h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-pm-border bg-pm-bg-primary/50">
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                学号
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                姓名
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                备注
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                注册时间
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                最后在线
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                答题数
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                正确率
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                练习2权限
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                                操作
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-pm-border">
                            {filteredUsers.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="px-4 py-8 text-center text-sm text-pm-text-muted"
                                >
                                  未找到匹配的学生
                                </td>
                              </tr>
                            ) : (
                              filteredUsers.map((u) => {
                                const ud = allUserData[u.id];
                                return (
                                  <tr
                                    key={u.id}
                                    className="hover:bg-pm-bg-primary/30 transition-colors"
                                  >
                                    <td className="px-4 py-3 text-sm text-pm-text-primary font-mono">
                                      {u.studentId}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-pm-text-primary font-medium">
                                      {u.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                                      {u.remarkName || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                                      {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                                      {timeAgo(activityUsers.find((item) => item.id === u.id)?.lastSeenAt || u.lastSeenAt)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                                      {ud?.studyStats?.totalAnswered || 0}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex px-2 py-0.5 rounded-pm-full text-xs font-medium ${
                                          (ud?.studyStats?.correctRate || 0) >= 60
                                            ? 'bg-pm-success-light text-pm-success'
                                            : 'bg-pm-error-light text-pm-error'
                                        }`}
                                      >
                                        {ud?.studyStats?.correctRate || 0}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        onClick={() => handleTogglePractice2(u)}
                                        disabled={u.role === 'admin'}
                                        className={`inline-flex min-w-[64px] justify-center rounded-pm-full px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                                          u.practice2Enabled
                                            ? 'bg-pm-success-light text-pm-success'
                                            : 'bg-pm-bg-primary text-pm-text-secondary hover:bg-pm-primary-light hover:text-pm-primary'
                                        }`}
                                      >
                                        {u.practice2Enabled ? '已开启' : '未开启'}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        onClick={() => handleViewUserDetail(u)}
                                        className="text-xs text-pm-primary hover:underline font-medium mr-3"
                                      >
                                        查看详情
                                      </button>
                                      <button
                                        onClick={() => handleUpdateUser(u)}
                                        className="text-xs text-pm-primary hover:underline font-medium mr-3"
                                      >
                                        编辑
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        className="text-xs text-pm-error hover:underline font-medium disabled:opacity-40"
                                        disabled={u.role === 'admin'}
                                      >
                                        删除
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActivityPanel
                    users={filteredActivityUsers}
                    records={filteredActivityRecords}
                    onViewUser={handleViewActivityUser}
                    onRefresh={() => loadActivity()}
                  />
                </motion.div>
              )}

              {activeTab === 'exams' && (
                <motion.div
                  key="exams"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-pm-border">
                      <h2 className="font-semibold text-pm-text-primary">
                        考试记录（{filteredExams.length}条）
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-pm-border bg-pm-bg-primary/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                              学号
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                              姓名
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                              日期
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                              得分
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                              正确/总数
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                              用时
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-pm-border">
                          {filteredExams.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-sm text-pm-text-muted"
                              >
                                暂无考试记录
                              </td>
                            </tr>
                          ) : (
                            filteredExams.map((e) => (
                              <tr
                                key={e.id}
                                className="hover:bg-pm-bg-primary/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-pm-text-primary font-mono">
                                  {e.studentId}
                                </td>
                                <td className="px-4 py-3 text-sm text-pm-text-primary font-medium">
                                  {e.studentName}
                                </td>
                                <td className="px-4 py-3 text-sm text-pm-text-secondary">
                                  {new Date(e.date).toLocaleString('zh-CN')}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-pm-full text-xs font-semibold ${
                                      e.score >= 60
                                        ? 'bg-pm-success-light text-pm-success'
                                        : 'bg-pm-error-light text-pm-error'
                                    }`}
                                  >
                                    {e.score}分
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-pm-text-secondary">
                                  {e.correctCount}/{e.totalQuestions}
                                </td>
                                <td className="px-4 py-3 text-sm text-pm-text-secondary">
                                  {Math.floor(e.timeSpent / 60)}分{e.timeSpent % 60}秒
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'recovery' && (
                <motion.div
                  key="recovery"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <DataRecoveryPanel currentUser={authState.user} />
                </motion.div>
              )}

              {activeTab === 'questionBank' && (
                <motion.div
                  key="questionBank"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuestionBankPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Sub Components ============

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'purple' | 'orange';
}) {
  const colorMap = {
    primary: {
      bg: 'bg-pm-primary-light',
      text: 'text-pm-primary',
    },
    accent: {
      bg: 'bg-pm-accent-light',
      text: 'text-pm-accent',
    },
    purple: {
      bg: 'bg-pm-purple-light',
      text: 'text-pm-purple',
    },
    orange: {
      bg: 'bg-pm-orange-light',
      text: 'text-pm-orange',
    },
  };

  const c = colorMap[color];

  return (
    <div className="bg-white rounded-pm-lg border border-pm-border p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-pm-md ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-pm-text-muted">{label}</p>
          <p className="text-xl font-bold text-pm-text-primary font-heading">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AdminInsightPanel({
  insights,
}: {
  insights: { label: string; value: number; hint: string }[];
}) {
  return (
    <div className="bg-white rounded-pm-lg border border-pm-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="w-4 h-4 text-pm-primary" />
        <h2 className="font-semibold text-pm-text-primary">管理建议</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {insights.map((item) => (
          <div key={item.label} className="rounded-pm-md border border-pm-border bg-pm-bg-primary/40 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-pm-text-primary">{item.label}</p>
              <p className="text-xl font-bold text-pm-primary font-heading">{item.value}</p>
            </div>
            <p className="text-xs text-pm-text-muted mt-2 leading-5">{item.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function activityLabel(type: string): string {
  const labels: Record<string, string> = {
    login: '登录',
    register: '注册并登录',
    heartbeat: '在线心跳',
  };
  return labels[type] || type;
}

function ActivityPanel({
  users,
  records,
  onViewUser,
  onRefresh,
}: {
  users: AdminActivityUser[];
  records: AdminActivityRecord[];
  onViewUser: (user: AdminActivityUser) => void;
  onRefresh: () => void;
}) {
  const onlineCount = users.filter((user) => isOnline(user.lastSeenAt)).length;
  const todayCount = users.filter((user) => isToday(user.lastSeenAt) || isToday(user.dataUpdatedAt)).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wifi className="w-5 h-5" />} label="当前在线" value={onlineCount} color="accent" />
        <StatCard icon={<Activity className="w-5 h-5" />} label="今日活跃" value={todayCount} color="primary" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="活跃记录" value={records.length} color="purple" />
        <StatCard icon={<Users className="w-5 h-5" />} label="成员总数" value={users.length} color="orange" />
      </div>

      <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
        <div className="px-6 py-4 border-b border-pm-border flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-pm-text-primary">最近活跃成员名单</h2>
            <p className="text-xs text-pm-text-muted mt-1">在线状态按最近5分钟心跳判断；旧数据会用最近同步时间兜底。</p>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pm-md border border-pm-border text-sm text-pm-text-secondary hover:bg-pm-bg-primary"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pm-border bg-pm-bg-primary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">成员</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">最后登录</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">最后在线</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">登录次数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">最近页面</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">学习概况</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pm-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-pm-text-muted">
                    暂无活跃成员记录
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-pm-bg-primary/30 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-pm-full text-xs font-medium ${
                          isOnline(user.lastSeenAt)
                            ? 'bg-pm-success-light text-pm-success'
                            : 'bg-pm-bg-primary text-pm-text-secondary'
                        }`}
                      >
                        {isOnline(user.lastSeenAt) ? '在线' : '离线'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-pm-text-primary">{user.name}</p>
                      <p className="text-xs text-pm-text-muted">
                        {user.studentId}{user.remarkName ? ` · ${user.remarkName}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary whitespace-nowrap">
                      {formatDateTime(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary whitespace-nowrap">
                      <span className="block">{timeAgo(user.lastSeenAt)}</span>
                      <span className="text-xs text-pm-text-muted">{formatDateTime(user.lastSeenAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                      {user.loginCount || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary max-w-[180px] truncate">
                      {user.lastPath || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary whitespace-nowrap">
                      答题 {user.totalAnswered} · 错题 {user.wrongCount} · 考试 {user.examCount}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewUser(user)}
                        className="text-xs text-pm-primary hover:underline font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
        <div className="px-6 py-4 border-b border-pm-border">
          <h2 className="font-semibold text-pm-text-primary">最近上线与访问记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pm-border bg-pm-bg-primary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">成员</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">记录</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">页面</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">设备</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pm-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-pm-text-muted">
                    暂无上线记录
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-pm-bg-primary/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-pm-text-secondary whitespace-nowrap">
                      {formatDateTime(record.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-pm-text-primary">{record.name || record.studentId || '未知用户'}</p>
                      <p className="text-xs text-pm-text-muted">{record.studentId || record.userId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                      {activityLabel(record.eventType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary max-w-[180px] truncate">
                      {record.path || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary whitespace-nowrap">
                      {record.ip || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary max-w-[260px] truncate">
                      {record.userAgent || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DataRecoveryPanel({ currentUser }: { currentUser: User | null }) {
  const [serverData, setServerData] = useState<Record<string, unknown> | null>(null);
  const [localRows, setLocalRows] = useState<{ key: string; size: number; hasData: boolean }[]>([]);
  const [status, setStatus] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const scanLocal = useCallback(() => {
    const rows: { key: string; size: number; hasData: boolean }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || (!key.includes('seanyan') && !key.includes('pymaster'))) continue;
      const value = localStorage.getItem(key) || '';
      rows.push({ key, size: value.length, hasData: value !== '' && value !== '{}' && value !== '[]' });
    }
    rows.sort((a, b) => b.size - a.size);
    setLocalRows(rows);
  }, []);

  const refreshServer = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const data = await api.getUserData(currentUser.id);
      setServerData(data);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '读取服务器数据失败');
    }
  }, [currentUser?.id]);

  useEffect(() => {
    scanLocal();
    refreshServer();
  }, [scanLocal, refreshServer]);

  const readJson = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const handlePushLocal = async () => {
    if (!currentUser?.id) {
      setStatus('请先登录管理员账号');
      return;
    }
    setIsWorking(true);
    setStatus('');
    try {
      const cache = readJson('seanyan_user_data_cache') || {};
      const legacyProgress = readJson('seanyan_practice_progress') || readJson('pymaster_practice_progress');
      const oldUserData = readJson(`pymaster_userdata_${currentUser.id}`) || {};
      const memoryStatus = {
        ...(oldUserData.memoryStatus || {}),
        ...(cache.memoryStatus || {}),
      };

      if (legacyProgress) {
        memoryStatus[-1] = JSON.stringify(legacyProgress);
      }

      const payload = {
        wrong_answers: cache.wrongAnswers || oldUserData.wrongAnswers || [],
        study_stats: cache.studyStats || oldUserData.studyStats || {},
        memory_status: memoryStatus,
        exam_history: cache.examHistory || oldUserData.examHistory || [],
      };

      await api.saveUserData(currentUser.id, payload);
      await refreshServer();
      scanLocal();
      setStatus('已推送本地数据到服务器');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '推送失败');
    } finally {
      setIsWorking(false);
    }
  };

  const serverRows = [
    { label: '错题本', value: serverData?.wrong_answers },
    { label: '学习统计', value: serverData?.study_stats },
    { label: '背题/练习进度', value: serverData?.memory_status },
    { label: '考试历史', value: serverData?.exam_history },
    { label: '练习进度字段', value: serverData?.practice_progress },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-pm-lg border border-pm-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-pm-text-primary flex items-center gap-2">
              <Database className="w-4 h-4" />
              数据恢复
            </h2>
            <p className="text-sm text-pm-text-secondary mt-1">
              扫描当前浏览器本地数据，并可把当前管理员账号的本地学习数据推送到服务器。
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                scanLocal();
                refreshServer();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pm-md border border-pm-border text-sm text-pm-text-secondary hover:bg-pm-bg-primary"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            <button
              onClick={handlePushLocal}
              disabled={isWorking}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pm-md bg-pm-primary text-white text-sm disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              强制推送本地数据到服务器
            </button>
          </div>
        </div>
        {status && (
          <div className="mt-4 flex items-center gap-2 text-sm text-pm-text-secondary bg-pm-bg-primary rounded-pm-md p-3">
            <AlertTriangle className="w-4 h-4 text-pm-orange" />
            {status}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
          <div className="px-5 py-4 border-b border-pm-border font-semibold text-pm-text-primary">服务器当前数据</div>
          <div className="divide-y divide-pm-border">
            {serverRows.map((row) => {
              const text = typeof row.value === 'string' ? row.value : JSON.stringify(row.value ?? '');
              const hasData = text !== '' && text !== '{}' && text !== '[]';
              return (
                <div key={row.label} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="text-pm-text-secondary">{row.label}</span>
                  <span className={hasData ? 'text-pm-success' : 'text-pm-text-muted'}>
                    {hasData ? `有数据 · ${text.length} 字符` : '无数据'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
          <div className="px-5 py-4 border-b border-pm-border font-semibold text-pm-text-primary">本地 localStorage 数据</div>
          {localRows.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-pm-text-muted">未发现 seanyan/pymaster 相关本地数据</div>
          ) : (
            <div className="divide-y divide-pm-border max-h-[360px] overflow-auto">
              {localRows.map((row) => (
                <div key={row.key} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
                  <span className="text-pm-text-secondary truncate">{row.key}</span>
                  <span className={row.hasData ? 'text-pm-success shrink-0' : 'text-pm-text-muted shrink-0'}>
                    {row.hasData ? `${row.size} 字符` : '空'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionBankPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setStatus('请先选择 .docx Word 文件');
      return;
    }
    setIsUploading(true);
    setStatus('');
    try {
      const result = await api.importQuestionWord(file) as {
        imported: number;
        duplicates: number;
        total: number;
        duplicateSamples?: string[];
      };
      setStatus(`导入完成：新增 ${result.imported} 题，跳过重复 ${result.duplicates} 题，当前题库共 ${result.total} 题。`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-pm-lg border border-pm-border p-5">
        <h2 className="font-semibold text-pm-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          题库管理
        </h2>
        <p className="text-sm text-pm-text-secondary mt-1">
          上传符合规范的 Word 题库文件，系统会解析题目并按题干去重后追加到线上题库。
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="file"
            accept=".docx"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-pm-md bg-pm-primary text-white text-sm disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {isUploading ? '正在解析导入...' : '上传并导入'}
          </button>
        </div>

        {status && (
          <div className="mt-4 rounded-pm-md bg-pm-bg-primary px-4 py-3 text-sm text-pm-text-secondary">
            {status}
          </div>
        )}
      </div>

      <div className="bg-white rounded-pm-lg border border-pm-border p-5">
        <h3 className="font-semibold text-pm-text-primary mb-3">Word 题库提交规范</h3>
        <div className="space-y-3 text-sm text-pm-text-secondary leading-7">
          <p>每道题建议使用以下字段，字段名后必须带冒号。题与题之间空一行或使用“###”分隔。</p>
          <pre className="bg-[#1E293B] text-[#E2E8F0] rounded-md p-4 overflow-x-auto text-xs leading-6">{`题型：单选题
分类：基础语法
难度：easy
题干：关于 Python 变量命名，以下说法正确的是______。
选项：
A. 变量名可以以数字开头
B. 变量名不能使用关键字
C. 变量名只能使用中文
D. 变量名必须包含下划线
答案：B
解析：Python 变量名不能与关键字重名，也不能以数字开头。
标签：变量 命名 基础语法

###

题型：填空题
分类：字符串
难度：medium
题干：Python 中获取字符串长度的内置函数是______。
答案：len
解析：len(obj) 可以返回字符串、列表等对象的长度。`}</pre>
          <p>支持题型：单选题、填空题、程序填空、程序改错。单选题请提供 A-D 四个选项；程序题可以增加“代码：”字段。</p>
          <p>去重规则：系统会去除题干里的空白后比较；题干完全相同的题目会被跳过。</p>
        </div>
      </div>
    </div>
  );
}

function UserDetailPanel({
  user,
  userData,
  onBack,
}: {
  user: User;
  userData?: UserData;
  onBack: () => void;
}) {
  const wrongAnswers = safeArray(userData?.wrongAnswers);
  const examHistory = safeArray(userData?.examHistory);
  const stats = userData?.studyStats;
  const byType = safeArray(stats?.byType);
  const weakAreas = safeArray(stats?.weakAreas);
  const dailyActivity = safeArray(stats?.dailyActivity);
  const memoryStatus = userData?.memoryStatus || {};
  const practiceProgress = parsePracticeProgress(memoryStatus);
  const memoryEntries = Object.entries(memoryStatus).filter(([key]) => key !== '-1');
  const masteredCount = memoryEntries.filter(([, value]) => value === 'mastered').length;
  const learningCount = memoryEntries.filter(([, value]) => value === 'learning').length;
  const notStartedCount = memoryEntries.filter(([, value]) => value === 'unseen' || value === 'not-started').length;
  const memoryTotal = memoryEntries.length;
  const practiceTotal = practiceProgress?.total || practiceProgress?.answerStates?.length || 0;
  const practiceCurrent = practiceTotal > 0 ? Math.min((practiceProgress?.currentIndex || 0) + 1, practiceTotal) : 0;
  const practiceCorrect = countProgressValues(practiceProgress?.answerStates, (value) => value === 'correct');
  const practiceWrong = countProgressValues(practiceProgress?.answerStates, (value) => value === 'wrong');
  const completedPractice = countProgressValues(practiceProgress?.answerStates, (value) => value !== 'unanswered');
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateStr = date.toISOString().split('T')[0];
    const found = dailyActivity.find((item) => item.date === dateStr);
    return { date: dateStr, answered: found?.answered || 0 };
  });
  const maxDaily = Math.max(1, ...recentDays.map((item) => item.answered));
  const detailCards = [
    { label: '总答题数', value: stats?.totalAnswered || 0 },
    { label: '正确率', value: `${stats?.correctRate || 0}%` },
    { label: '连续学习天数', value: `${stats?.streakDays || 0} 天` },
    { label: '考试次数', value: examHistory.length },
    { label: '错题数量', value: wrongAnswers.length },
    { label: '背题进度', value: `${masteredCount}/${memoryTotal}` },
    { label: '练习进度', value: practiceTotal > 0 ? `已完成 ${completedPractice}题` : '暂无' },
    { label: '最近学习日期', value: formatDate(stats?.lastStudyDate) },
  ];

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-pm-primary hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回列表
      </button>

      {/* User info card */}
      <div className="bg-white rounded-pm-lg border border-pm-border p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-pm-primary-light flex items-center justify-center">
            <span className="text-lg font-bold text-pm-primary">{user.name.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-pm-text-primary">{user.name}</h3>
            <p className="text-sm text-pm-text-secondary">
              学号: {user.studentId} | 注册: {new Date(user.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {detailCards.map((card) => (
          <div key={card.label} className="bg-white rounded-pm-lg border border-pm-border p-4">
            <p className="text-xs text-pm-text-muted">{card.label}</p>
            <p className="text-xl font-bold text-pm-text-primary font-heading">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-pm-lg border border-pm-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-pm-text-primary">练习进度</h3>
          <span className="text-xs text-pm-text-muted">
            {practiceTotal > 0 ? `${practiceCurrent} / ${practiceTotal}` : '暂无进度'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-pm-bg-primary overflow-hidden mb-3">
          <div
            className="h-full bg-pm-primary"
            style={{ width: practiceTotal > 0 ? `${Math.round((practiceCurrent / practiceTotal) * 100)}%` : '0%' }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <span className="text-pm-success">已答对 {practiceCorrect}</span>
          <span className="text-pm-error">已答错 {practiceWrong}</span>
          <span className="text-pm-text-secondary">当前题ID {practiceProgress?.currentQuestionId || '暂无'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: '已掌握', value: masteredCount, cls: 'text-pm-success bg-pm-success-light' },
          { label: '学习中', value: learningCount, cls: 'text-pm-orange bg-pm-orange-light' },
          { label: '未开始', value: notStartedCount, cls: 'text-pm-text-secondary bg-pm-bg-primary' },
        ].map((item) => (
          <div key={item.label} className={`rounded-pm-lg border border-pm-border p-4 ${item.cls}`}>
            <p className="text-xs opacity-80">{item.label}</p>
            <p className="text-2xl font-bold font-heading">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-pm-lg border border-pm-border p-5">
        <h3 className="font-semibold text-pm-text-primary mb-4">各题型掌握情况</h3>
        <div className="space-y-3">
          {['single', 'fill', 'codeFill', 'codeFix', 'ai'].map((type) => {
            const item = byType.find((entry) => entry.type === type);
            const answered = item?.answered || 0;
            const rate = answered > 0 ? Math.round(((item?.correct || 0) / answered) * 100) : 0;
            const color = rate >= 80 ? '#16A34A' : rate >= 60 ? '#E9A23B' : '#E74C3C';
            return (
              <div key={type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-pm-text-primary">{typeLabels[type]}</span>
                  <span className="text-pm-text-secondary">{answered}题 · {rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-pm-bg-primary overflow-hidden">
                  <div className="h-full" style={{ width: `${rate}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-pm-lg border border-pm-border p-5">
          <h3 className="font-semibold text-pm-text-primary mb-4">薄弱知识点</h3>
          {weakAreas.length === 0 ? (
            <p className="text-sm text-pm-text-muted">暂无薄弱知识点</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weakAreas.map((area) => (
                <span key={area} className="px-2.5 py-1 rounded-pm-full text-xs font-medium bg-pm-error-light text-pm-error">
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-pm-lg border border-pm-border p-5">
          <h3 className="font-semibold text-pm-text-primary mb-4">近7天学习活动</h3>
          <div className="h-32 flex items-end gap-2">
            {recentDays.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-pm-sm bg-pm-primary"
                  style={{ height: `${Math.max(6, (day.answered / maxDaily) * 100)}px`, opacity: day.answered ? 1 : 0.2 }}
                  title={`${day.date}: ${day.answered}题`}
                />
                <span className="text-[10px] text-pm-text-muted">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
        <div className="px-6 py-4 border-b border-pm-border">
          <h3 className="font-semibold text-pm-text-primary">错题本列表</h3>
        </div>
        {wrongAnswers.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-pm-text-muted">暂无错题</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-pm-border bg-pm-bg-primary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">题ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">用户答案</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">正确答案</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted">错误次数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pm-border">
                {wrongAnswers.slice(0, 20).map((item) => (
                  <tr key={`${item.questionId}-${item.lastWrongAt}`}>
                    <td className="px-4 py-3 text-sm font-mono">{item.questionId}</td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary max-w-[220px] truncate">{item.userAnswer}</td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary max-w-[220px] truncate">{item.correctAnswer}</td>
                    <td className="px-4 py-3 text-sm text-pm-error">{item.wrongCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam history */}
      <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
        <div className="px-6 py-4 border-b border-pm-border">
          <h3 className="font-semibold text-pm-text-primary">考试历史</h3>
        </div>
        {examHistory.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-pm-text-muted">暂无考试记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-pm-border bg-pm-bg-primary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                    得分
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                    正确/总数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">
                    用时
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pm-border">
                {examHistory.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                      {new Date(e.date).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-pm-full text-xs font-semibold ${
                          e.score >= 60
                            ? 'bg-pm-success-light text-pm-success'
                            : 'bg-pm-error-light text-pm-error'
                        }`}
                      >
                        {e.score}分
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                      {e.correctCount}/{e.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-sm text-pm-text-secondary">
                      {Math.floor(e.timeSpent / 60)}分{e.timeSpent % 60}秒
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
