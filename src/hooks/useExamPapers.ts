import { useEffect, useMemo, useState } from 'react';
import type { Question } from '@/types';

export interface ExamPaper {
  id: string;
  title: string;
  sourceFile: string;
  durationMinutes: number;
  questions: Question[];
  counts: Record<string, number>;
}

interface RawExamPaper {
  id: string;
  title: string;
  sourceFile: string;
  durationMinutes: number;
  questions: Array<Record<string, unknown>>;
  counts: Record<string, number>;
}

function normalizeQuestion(raw: Record<string, unknown>): Question {
  return {
    id: Number(raw.id),
    type: raw.type as Question['type'],
    difficulty: (raw.difficulty as Question['difficulty']) || 'medium',
    category: String(raw.category || '综合题'),
    content: String(raw.question || ''),
    options: raw.options as string[] | undefined,
    code: raw.code as string | undefined,
    blanks: raw.blanks as Question['blanks'],
    answer: raw.answer as Question['answer'],
    explanation: String(raw.explanation || ''),
    tags: (raw.tags as string[] | undefined) || [String(raw.category || '综合题')],
  };
}

export function useExamPapers() {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/exam-papers.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load exam papers');
        return res.json();
      })
      .then((raw: { papers: RawExamPaper[] }) => {
        setPapers(
          (raw.papers || []).map((paper) => ({
            ...paper,
            questions: paper.questions.map(normalizeQuestion),
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalQuestions = useMemo(
    () => papers.reduce((sum, paper) => sum + paper.questions.length, 0),
    [papers]
  );

  return { papers, loading, error, totalQuestions };
}
