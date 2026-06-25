import { useCallback, useMemo } from 'react';
import type { WrongAnswer } from '@/types';
import { useLocalStorage } from './useLocalStorage';

export function useWrongBook() {
  const [wrongAnswers, setWrongAnswers] = useLocalStorage<WrongAnswer[]>('pymaster_wrong_book', []);

  const addWrongAnswer = useCallback(
    (questionId: number, userAnswer: string, correctAnswer: string) => {
      setWrongAnswers((prev) => {
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
    [setWrongAnswers]
  );

  const markMastered = useCallback(
    (questionId: number) => {
      setWrongAnswers((prev) =>
        prev.map((w) => (w.questionId === questionId ? { ...w, isMastered: true } : w))
      );
    },
    [setWrongAnswers]
  );

  const markNotMastered = useCallback(
    (questionId: number) => {
      setWrongAnswers((prev) =>
        prev.map((w) => (w.questionId === questionId ? { ...w, isMastered: false } : w))
      );
    },
    [setWrongAnswers]
  );

  const removeWrongAnswer = useCallback(
    (questionId: number) => {
      setWrongAnswers((prev) => prev.filter((w) => w.questionId !== questionId));
    },
    [setWrongAnswers]
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
