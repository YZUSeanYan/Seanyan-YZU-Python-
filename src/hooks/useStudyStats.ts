import { useCallback, useMemo } from 'react';
import type { UserAnswer } from '@/types';
import { useUserData } from '@/contexts/UserDataContext';

export function useStudyStats() {
  const { data, updateStudyStats } = useUserData();
  const stats = data.studyStats;
  const dailyActivity = useMemo(
    () => (Array.isArray(stats.dailyActivity) ? stats.dailyActivity : []),
    [stats.dailyActivity]
  );
  const answers = useMemo(() => {
    // Extract answers from dailyActivity as UserAnswer array
    const result: UserAnswer[] = [];
    dailyActivity.forEach((day) => {
      for (let i = 0; i < day.answered; i++) {
        result.push({
          questionId: 0,
          userAnswer: '',
          isCorrect: i < day.correct,
          answeredAt: day.date,
          timeSpent: 0,
        });
      }
    });
    return result;
  }, [dailyActivity]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const recordAnswer = useCallback(
    (answer: UserAnswer, questionType: string, category: string) => {
      updateStudyStats((prev) => {
        const newTotal = prev.totalAnswered + 1;
        const newCorrect = prev.totalCorrect + (answer.isCorrect ? 1 : 0);
        const newRate = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;

        // Update byType
        const prevByType = Array.isArray(prev.byType) ? prev.byType : [];
        const prevByCategory = Array.isArray(prev.byCategory) ? prev.byCategory : [];
        const prevDailyActivity = Array.isArray(prev.dailyActivity) ? prev.dailyActivity : [];

        const newByType = prevByType.map((t) =>
          t.type === questionType
            ? { ...t, answered: t.answered + 1, correct: t.correct + (answer.isCorrect ? 1 : 0) }
            : t
        );

        // Update byCategory
        const existingCat = prevByCategory.find((c) => c.category === category);
        let newByCategory;
        if (existingCat) {
          newByCategory = prevByCategory.map((c) =>
            c.category === category
              ? { ...c, answered: c.answered + 1, correct: c.correct + (answer.isCorrect ? 1 : 0) }
              : c
          );
        } else {
          newByCategory = [...prevByCategory, { category, answered: 1, correct: answer.isCorrect ? 1 : 0 }];
        }

        // Update dailyActivity
        const existingDay = prevDailyActivity.find((d) => d.date === today);
        let newDaily;
        if (existingDay) {
          newDaily = prevDailyActivity.map((d) =>
            d.date === today
              ? { ...d, answered: d.answered + 1, correct: d.correct + (answer.isCorrect ? 1 : 0) }
              : d
          );
        } else {
          newDaily = [...prevDailyActivity, { date: today, answered: 1, correct: answer.isCorrect ? 1 : 0 }];
        }

        // Update streak
        let newStreak = prev.streakDays;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (prev.lastStudyDate === today) {
          // Already studied today, keep streak
        } else if (prev.lastStudyDate === yesterdayStr) {
          newStreak = prev.streakDays + 1;
        } else {
          newStreak = 1;
        }

        // Update weak areas (categories with < 50% correct rate)
        const weak = newByCategory
          .filter((c) => c.answered >= 3 && (c.correct / c.answered) < 0.5)
          .map((c) => c.category);

        return {
          ...prev,
          totalAnswered: newTotal,
          totalCorrect: newCorrect,
          correctRate: newRate,
          streakDays: newStreak,
          lastStudyDate: today,
          byType: newByType,
          byCategory: newByCategory,
          dailyActivity: newDaily,
          weakAreas: weak,
        };
      });
    },
    [updateStudyStats, today]
  );

  const getRecentActivity = useCallback(
    (count: number = 5) => {
      return answers.slice(0, count);
    },
    [answers]
  );

  const getWeeklyActivity = useCallback(() => {
    const days: { date: string; answered: number; correct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = dailyActivity.find((a) => a.date === dateStr);
      days.push(found || { date: dateStr, answered: 0, correct: 0 });
    }
    return days;
  }, [dailyActivity]);

  const isEmpty = stats.totalAnswered === 0;

  return {
    stats,
    answers,
    recordAnswer,
    getRecentActivity,
    getWeeklyActivity,
    isEmpty,
  };
}
