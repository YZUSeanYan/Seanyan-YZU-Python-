import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, AlertCircle, CheckCircle, RotateCcw, Trash2, CheckSquare } from 'lucide-react';
import type { QuestionType, Question } from '@/types';
import { useQuestions } from '@/hooks/useQuestions';
import { useWrongBook } from '@/hooks/useWrongBook';
import WrongBookFilters from '@/components/wrongbook/WrongBookFilters';
import WrongQuestionCard from '@/components/wrongbook/WrongQuestionCard';
import EmptyState from '@/components/wrongbook/EmptyState';
import RetryMode from '@/components/wrongbook/RetryMode';

interface RetryQuestion {
  question: Question;
  lastAnswer: string;
  lastWrongAt: string;
  wrongCount: number;
}

export default function WrongBook() {
  const { getById } = useQuestions();
  const {
    wrongAnswers,
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

  // Enrich wrong answers with question data
  const enrichedWrongAnswers = useMemo(() => {
    return wrongAnswers
      .map((wa) => {
        const q = getById(wa.questionId);
        if (!q) return null;
        return { wrongAnswer: wa, question: q };
      })
      .filter(Boolean) as { wrongAnswer: typeof wrongAnswers[0]; question: Question }[];
  }, [wrongAnswers, getById]);

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
      setSelectedIds(new Set(filteredItems.map(({ question }) => question.id)));
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
    const item = enrichedWrongAnswers.find(({ question }) => question.id === questionId);
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
    const item = enrichedWrongAnswers.find(({ question }) => question.id === questionId);
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
                key={question.id}
                question={question}
                wrongAnswer={wrongAnswer}
                batchMode={batchMode}
                selected={selectedIds.has(question.id)}
                onToggleSelect={() => handleToggleSelect(question.id)}
                onMarkMastered={() => handleMarkMastered(question.id)}
                onRemove={() => removeWrongAnswer(question.id)}
                onRetry={() => handleRetrySingle(question.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
