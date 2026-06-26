import { useCallback, useEffect, useMemo } from 'react';
import type { WrongAnswer } from '@/types';
import { useUserData } from '@/contexts/UserDataContext';

const LEGACY_WRONG_BOOK_KEY = 'pymaster_wrong_book';
const LEGACY_MIGRATED_KEY = 'pymaster_wrong_book_migrated_v2';

function normalizeWrongAnswer(item: WrongAnswer): WrongAnswer {
  return {
    ...item,
    wrongCount: Number(item.wrongCount) || 1,
    attempts: Number(item.attempts) || 0,
    lastWrongAt: item.lastWrongAt || new Date().toISOString(),
    isMastered: Boolean(item.isMastered),
  };
}

function mergeWrongAnswers(current: WrongAnswer[], incoming: WrongAnswer[]): WrongAnswer[] {
  const byQuestion = new Map<number, WrongAnswer>();

  [...current, ...incoming].forEach((raw) => {
    if (!raw || typeof raw.questionId !== 'number') return;
    const item = normalizeWrongAnswer(raw);
    const existing = byQuestion.get(item.questionId);
    if (!existing) {
      byQuestion.set(item.questionId, item);
      return;
    }

    const itemTime = new Date(item.lastWrongAt).getTime();
    const existingTime = new Date(existing.lastWrongAt).getTime();
    const latest = itemTime >= existingTime ? item : existing;

    byQuestion.set(item.questionId, {
      ...existing,
      userAnswer: latest.userAnswer || existing.userAnswer,
      correctAnswer: latest.correctAnswer || existing.correctAnswer,
      wrongCount: Math.max(existing.wrongCount, item.wrongCount),
      attempts: Math.max(existing.attempts, item.attempts),
      lastWrongAt: latest.lastWrongAt,
      isMastered: existing.isMastered && item.isMastered,
    });
  });

  return Array.from(byQuestion.values()).sort(
    (a, b) => new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime()
  );
}

export function useWrongBook() {
  const { data, updateWrongAnswers } = useUserData();
  const wrongAnswers = useMemo(
    () => (Array.isArray(data.wrongAnswers) ? data.wrongAnswers : []),
    [data.wrongAnswers]
  );

  useEffect(() => {
    if (localStorage.getItem(LEGACY_MIGRATED_KEY) === '1') return;

    try {
      const raw = localStorage.getItem(LEGACY_WRONG_BOOK_KEY);
      const legacy = raw ? JSON.parse(raw) : [];
      if (Array.isArray(legacy) && legacy.length > 0) {
        updateWrongAnswers((prev) => mergeWrongAnswers(prev, legacy as WrongAnswer[]));
      }
      localStorage.setItem(LEGACY_MIGRATED_KEY, '1');
    } catch {
      localStorage.setItem(LEGACY_MIGRATED_KEY, '1');
    }
  }, [updateWrongAnswers]);

  const addWrongAnswer = useCallback(
    (questionId: number, userAnswer: string, correctAnswer: string) => {
      updateWrongAnswers((prev) => {
        const existing = prev.find((w) => w.questionId === questionId);
        if (existing) {
          return prev.map((w) =>
            w.questionId === questionId
              ? {
                  ...w,
                  userAnswer,
                  wrongCount: w.wrongCount + 1,
                  lastWrongAt: new Date().toISOString(),
                  isMastered: false,
                  attempts: w.attempts + 1,
                }
              : w
          );
        }
        return [
          {
            questionId,
            userAnswer,
            correctAnswer,
            wrongCount: 1,
            lastWrongAt: new Date().toISOString(),
            isMastered: false,
            attempts: 0,
          },
          ...prev,
        ];
      });
    },
    [updateWrongAnswers]
  );

  const markMastered = useCallback(
    (questionId: number) => {
      updateWrongAnswers((prev) =>
        prev.map((w) => (w.questionId === questionId ? { ...w, isMastered: true } : w))
      );
    },
    [updateWrongAnswers]
  );

  const markNotMastered = useCallback(
    (questionId: number) => {
      updateWrongAnswers((prev) =>
        prev.map((w) => (w.questionId === questionId ? { ...w, isMastered: false } : w))
      );
    },
    [updateWrongAnswers]
  );

  const removeWrongAnswer = useCallback(
    (questionId: number) => {
      updateWrongAnswers((prev) => prev.filter((w) => w.questionId !== questionId));
    },
    [updateWrongAnswers]
  );

  const getUnmastered = useCallback(() => {
    return wrongAnswers.filter((w) => !w.isMastered);
  }, [wrongAnswers]);

  const getMastered = useCallback(() => {
    return wrongAnswers.filter((w) => w.isMastered);
  }, [wrongAnswers]);

  const unmasteredCount = useMemo(() => wrongAnswers.filter((w) => !w.isMastered).length, [wrongAnswers]);

  const isInWrongBook = useCallback(
    (questionId: number) => {
      return wrongAnswers.some((w) => w.questionId === questionId && !w.isMastered);
    },
    [wrongAnswers]
  );

  return {
    wrongAnswers,
    unmasteredCount,
    addWrongAnswer,
    markMastered,
    markNotMastered,
    removeWrongAnswer,
    getUnmastered,
    getMastered,
    isInWrongBook,
  };
}
