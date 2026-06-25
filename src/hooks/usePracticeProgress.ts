import { useCallback, useRef } from 'react';
import { useUserData } from '@/contexts/UserDataContext';
import type { QuestionType, Difficulty } from '@/types';

type AnswerState = 'unanswered' | 'correct' | 'wrong' | 'skipped';

const PROGRESS_STORAGE_KEY = -1; // Special key in memoryStatus for practice progress
const DEBOUNCE_MS = 500;

export interface PracticeProgress {
  currentQuestionId: number;
  currentIndex: number;
  filters: {
    type: QuestionType | 'all';
    difficulty: Difficulty | 'all';
    category: string;
    searchQuery: string;
    source: 'basic' | 'advanced' | 'all';
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

export function getSavedProgress(memoryStatus: Record<number, string>): PracticeProgress | null {
  return parseProgress(memoryStatus[PROGRESS_STORAGE_KEY]);
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
  updateMemoryStatus((prev) => {
    const next = { ...prev };
    delete next[PROGRESS_STORAGE_KEY];
    return next;
  });
  // Also clear legacy localStorage
  localStorage.removeItem('seanyan_practice_progress');
}

export function usePracticeProgress() {
  const { data, updateMemoryStatus } = useUserData();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read progress from server-synced memoryStatus (with localStorage fallback)
  const getProgress = useCallback((): PracticeProgress | null => {
    // 1. Try server-synced data first
    const serverProgress = parseProgress(data.memoryStatus[PROGRESS_STORAGE_KEY]);
    if (serverProgress) return serverProgress;

    // 2. Fallback to legacy localStorage (migration)
    try {
      const raw = localStorage.getItem('seanyan_practice_progress');
      if (raw) {
        const parsed = JSON.parse(raw) as PracticeProgress;
        if (parsed && parsed.version === 1) {
          const age = Date.now() - new Date(parsed.timestamp).getTime();
          if (age <= 30 * 24 * 60 * 60 * 1000) return parsed;
        }
      }
    } catch { /* ignore */ }

    return null;
  }, [data.memoryStatus]);

  const save = useCallback((
    currentQuestionId: number,
    currentIndex: number,
    filters: { type: QuestionType | 'all'; difficulty: Difficulty | 'all'; category: string; searchQuery: string; source: 'basic' | 'advanced' | 'all' },
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
      const progressStr = JSON.stringify(progress);

      // Save to server-synced memoryStatus
      updateMemoryStatus((prev) => ({ ...prev, [PROGRESS_STORAGE_KEY]: progressStr }));

      // Also save to localStorage as backup
      try {
        localStorage.setItem('seanyan_practice_progress', progressStr);
      } catch { /* ignore */ }
    }, DEBOUNCE_MS);
  }, [updateMemoryStatus]);

  const saveImmediate = useCallback((
    currentQuestionId: number,
    currentIndex: number,
    filters: { type: QuestionType | 'all'; difficulty: Difficulty | 'all'; category: string; searchQuery: string; source: 'basic' | 'advanced' | 'all' },
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
    const progressStr = JSON.stringify(progress);

    // Save to server-synced memoryStatus
    updateMemoryStatus((prev) => ({ ...prev, [PROGRESS_STORAGE_KEY]: progressStr }));

    // Also save to localStorage as backup
    try {
      localStorage.setItem('seanyan_practice_progress', progressStr);
    } catch { /* ignore */ }
  }, [updateMemoryStatus]);

  const clearSavedProgress = useCallback(() => {
    clearProgress(updateMemoryStatus);
  }, [updateMemoryStatus]);

  return { save, saveImmediate, getSavedProgress: getProgress, hasSavedProgress, clearProgress: clearSavedProgress };
}
