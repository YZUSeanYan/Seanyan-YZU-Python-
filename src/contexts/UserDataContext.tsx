import { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import type { WrongAnswer, StudyStats } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// ===== Types =====
export interface UserDataState {
  wrongAnswers: WrongAnswer[];
  studyStats: StudyStats;
  memoryStatus: Record<number, string>;
  examHistory: unknown[];
}

interface UserDataContextType {
  data: UserDataState;
  updateWrongAnswers: (updater: (prev: WrongAnswer[]) => WrongAnswer[]) => void;
  updateStudyStats: (updater: (prev: StudyStats) => StudyStats) => void;
  updateMemoryStatus: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  updateExamHistory: (updater: (prev: unknown[]) => unknown[]) => void;
  setUserData: (data: Partial<UserDataState>) => void;
  isLoading: boolean;
  isSynced: boolean;
}

// ===== Default values =====
const defaultStudyStats: StudyStats = {
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
};

const defaultData: UserDataState = {
  wrongAnswers: [],
  studyStats: defaultStudyStats,
  memoryStatus: {},
  examHistory: [],
};

function normalizeStudyStats(stats: Partial<StudyStats> | null | undefined): StudyStats {
  return {
    ...defaultStudyStats,
    ...(stats || {}),
    byType: Array.isArray(stats?.byType) ? stats.byType : defaultStudyStats.byType,
    byCategory: Array.isArray(stats?.byCategory) ? stats.byCategory : defaultStudyStats.byCategory,
    dailyActivity: Array.isArray(stats?.dailyActivity) ? stats.dailyActivity : defaultStudyStats.dailyActivity,
    weakAreas: Array.isArray(stats?.weakAreas) ? stats.weakAreas : defaultStudyStats.weakAreas,
  };
}

function normalizeUserData(data: Partial<UserDataState> | null | undefined): UserDataState {
  return {
    wrongAnswers: Array.isArray(data?.wrongAnswers) ? data.wrongAnswers : defaultData.wrongAnswers,
    studyStats: normalizeStudyStats(data?.studyStats),
    memoryStatus: data?.memoryStatus && typeof data.memoryStatus === 'object' ? data.memoryStatus : defaultData.memoryStatus,
    examHistory: Array.isArray(data?.examHistory) ? data.examHistory : defaultData.examHistory,
  };
}

function mergeWrongAnswers(...sources: Array<WrongAnswer[] | null | undefined>): WrongAnswer[] {
  const byQuestion = new Map<number, WrongAnswer>();

  sources.flatMap((source) => (Array.isArray(source) ? source : [])).forEach((item) => {
    if (!item || typeof item.questionId !== 'number') return;
    const existing = byQuestion.get(item.questionId);
    if (!existing) {
      byQuestion.set(item.questionId, {
        ...item,
        wrongCount: Number(item.wrongCount) || 1,
        attempts: Number(item.attempts) || 0,
        lastWrongAt: item.lastWrongAt || new Date().toISOString(),
        isMastered: Boolean(item.isMastered),
      });
      return;
    }

    const itemTime = new Date(item.lastWrongAt || 0).getTime();
    const existingTime = new Date(existing.lastWrongAt || 0).getTime();
    const latest = itemTime >= existingTime ? item : existing;

    byQuestion.set(item.questionId, {
      ...existing,
      userAnswer: latest.userAnswer || existing.userAnswer,
      correctAnswer: latest.correctAnswer || existing.correctAnswer,
      wrongCount: Math.max(Number(existing.wrongCount) || 1, Number(item.wrongCount) || 1),
      attempts: Math.max(Number(existing.attempts) || 0, Number(item.attempts) || 0),
      lastWrongAt: latest.lastWrongAt || existing.lastWrongAt || new Date().toISOString(),
      isMastered: Boolean(existing.isMastered && item.isMastered),
    });
  });

  return Array.from(byQuestion.values()).sort(
    (a, b) => new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime()
  );
}

// ===== Keys for localStorage (cache) =====
const LS_DATA_KEY = 'seanyan_user_data_cache';

// ===== Context =====
const UserDataContext = createContext<UserDataContextType | null>(null);

// ===== Helper: load from localStorage cache =====
function loadFromCache(): UserDataState {
  try {
    const raw = localStorage.getItem(LS_DATA_KEY);
    if (raw) return normalizeUserData(JSON.parse(raw));
  } catch { /* ignore */ }
  return { ...defaultData };
}

// ===== Helper: save to localStorage cache =====
function saveToCache(data: UserDataState) {
  try {
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ===== Provider =====
export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  const userId = authState.user?.id;

  const [data, setDataState] = useState<UserDataState>(loadFromCache);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== Sync to server =====
  // The server schema has a dedicated `practice_progress` column. We mirror
  // the same data as `memory_status` into that column so the gated
  // exam-paper practice mode (which uses memoryStatus[-2] via usePracticeProgress)
  // survives page reloads and device switches. Old rows that don't have the
  // column yet are auto-migrated by the server's ALTER TABLE on first read.
  const syncToServer = useCallback((newData: UserDataState) => {
    if (!userId) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);

    syncTimer.current = setTimeout(() => {
      api.saveUserData(userId, {
        wrong_answers: newData.wrongAnswers,
        study_stats: newData.studyStats,
        memory_status: newData.memoryStatus,
        exam_history: newData.examHistory,
        practice_progress: newData.memoryStatus,
      }).then(() => {
        setIsSynced(true);
      }).catch(() => {
        setIsSynced(false);
      });
    }, 800);
  }, [userId]);

  // Stable ref to the latest syncToServer so the data-loading effect below
  // (which is declared above this point) can call it without TDZ.
  const syncToServerRef = useRef<(newData: UserDataState) => void>(syncToServer);
  useEffect(() => {
    syncToServerRef.current = syncToServer;
  }, [syncToServer]);

  // ===== Load from server on login =====
  useEffect(() => {
    if (!userId) {
      setIsSynced(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    api.getUserData(userId)
      .then((serverData) => {
        if (cancelled) return;

        const parsed: Partial<UserDataState> = {};
        try {
          if (serverData.wrong_answers) parsed.wrongAnswers = JSON.parse(serverData.wrong_answers as string);
        } catch { /* ignore */ }
        try {
          if (serverData.study_stats) parsed.studyStats = JSON.parse(serverData.study_stats as string);
        } catch { /* ignore */ }
        try {
          if (serverData.memory_status) parsed.memoryStatus = JSON.parse(serverData.memory_status as string);
        } catch { /* ignore */ }
        try {
          if (serverData.exam_history) parsed.examHistory = JSON.parse(serverData.exam_history as string);
        } catch { /* ignore */ }
        // Backward-compat: older rows may only have practice_progress populated.
        // Treat it as memoryStatus if memory_status is empty.
        try {
          if (!serverData.memory_status && serverData.practice_progress) {
            parsed.memoryStatus = JSON.parse(serverData.practice_progress as string);
          }
        } catch { /* ignore */ }

        const hasServerData = (
          (parsed.wrongAnswers && (parsed.wrongAnswers as WrongAnswer[]).length > 0) ||
          (parsed.studyStats && (parsed.studyStats as StudyStats).totalAnswered > 0) ||
          (parsed.memoryStatus && Object.keys(parsed.memoryStatus).length > 0) ||
          (parsed.examHistory && (parsed.examHistory as unknown[]).length > 0)
        );

        setDataState((prev) => {
          const current = normalizeUserData(prev);
          const merged = normalizeUserData({
            wrongAnswers: mergeWrongAnswers(current.wrongAnswers, parsed.wrongAnswers as WrongAnswer[] | undefined),
            studyStats: parsed.studyStats && (parsed.studyStats as StudyStats).totalAnswered > 0
              ? parsed.studyStats as StudyStats
              : current.studyStats,
            memoryStatus: parsed.memoryStatus && Object.keys(parsed.memoryStatus).length > 0
              ? parsed.memoryStatus as Record<number, string>
              : current.memoryStatus,
            examHistory: parsed.examHistory && (parsed.examHistory as unknown[]).length > 0
              ? parsed.examHistory as unknown[]
              : current.examHistory,
          });
          saveToCache(merged);

          if (!hasServerData) {
            const localHasData = (
              current.wrongAnswers.length > 0 ||
              current.studyStats.totalAnswered > 0 ||
              Object.keys(current.memoryStatus).length > 0 ||
              current.examHistory.length > 0
            );
            if (localHasData) {
              setTimeout(() => {
                if (!cancelled) {
                  syncToServerRef.current(merged);
                }
              }, 100);
            }
          }

          return merged;
        });
        setIsSynced(true);
      })
      .catch(() => {
        if (!cancelled) setIsSynced(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  // ===== Update helpers =====
  const setUserData = useCallback((partial: Partial<UserDataState>) => {
    setDataState((prev) => {
      const next = { ...prev, ...partial };
      saveToCache(next);
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  const updateWrongAnswers = useCallback((updater: (prev: WrongAnswer[]) => WrongAnswer[]) => {
    setDataState((prev) => {
      const next = { ...prev, wrongAnswers: updater(prev.wrongAnswers) };
      saveToCache(next);
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  const updateStudyStats = useCallback((updater: (prev: StudyStats) => StudyStats) => {
    setDataState((prev) => {
      const next = { ...prev, studyStats: updater(prev.studyStats) };
      saveToCache(next);
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  const updateMemoryStatus = useCallback((updater: (prev: Record<number, string>) => Record<number, string>) => {
    setDataState((prev) => {
      const next = { ...prev, memoryStatus: updater(prev.memoryStatus) };
      saveToCache(next);
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  const updateExamHistory = useCallback((updater: (prev: unknown[]) => unknown[]) => {
    setDataState((prev) => {
      const next = { ...prev, examHistory: updater(prev.examHistory) };
      saveToCache(next);
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  return (
    <UserDataContext.Provider value={{
      data,
      updateWrongAnswers,
      updateStudyStats,
      updateMemoryStatus,
      updateExamHistory,
      setUserData,
      isLoading,
      isSynced,
    }}>
      {children}
    </UserDataContext.Provider>
  );
}

// ===== Hook =====
export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}
