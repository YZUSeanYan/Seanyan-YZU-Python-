import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Question, QuestionType } from '@/types';

interface QuestionsData {
  total: number;
  categories: string[];
  questions: Question[];
}

type RawQuestion = Partial<Question> & {
  id: number;
  type: string;
  question?: string;
};

const typeMapping: Record<string, QuestionType> = {
  single: 'single',
  fill: 'fill',
  codeFill: 'codeFill',
  codeFix: 'codeFix',
};

function normalizeQuestion(q: RawQuestion): Question {
  const category = q.category || '未分类';
  const questionType = typeMapping[q.type] || 'single';

  return {
    id: q.id,
    sourceId: q.sourceId,
    type: questionType,
    difficulty: q.difficulty || 'easy',
    category,
    content: q.question || q.content || '',
    options: q.options,
    code: q.code,
    answer: q.answer ?? '',
    explanation: q.explanation || '',
    tags: Array.isArray(q.tags) ? q.tags : [category],
  };
}

export function useQuestions() {
  const [data, setData] = useState<QuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/questions.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load questions');
        return res.json();
      })
      .then((raw: Omit<QuestionsData, 'questions'> & { questions: RawQuestion[] }) => {
        const normalized: QuestionsData = {
          total: raw.total,
          categories: raw.categories,
          questions: raw.questions.map(normalizeQuestion),
        };
        setData(normalized);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getByType = useCallback(
    (type: QuestionType) => {
      if (!data) return [];
      return data.questions.filter((q) => q.type === type);
    },
    [data]
  );

  const getByCategory = useCallback(
    (category: string) => {
      if (!data) return [];
      return data.questions.filter((q) => q.category === category);
    },
    [data]
  );

  const getRandomQuestions = useCallback(
    (count: number, type?: QuestionType) => {
      const pool = type ? getByType(type) : data?.questions || [];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    },
    [data, getByType]
  );

  const getById = useCallback(
    (id: number) => {
      return data?.questions.find((q) => q.id === id) || null;
    },
    [data]
  );

  const typeCounts = useMemo(() => {
    return {
      'single': getByType('single').length,
      'fill': getByType('fill').length,
      'codeFill': getByType('codeFill').length,
      'codeFix': getByType('codeFix').length,
    };
  }, [getByType]);

  return {
    questions: data?.questions || [],
    categories: data?.categories || [],
    total: data?.total || 0,
    loading,
    error,
    getByType,
    getByCategory,
    getRandomQuestions,
    getById,
    typeCounts,
  };
}
