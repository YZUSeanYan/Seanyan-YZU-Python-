import { useCallback, useRef } from 'react';
import { useUserData } from '@/contexts/UserDataContext';
import type { QuestionType, Difficulty } from '@/types';

type AnswerState = 'unanswered' | 'correct' | 'wrong' | 'skipped';

const PROGRESS_STORAGE_KEYS = {
  all: -1,
  practice2: -2,
} as const;
const LOCAL_STORAGE_KEYS = {
  all: 'seanyan_practice_progress',
  practice2: 'seanyan_practice2_progress',
} as const;
const DEBOUNCE_MS = 500;
export type PracticeProgressScope = keyof typeof PROGRESS_STORAGE_KEYS;

export interface PracticeProgress {
  currentQuestionId: number;
  currentIndex: number;
  filters: {
    type: QuestionType | 'all';
    difficulty: Difficulty | 'all';
    category: string;
    searchQuery: string;
    source: 'basic' | 'advanced' | 'all' | 'practice2';
  };
  userAnswers: Record<number, string | null>;
  answerStates: AnswerState[];
  results: Record<number, boolean>;
  timestamp: string;
  version: number;
}

// Parse progress from memoryStatus storage string
function parseProgress(str: string | undefined): PracticeProgress | null {
  if (!str) return null;
  try {
    const data = JSON.parse(str) as PracticeProgress;
    if (!data || data.version !== 1) return null;
    // Only valid if within last 30 days
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > 30 * 24 * 60 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

function getProgressScore(progress: PracticeProgress | null): number {
  if (!progress) return 0;
  const stateCount = Array.isArray(progress.answerStates)
    ? progress.answerStates.filter((state) => state && state !== 'unanswered').length
    : 0;
  const answerCount = progress.userAnswers && typeof progress.userAnswers === 'object'
    ? Object.values(progress.userAnswers).filter((answer) => answer !== null && answer !== undefined && String(answer).trim() !== '').length
    : 0;
  const resultCount = progress.results && typeof progress.results === 'object'
    ? Object.keys(progress.results).length
    : 0;

  return Math.max(stateCount, answerCount, resultCount);
}

export function getSavedProgress(memoryStatus: Record<number, string>): PracticeProgress | null {
  return parseProgress(memoryStatus[PROGRESS_STORAGE_KEYS.all]);
}

// Check if progress exists in localStorage (for components without UserDataContext access)
export function hasSavedProgress(): boolean {
  try {
    const raw = localStorage.getItem('seanyan_practice_progress');
    if (!raw) return false;
    const data = JSON.parse(raw) as PracticeProgress;
    if (!data || data.version !== 1) return false;
    const age = Date.now() - new Date(data.timestamp).getTime();
    return age <= 30 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function clearProgress(updateMemoryStatus: (updater: (prev: Record<number, string>) => Record<number, string>) => void) {
  clearScopedProgress(updateMemoryStatus, 'all');
}

export function clearScopedProgress(
  updateMemoryStatus: (updater: (prev: Record<number, string>) => Record<number, string>) => void,
  scope: PracticeProgressScope = 'all'
) {
  const progressStorageKey = PROGRESS_STORAGE_KEYS[scope];
  updateMemoryStatus((prev) => {
    const next = { ...prev };
    delete next[progressStorageKey];
    return next;
  });
  localStorage.removeItem(LOCAL_STORAGE_KEYS[scope]);
  if (scope === 'all') localStorage.removeItem('pymaster_practice_progress');
}

export function usePracticeProgress(scope: PracticeProgressScope = 'all') {
  const { data, updateMemoryStatus } = useUserData();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressStorageKey = PROGRESS_STORAGE_KEYS[scope];
  const localStorageKey = LOCAL_STORAGE_KEYS[scope];

  // Read progress from server-synced memoryStatus (with localStorage fallback)
  const getProgress = useCallback((): PracticeProgress | null => {
    // 1. Try server-synced data first
    const serverProgress = parseProgress(data.memoryStatus[progressStorageKey]);
    if (serverProgress) return serverProgress;

    // 2. Fallback to legacy localStorage (migration)
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PracticeProgress;
        if (parsed && parsed.version === 1) {
          const age = Date.now() - new Date(parsed.timestamp).getTime();
          if (age <= 30 * 24 * 60 * 60 * 1000) return parsed;
        }
      }
    } catch { /* ignore */ }

    return null;
  }, [data.memoryStatus, progressStorageKey, localStorageKey]);

  const save = useCallback((
    currentQuestionId: number,
    currentIndex: number,
    filters: { type: QuestionType | 'all'; difficulty: Difficulty | 'all'; category: string; searchQuery: string; source: 'basic' | 'advanced' | 'all' | 'practice2' },
    userAnswers: Record<number, string | null>,
    answerStates: AnswerState[],
    results: Record<number, boolean>
  ) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const progress: PracticeProgress = {
        currentQuestionId,
        currentIndex,
        filters,
        userAnswers,
        answerStates,
        results,
        timestamp: new Date().toISOString(),
        version: 1,
      };
      const existingProgress = getProgress();
      if (getProgressScore(progress) === 0 && getProgressScore(existingProgress) > 0) return;

      const progressStr = JSON.stringify(progress);

      // Save to server-synced memoryStatus
      updateMemoryStatus((prev) => ({ ...prev, [progressStorageKey]: progressStr }));

      // Also save to localStorage as backup
      try {
        localStorage.setItem(localStorageKey, progressStr);
      } catch { /* ignore */ }
    }, DEBOUNCE_MS);
  }, [getProgress, updateMemoryStatus, progressStorageKey, localStorageKey]);

  const saveImmediate = useCallback((
    currentQuestionId: number,
    currentIndex: number,
    filters: { type: QuestionType | 'all'; difficulty: Difficulty | 'all'; category: string; searchQuery: string; source: 'basic' | 'advanced' | 'all' | 'practice2' },
    userAnswers: Record<number, string | null>,
    answerStates: AnswerState[],
    results: Record<number, boolean>
  ) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const progress: PracticeProgress = {
      currentQuestionId,
      currentIndex,
      filters,
      userAnswers,
      answerStates,
      results,
      timestamp: new Date().toISOString(),
      version: 1,
    };
    const existingProgress = getProgress();
    if (getProgressScore(progress) === 0 && getProgressScore(existingProgress) > 0) return;

    const progressStr = JSON.stringify(progress);

    // Save to server-synced memoryStatus
    updateMemoryStatus((prev) => ({ ...prev, [progressStorageKey]: progressStr }));

    // Also save to localStorage as backup
    try {
      localStorage.setItem(localStorageKey, progressStr);
    } catch { /* ignore */ }
  }, [getProgress, updateMemoryStatus, progressStorageKey, localStorageKey]);

  const clearSavedProgress = useCallback(() => {
    clearScopedProgress(updateMemoryStatus, scope);
  }, [updateMemoryStatus, scope]);

  return { save, saveImmediate, getSavedProgress: getProgress, hasSavedProgress, clearProgress: clearSavedProgress };
}
