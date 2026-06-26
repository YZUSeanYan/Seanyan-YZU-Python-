import { useEffect, useMemo, useState } from 'react';
import type { Question, QuestionType } from '@/types';

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

const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

function stripOptionLabel(option: string): string {
  return option.replace(/^[A-F][.、]\s*/i, '').trim();
}

function normalizeAnswerLetter(answer: unknown): string {
  const value = Array.isArray(answer) ? String(answer[0] || '') : String(answer || '');
  const match = value.trim().match(/^([A-F])/i);
  return match ? match[1].toUpperCase() : value.trim().toUpperCase();
}

function normalizeSingleChoice(
  options: string[] | undefined,
  answer: unknown
): { options: string[] | undefined; answer: unknown } {
  if (!Array.isArray(options) || options.length === 0) {
    return { options, answer };
  }

  const answerLetter = normalizeAnswerLetter(answer);
  let normalizedAnswer = answer;
  const firstLetterByText = new Map<string, string>();
  const keptOptions: string[] = [];

  options.forEach((option, index) => {
    const text = stripOptionLabel(String(option));
    const currentLetter = optionLetters[index] || String.fromCharCode(65 + index);
    const firstLetter = firstLetterByText.get(text);

    if (firstLetter) {
      if (answerLetter === currentLetter) normalizedAnswer = firstLetter;
      return;
    }

    firstLetterByText.set(text, currentLetter);
    keptOptions.push(option);
  });

  return { options: keptOptions, answer: normalizedAnswer };
}

/**
 * Historical exam-papers.json contains entries with type='single' that are
 * actually code-fix questions:
 *   - options is an empty array
 *   - category is labelled '程序改错题'
 *   - content contains 【错误】 markers, answer is a code snippet
 * We downgrade these to codeFix on load so the UI does not render a
 * "single-choice question with no choices" in /practice-2 and /sim-exam.
 */
function fixMisclassifiedType(
  declaredType: QuestionType,
  category: string,
  options: string[] | undefined,
  content: string
): QuestionType {
  if (declaredType !== 'single') return declaredType;
  const hasOptions = Array.isArray(options) && options.length > 0;
  if (hasOptions) return declaredType;
  if (/改错|纠错|找错/.test(category)) return 'codeFix';
  if (/【错误\d*】|错误\d+[：:]/.test(content)) return 'codeFix';
  return declaredType;
}

function normalizeQuestion(
  raw: Record<string, unknown>,
  paperNumericId: number,
  actualIndex: number
): Question {
  const content = String(raw.question || '');
  const options = raw.options as string[] | undefined;
  const declaredType = raw.type as Question['type'];
  const category = String(raw.category || '综合题');
  const type = fixMisclassifiedType(declaredType, category, options, content);
  const normalizedChoice = type === 'single'
    ? normalizeSingleChoice(options, raw.answer)
    : { options: undefined, answer: raw.answer };

  // IMPORTANT: exam-papers.json ids come from parse_exam_docs.py with the
  // rule `paperNo * 1000 + paperQuestionNumber`, but a single paper has
  // 58+ questions sharing the same paperQuestionNumber (multiple sub-questions
  // under one "第 N 题" header). That makes ids collide, which breaks the
  // React state keyed on question id (Record<number, string>). We rewrite
  // to `paperNo * 10000 + actualIndex + 1` on the client, without modifying
  // the source file, so the simulation exam sidebar's "已答" counter and
  // totalAnswered stay consistent.
  const id = paperNumericId * 10000 + actualIndex + 1;

  return {
    id,
    sourceId: Number(raw.id) || undefined,
    type,
    difficulty: (raw.difficulty as Question['difficulty']) || 'medium',
    category,
    content,
    options: normalizedChoice.options,
    code: raw.code as string | undefined,
    blanks: raw.blanks as Question['blanks'],
    answer: normalizedChoice.answer as Question['answer'],
    explanation: String(raw.explanation || ''),
    tags: (raw.tags as string[] | undefined) || [category],
  };
}

function paperIdToNumber(paperId: string): number {
  const match = paperId.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
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
          (raw.papers || []).map((paper) => {
            const paperNumericId = paperIdToNumber(paper.id);
            return {
              ...paper,
              questions: paper.questions.map((q, idx) =>
                normalizeQuestion(q, paperNumericId, idx)
              ),
            };
          })
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
