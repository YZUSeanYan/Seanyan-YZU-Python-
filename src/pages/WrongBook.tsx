import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, AlertCircle, CheckCircle, RotateCcw, Trash2, CheckSquare } from 'lucide-react';
import type { Difficulty, QuestionType, Question, WrongAnswer } from '@/types';
import { useQuestions } from '@/hooks/useQuestions';
import { useExamPapers } from '@/hooks/useExamPapers';
import { useWrongBook } from '@/hooks/useWrongBook';
import { useUserData } from '@/contexts/UserDataContext';
import WrongBookFilters from '@/components/wrongbook/WrongBookFilters';
import WrongQuestionCard from '@/components/wrongbook/WrongQuestionCard';
import EmptyState from '@/components/wrongbook/EmptyState';
import RetryMode from '@/components/wrongbook/RetryMode';

type AnswerState = 'unanswered' | 'correct' | 'wrong' | 'skipped';

interface RetryQuestion {
  question: Question;
  lastAnswer: string;
  lastWrongAt: string;
  wrongCount: number;
}

interface PracticeProgress {
  filters?: {
    type?: QuestionType | 'all';
    difficulty?: Difficulty | 'all';
    category?: string;
    searchQuery?: string;
    source?: string;
  };
  userAnswers?: Record<number, string | null>;
  answerStates?: AnswerState[];
  timestamp?: string;
  version?: number;
}

interface SimExamProgress {
  paperId?: string;
  answers?: Record<number, string>;
  timestamp?: string;
  version?: number;
}

function normalizeAnswer(answer: string) {
  const trimmed = answer.trim();
  const match = trimmed.match(/^([A-D])[.\s]?/i);
  return match ? match[1].toUpperCase() : trimmed.toLowerCase();
}

function isQuestionCorrect(question: Question, answer: string) {
  if (!answer.trim()) return false;
  const correctAnswer = Array.isArray(question.answer) ? question.answer : [question.answer];
  if (question.type === 'single') return normalizeAnswer(answer) === normalizeAnswer(String(correctAnswer[0]));
  if (Array.isArray(question.answer)) {
    const answerParts = answer.split('|').map((part) => part.trim().toLowerCase());
    return question.answer.every((part, index) => answerParts[index] === String(part).trim().toLowerCase());
  }
  return answer.trim().toLowerCase() === String(correctAnswer[0]).trim().toLowerCase();
}

function parsePracticeProgress(raw: string | undefined | null): PracticeProgress | null {
  if (!raw) return null;
  try {
    const progress = JSON.parse(raw) as PracticeProgress;
    if (!progress || progress.version !== 1 || !Array.isArray(progress.answerStates)) return null;
    return progress;
  } catch {
    return null;
  }
}

function parseSimExamProgress(raw: string | undefined | null): SimExamProgress | null {
  if (!raw) return null;
  try {
    const progress = JSON.parse(raw) as SimExamProgress;
    if (!progress || progress.version !== 1 || !progress.answers) return null;
    return progress;
  } catch {
    return null;
  }
}

function getLocalProgress(storageKey: string): PracticeProgress | null {
  try {
    return parsePracticeProgress(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function getLocalSimExamProgress(): SimExamProgress | null {
  try {
    return parseSimExamProgress(localStorage.getItem('seanyan_sim_exam_progress'));
  } catch {
    return null;
  }
}

function applyPracticeFilters(questions: Question[], filters: PracticeProgress['filters']): Question[] {
  let filtered = [...questions];
  if (!filters) return filtered;

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter((question) => question.type === filters.type);
  }
  if (filters.difficulty && filters.difficulty !== 'all') {
    filtered = filtered.filter((question) => question.difficulty === filters.difficulty);
  }
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((question) => question.category === filters.category);
  }
  if (filters.searchQuery?.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (question) =>
        question.content.toLowerCase().includes(query) ||
        question.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }
  return filtered;
}

export default function WrongBook() {
  const { getById, questions } = useQuestions();
  const { papers } = useExamPapers();
  const { data } = useUserData();
  const {
    wrongAnswers,
    addWrongAnswers,
    markMastered,
    markNotMastered,
    removeWrongAnswer,
  } = useWrongBook();

  // Filter states
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Retry mode
  const [retryMode, setRetryMode] = useState(false);
  const [retryQuestions, setRetryQuestions] = useState<RetryQuestion[]>([]);
  const examQuestionById = useMemo(() => {
    const map = new Map<number, Question>();
    const legacyMap = new Map<number, Question>();
    papers.forEach((paper) => {
      paper.questions.forEach((question) => {
        map.set(question.id, question);
        if (question.sourceId && !legacyMap.has(question.sourceId)) {
          legacyMap.set(question.sourceId, question);
        }
      });
    });
    return { map, legacyMap };
  }, [papers]);
  const examQuestions = useMemo(
    () => papers.flatMap((paper) => paper.questions),
    [papers]
  );

  useEffect(() => {
    if (questions.length === 0 && examQuestions.length === 0) return;

    const candidates = [
      { progress: parsePracticeProgress(data.memoryStatus[-1]), pool: questions },
      { progress: getLocalProgress('seanyan_practice_progress'), pool: questions },
      { progress: getLocalProgress('pymaster_practice_progress'), pool: questions },
      { progress: parsePracticeProgress(data.memoryStatus[-2]), pool: examQuestions },
      { progress: getLocalProgress('seanyan_practice2_progress'), pool: examQuestions },
    ].filter((item) => item.progress && item.pool.length > 0) as Array<{
      progress: PracticeProgress;
      pool: Question[];
    }>;

    const existingIds = new Set(wrongAnswers.map((item) => item.questionId));
    const recovered: WrongAnswer[] = [];

    candidates.forEach((progress) => {
      const pool = applyPracticeFilters(progress.pool, progress.progress.filters);
      progress.progress.answerStates?.forEach((state, index) => {
        if (state !== 'wrong') return;
        const question = pool[index];
        if (!question || existingIds.has(question.id)) return;

        existingIds.add(question.id);
        recovered.push({
          questionId: question.id,
          userAnswer: String(progress.progress.userAnswers?.[index] || ''),
          correctAnswer: Array.isArray(question.answer) ? question.answer.join(' | ') : question.answer,
          wrongCount: 1,
          lastWrongAt: progress.progress.timestamp || new Date().toISOString(),
          isMastered: false,
          attempts: 0,
        });
      });
    });

    const simExamCandidates = [
      parseSimExamProgress(data.memoryStatus[-3]),
      getLocalSimExamProgress(),
    ].filter(Boolean) as SimExamProgress[];

    simExamCandidates.forEach((progress) => {
      Object.entries(progress.answers || {}).forEach(([questionId, answer]) => {
        const id = Number(questionId);
        if (!answer?.trim() || existingIds.has(id)) return;
        const question = examQuestionById.map.get(id) || examQuestionById.legacyMap.get(id);
        if (!question || isQuestionCorrect(question, answer)) return;

        existingIds.add(id);
        recovered.push({
          questionId: id,
          userAnswer: answer,
          correctAnswer: Array.isArray(question.answer) ? question.answer.join(' | ') : question.answer,
          wrongCount: 1,
          lastWrongAt: progress.timestamp || new Date().toISOString(),
          isMastered: false,
          attempts: 0,
        });
      });
    });

    if (recovered.length > 0) {
      addWrongAnswers(recovered);
    }
  }, [addWrongAnswers, data.memoryStatus, examQuestionById, examQuestions, questions, wrongAnswers]);

  // Enrich wrong answers with question data
  const enrichedWrongAnswers = useMemo(() => {
    return wrongAnswers
      .map((wa) => {
        const q = getById(wa.questionId)
          || examQuestionById.map.get(wa.questionId)
          || examQuestionById.legacyMap.get(wa.questionId);
        if (!q) return null;
        return { wrongAnswer: wa, question: q };
      })
      .filter(Boolean) as { wrongAnswer: typeof wrongAnswers[0]; question: Question }[];
  }, [wrongAnswers, getById, examQuestionById]);

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'single': 0,
      'fill': 0,
      'codeFill': 0,
      'codeFix': 0,
    };
    enrichedWrongAnswers.forEach(({ question }) => {
      counts[question.type] = (counts[question.type] || 0) + 1;
    });
    return counts;
  }, [enrichedWrongAnswers]);

  // Filtered and sorted
  const filteredItems = useMemo(() => {
    let items = [...enrichedWrongAnswers];

    // Type filter
    if (selectedType !== 'all') {
      items = items.filter(({ question }) => question.type === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      items = items.filter(({ wrongAnswer }) =>
        selectedStatus === 'mastered' ? wrongAnswer.isMastered : !wrongAnswer.isMastered
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        ({ question }) =>
          question.content.toLowerCase().includes(q) ||
          question.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    items.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.wrongAnswer.lastWrongAt).getTime() - new Date(a.wrongAnswer.lastWrongAt).getTime();
        case 'count':
          return b.wrongAnswer.wrongCount - a.wrongAnswer.wrongCount;
        case 'difficulty-asc': {
          const order = { easy: 0, medium: 1, hard: 2 };
          return (order[a.question.difficulty] || 0) - (order[b.question.difficulty] || 0);
        }
        case 'difficulty-desc': {
          const order = { easy: 0, medium: 1, hard: 2 };
          return (order[b.question.difficulty] || 0) - (order[a.question.difficulty] || 0);
        }
        default:
          return 0;
      }
    });

    return items;
  }, [enrichedWrongAnswers, selectedType, selectedStatus, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = wrongAnswers.length;
    const mastered = wrongAnswers.filter((w) => w.isMastered).length;
    const unmastered = total - mastered;
    const totalAttempts = wrongAnswers.reduce((sum, w) => sum + w.attempts, 0);
    return { total, mastered, unmastered, totalAttempts };
  }, [wrongAnswers]);

  // Handlers
  const handleToggleSelect = useCallback((questionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(({ wrongAnswer }) => wrongAnswer.questionId)));
    }
  }, [filteredItems, selectedIds.size]);

  const handleBatchMastered = useCallback(() => {
    selectedIds.forEach((id) => markMastered(id));
    setSelectedIds(new Set());
    setBatchMode(false);
  }, [selectedIds, markMastered]);

  const handleBatchRemove = useCallback(() => {
    selectedIds.forEach((id) => removeWrongAnswer(id));
    setSelectedIds(new Set());
    setBatchMode(false);
  }, [selectedIds, removeWrongAnswer]);

  const handleStartRetry = useCallback(() => {
    const toRetry = filteredItems
      .filter(({ wrongAnswer }) => !wrongAnswer.isMastered)
      .map(({ question, wrongAnswer }) => ({
        question,
        lastAnswer: wrongAnswer.userAnswer,
        lastWrongAt: wrongAnswer.lastWrongAt,
        wrongCount: wrongAnswer.wrongCount,
      }));

    if (toRetry.length > 0) {
      setRetryQuestions(toRetry);
      setRetryMode(true);
    }
  }, [filteredItems]);

  const handleRetrySingle = useCallback((questionId: number) => {
    const item = enrichedWrongAnswers.find(({ wrongAnswer }) => wrongAnswer.questionId === questionId);
    if (item) {
      setRetryQuestions([
        {
          question: item.question,
          lastAnswer: item.wrongAnswer.userAnswer,
          lastWrongAt: item.wrongAnswer.lastWrongAt,
          wrongCount: item.wrongAnswer.wrongCount,
        },
      ]);
      setRetryMode(true);
    }
  }, [enrichedWrongAnswers]);

  const handleRetryComplete = useCallback((_results?: { correct: number; wrong: number; mastered: number }) => {
    // _results currently unused; kept in the signature so the parent
    // component (RetrySession) can be extended without touching this handler.
    void _results;
    setRetryMode(false);
    setRetryQuestions([]);
  }, []);

  const handleMarkMastered = useCallback((questionId: number) => {
    const item = enrichedWrongAnswers.find(({ wrongAnswer }) => wrongAnswer.questionId === questionId);
    if (item?.wrongAnswer.isMastered) {
      markNotMastered(questionId);
    } else {
      markMastered(questionId);
    }
  }, [enrichedWrongAnswers, markMastered, markNotMastered]);

  // Retry mode
  if (retryMode) {
    return (
      <RetryMode
        questions={retryQuestions}
        onExit={() => {
          setRetryMode(false);
          setRetryQuestions([]);
        }}
        onComplete={handleRetryComplete}
        onMarkMastered={markMastered}
      />
    );
  }

  // Empty state
  if (wrongAnswers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[60dvh]"
      >
        <div className="bg-pm-bg-card border-b border-pm-border-color">
          <div className="max-w-[1200px] mx-auto px-6 py-8">
            <div className="flex items-center gap-2 text-xs text-pm-text-muted mb-3">
              <span>首页</span>
              <span>&gt;</span>
              <span className="text-pm-primary font-medium">错题本</span>
            </div>
            <h1 className="font-heading text-[36px] font-bold text-pm-text-primary mb-1">
              错题本
            </h1>
            <p className="text-sm text-pm-text-secondary">
              管理你的错题，针对性复习提升
            </p>
          </div>
        </div>
        <EmptyState />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="bg-pm-bg-card border-b border-pm-border-color">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-pm-text-muted mb-3">
            <span>首页</span>
            <span>&gt;</span>
            <span className="text-pm-primary font-medium">错题本</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="font-heading text-[36px] font-bold text-pm-text-primary mb-1"
          >
            错题本
          </motion.h1>
          <p className="text-sm text-pm-text-secondary mb-6">
            管理你的错题，针对性复习提升
          </p>

          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex items-center gap-3 p-4 rounded-pm-lg bg-pm-bg-primary"
            >
              <BookOpen className="w-5 h-5 text-pm-text-primary" />
              <div>
                <div className="font-heading text-xl font-bold text-pm-text-primary">{stats.total}</div>
                <div className="text-xs text-pm-text-muted">总错题</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex items-center gap-3 p-4 rounded-pm-lg bg-pm-error-light"
            >
              <AlertCircle className="w-5 h-5 text-pm-error" />
              <div>
                <div className="font-heading text-xl font-bold text-pm-error">{stats.unmastered}</div>
                <div className="text-xs text-pm-error">待复习</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex items-center gap-3 p-4 rounded-pm-lg bg-pm-success-light"
            >
              <CheckCircle className="w-5 h-5 text-pm-success" />
              <div>
                <div className="font-heading text-xl font-bold text-pm-success">{stats.mastered}</div>
                <div className="text-xs text-pm-success">已掌握</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex items-center gap-3 p-4 rounded-pm-lg bg-pm-primary-light"
            >
              <RotateCcw className="w-5 h-5 text-pm-primary" />
              <div>
                <div className="font-heading text-xl font-bold text-pm-primary">{stats.totalAttempts}</div>
                <div className="text-xs text-pm-primary">累计重刷</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <WrongBookFilters
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        sortBy={sortBy}
        typeCounts={typeCounts}
        onTypeChange={setSelectedType}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
        onStartRetry={handleStartRetry}
        onToggleBatchMode={() => {
          setBatchMode((v) => !v);
          setSelectedIds(new Set());
        }}
        batchMode={batchMode}

      />

      {/* Batch action bar */}
      <AnimatePresence>
        {batchMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-[1200px] mx-auto px-6 pb-3"
          >
            <div className="flex items-center gap-3 p-3 rounded-pm-md bg-pm-primary-light border border-pm-primary/20">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-sm font-medium text-pm-primary hover:underline"
              >
                <CheckSquare className="w-4 h-4" />
                {selectedIds.size === filteredItems.length ? '取消全选' : '全选'}
              </button>
              <span className="text-sm text-pm-text-secondary">
                已选择 <span className="font-semibold text-pm-primary">{selectedIds.size}</span> 题
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleBatchMastered}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-pm-md border border-pm-success text-pm-success text-xs font-medium hover:bg-pm-success-light transition-colors disabled:opacity-30"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  批量标记已掌握
                </button>
                <button
                  onClick={handleBatchRemove}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-pm-md border border-pm-error text-pm-error text-xs font-medium hover:bg-pm-error-light transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  批量删除
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question list */}
      <div className="max-w-[1200px] mx-auto px-6 py-4 pb-16">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-sm text-pm-text-secondary">没有符合条件的错题</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(({ question, wrongAnswer }, index) => (
              <WrongQuestionCard
                key={wrongAnswer.questionId}
                question={question}
                wrongAnswer={wrongAnswer}
                batchMode={batchMode}
                selected={selectedIds.has(wrongAnswer.questionId)}
                onToggleSelect={() => handleToggleSelect(wrongAnswer.questionId)}
                onMarkMastered={() => handleMarkMastered(wrongAnswer.questionId)}
                onRemove={() => removeWrongAnswer(wrongAnswer.questionId)}
                onRetry={() => handleRetrySingle(wrongAnswer.questionId)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
