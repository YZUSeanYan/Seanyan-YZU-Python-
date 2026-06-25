import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  ArrowRight,
  Check,
  X,
  HelpCircle,
  RotateCcw,
  GraduationCap,
  Trophy,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import type { Question, QuestionType } from '@/types';
import { useQuestions } from '@/hooks/useQuestions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWrongBook } from '@/hooks/useWrongBook';
import { useStudyStats } from '@/hooks/useStudyStats';
import FlashCard from '@/components/memory/FlashCard';

// ---- Types ----
type Phase = 'setup' | 'study' | 'result';

export type MemoryStatus = 'unmarked' | 'remembered' | 'forgotten' | 'uncertain';

interface MemorySession {
  id: string;
  date: string;
  totalQuestions: number;
  remembered: number;
  forgotten: number;
  uncertain: number;
  elapsedSeconds: number;
}

interface MemoryStatusMap {
  [questionId: number]: MemoryStatus;
}

// ---- Helpers ----
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const allTypes: { key: QuestionType; label: string }[] = [
  { key: 'single', label: '单选题' },
  { key: 'fill', label: '填空题' },
  { key: 'codeFill', label: '程序填空' },
  { key: 'codeFix', label: '程序改错' },
];

const countOptions = [
  { value: 20, label: '20题' },
  { value: 40, label: '40题' },
  { value: -1, label: '全部' },
];

const statusColors: Record<MemoryStatus, string> = {
  unmarked: '#CBD5E1',
  remembered: '#27AE60',
  forgotten: '#E74C3C',
  uncertain: '#E9A23B',
};

const statusLabels: Record<MemoryStatus, string> = {
  unmarked: '未答',
  remembered: '已会',
  forgotten: '不会',
  uncertain: '模糊',
};

// ====== Setup Page Component ======
function SetupPage({
  typeCounts,
  onStart,
}: {
  typeCounts: Record<QuestionType, number>;
  onStart: (config: {
    selectedTypes: QuestionType[];
    questionCount: number;
    shuffle: boolean;
  }) => void;
}) {
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'single',
    'fill',
    'codeFill',
    'codeFix',
  ]);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [shuffle, setShuffle] = useState<boolean>(true);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const estimatedCount = useMemo(() => {
    let total = 0;
    for (const t of selectedTypes) {
      total += typeCounts[t] || 0;
    }
    if (questionCount > 0) {
      return Math.min(questionCount, total);
    }
    return total;
  }, [selectedTypes, questionCount, typeCounts]);

  const handleStart = () => {
    onStart({
      selectedTypes,
      questionCount: questionCount > 0 ? questionCount : estimatedCount,
      shuffle,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="max-w-[520px] mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-pm-primary-light mb-3">
          <Brain className="w-7 h-7 text-pm-primary" />
        </div>
        <h1 className="text-[28px] font-bold text-pm-text-primary mb-1">背题模式</h1>
        <p className="text-pm-text-secondary text-sm">翻转卡片，自评掌握程度</p>
      </div>

      {/* Setup Card */}
      <div className="bg-pm-bg-card rounded-xl shadow-md p-6 space-y-6">
        {/* Question Types */}
        <div>
          <h3 className="text-sm font-semibold text-pm-text-primary mb-3">选择题型</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {allTypes.map((t) => {
              const isSelected = selectedTypes.includes(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => toggleType(t.key)}
                  className="relative flex flex-col items-start p-3.5 rounded-lg border-2 transition-all duration-200"
                  style={{
                    borderColor: isSelected ? 'var(--pm-primary)' : 'var(--pm-border)',
                    background: isSelected ? 'var(--pm-primary-light)' : 'var(--pm-bg-card)',
                  }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: isSelected ? 'var(--pm-primary)' : 'var(--pm-text-primary)',
                    }}
                  >
                    {t.label}
                  </span>
                  <span className="text-xs text-pm-text-muted mt-0.5">
                    {typeCounts[t.key] || 0} 题
                  </span>
                  {isSelected && (
                    <motion.div
                      layoutId="type-check"
                      className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pm-primary flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count */}
        <div>
          <h3 className="text-sm font-semibold text-pm-text-primary mb-3">题目数量</h3>
          <div className="flex gap-2">
            {countOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setQuestionCount(opt.value)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background:
                    questionCount === opt.value
                      ? 'var(--pm-primary)'
                      : 'var(--pm-bg-primary)',
                  color:
                    questionCount === opt.value
                      ? 'var(--pm-text-inverse)'
                      : 'var(--pm-text-primary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order toggle - inline, compact */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-pm-text-secondary">题目顺序</span>
          <div className="flex items-center gap-1.5 bg-pm-bg-primary rounded-lg p-0.5">
            <button
              onClick={() => setShuffle(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: !shuffle ? 'var(--pm-bg-card)' : 'transparent',
                color: !shuffle ? 'var(--pm-primary)' : 'var(--pm-text-muted)',
                boxShadow: !shuffle ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              顺序
            </button>
            <button
              onClick={() => setShuffle(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: shuffle ? 'var(--pm-bg-card)' : 'transparent',
                color: shuffle ? 'var(--pm-primary)' : 'var(--pm-text-muted)',
                boxShadow: shuffle ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              随机
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-pm-border" />

        {/* Estimation + Start Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-pm-text-secondary">
            预计 <span className="font-semibold text-pm-text-primary">{estimatedCount}</span> 题
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-pm-primary text-white font-semibold text-sm shadow-md hover:bg-pm-primary-hover transition-colors"
          >
            开始背题
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="text-center mt-6">
        <p className="text-xs text-pm-text-muted">
          快捷键：空格翻转 · 1/2/3 标记 · ← → 切换
        </p>
      </div>
    </motion.div>
  );
}

// ====== Study Page Component ======
function StudyPage({
  questions,
  onComplete,
}: {
  questions: Question[];
  onComplete: (statuses: MemoryStatus[], elapsedSeconds: number) => void;
}) {
  const { addWrongAnswer } = useWrongBook();
  const [, setMemoryStatus] = useLocalStorage<MemoryStatusMap>('pymaster_memory_status', {});

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [statuses, setStatuses] = useState<MemoryStatus[]>(
    () => new Array(questions.length).fill('unmarked')
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const currentStatus = statuses[currentIndex];
  const allMarked = statuses.every((s) => s !== 'unmarked');
  const markedCount = statuses.filter((s) => s !== 'unmarked').length;

  // Persist status to localStorage & wrong book
  const persistStatus = useCallback(
    (question: Question, status: MemoryStatus) => {
      setMemoryStatus((prev) => ({ ...prev, [question.id]: status }));
      // Add to wrong book if forgotten
      if (status === 'forgotten') {
        const correctAnswer = Array.isArray(question.answer)
          ? question.answer[0]
          : question.answer;
        addWrongAnswer(question.id, '(背题-未掌握)', correctAnswer);
      }
    },
    [setMemoryStatus, addWrongAnswer]
  );

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < total) {
        setCurrentIndex(index);
        setIsFlipped(false);
      }
    },
    [total]
  );

  const handleMark = useCallback(
    (status: MemoryStatus) => {
      if (!currentQuestion) return;

      // Update status
      setStatuses((prev) => {
        const next = [...prev];
        next[currentIndex] = status;
        return next;
      });

      // Persist
      persistStatus(currentQuestion, status);

      // Auto advance to next question
      if (currentIndex < total - 1) {
        setTimeout(() => {
          setCurrentIndex((i) => i + 1);
          setIsFlipped(false);
        }, 250);
      } else {
        // Last question - check if all marked then complete
        setTimeout(() => {
          setStatuses((prev) => {
            const next = [...prev];
            next[currentIndex] = status;
            const allDone = next.every((s) => s !== 'unmarked');
            if (allDone) {
              // Defer completion to avoid state update during render
              setTimeout(() => onComplete(next, elapsedSeconds), 100);
            }
            return next;
          });
        }, 250);
      }
    },
    [currentIndex, currentQuestion, total, persistStatus, onComplete, elapsedSeconds]
  );

  const handleFinishEarly = useCallback(() => {
    onComplete(statuses, elapsedSeconds);
  }, [onComplete, statuses, elapsedSeconds]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleFlip();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToIndex(currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isFlipped) {
            goToIndex(currentIndex + 1);
          }
          break;
        case '1':
          e.preventDefault();
          if (isFlipped) handleMark('forgotten');
          break;
        case '2':
          e.preventDefault();
          if (isFlipped) handleMark('uncertain');
          break;
        case '3':
          e.preventDefault();
          if (isFlipped) handleMark('remembered');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, goToIndex, handleMark, isFlipped, currentIndex]);

  if (!currentQuestion) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-pm-bg-primary">
      {/* ---- Top Bar: Progress + Timer ---- */}
      <div className="shrink-0 bg-pm-bg-card border-b border-pm-border px-4 py-3">
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-pm-text-muted">
              已背 <span className="font-semibold text-pm-primary">{markedCount}</span> / {total} 题
            </span>
            <div className="flex items-center gap-1 text-xs text-pm-text-muted">
              <Clock className="w-3 h-3" />
              {formatTime(elapsedSeconds)}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-pm-bg-primary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-pm-primary"
              initial={false}
              animate={{ width: `${(markedCount / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* ---- Main Content: Flash Card ---- */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
        <div className="w-full max-w-[640px]">
          {/* Current index indicator */}
          <div className="text-center mb-3">
            <span className="text-sm text-pm-text-muted">
              第 {currentIndex + 1} / {total} 题
            </span>
          </div>

          {/* Flash Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <FlashCard
                question={currentQuestion}
                index={currentIndex}
                total={total}
                isFlipped={isFlipped}
                onFlip={handleFlip}
              />
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons (only visible after flip) */}
          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, delay: 0.15 }}
                className="flex items-center justify-center gap-3 mt-5"
              >
                {/* 不会 */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleMark('forgotten')}
                  className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor:
                      currentStatus === 'forgotten'
                        ? 'var(--pm-error)'
                        : 'transparent',
                    background:
                      currentStatus === 'forgotten'
                        ? 'var(--pm-error-light)'
                        : '#FDEDEC',
                    boxShadow:
                      currentStatus === 'forgotten'
                        ? '0 4px 16px rgba(231,76,60,0.25)'
                        : '0 2px 8px rgba(231,76,60,0.12)',
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-pm-error flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-pm-error">不会</span>
                  <span className="text-[10px] text-pm-text-muted font-mono">1</span>
                </motion.button>

                {/* 模糊 */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleMark('uncertain')}
                  className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor:
                      currentStatus === 'uncertain'
                        ? 'var(--pm-orange)'
                        : 'transparent',
                    background:
                      currentStatus === 'uncertain'
                        ? 'var(--pm-orange-light)'
                        : '#FDF3E0',
                    boxShadow:
                      currentStatus === 'uncertain'
                        ? '0 4px 16px rgba(233,162,59,0.25)'
                        : '0 2px 8px rgba(233,162,59,0.12)',
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-pm-orange flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-pm-orange">模糊</span>
                  <span className="text-[10px] text-pm-text-muted font-mono">2</span>
                </motion.button>

                {/* 已会 */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleMark('remembered')}
                  className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor:
                      currentStatus === 'remembered'
                        ? 'var(--pm-success)'
                        : 'transparent',
                    background:
                      currentStatus === 'remembered'
                        ? 'var(--pm-success-light)'
                        : '#E8F8EF',
                    boxShadow:
                      currentStatus === 'remembered'
                        ? '0 4px 16px rgba(39,174,96,0.25)'
                        : '0 2px 8px rgba(39,174,96,0.12)',
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-pm-success flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-pm-success">已会</span>
                  <span className="text-[10px] text-pm-text-muted font-mono">3</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flip prompt (shown when not flipped) */}
          {!isFlipped && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-5"
            >
              <span className="text-xs text-pm-text-muted">
                点击卡片或按 <kbd className="px-1.5 py-0.5 bg-pm-bg-card rounded text-xs font-mono border border-pm-border">空格</kbd> 查看答案
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ---- Bottom: Thumbnail Dots + Navigation ---- */}
      <div className="shrink-0 bg-pm-bg-card border-t border-pm-border px-4 py-3">
        <div className="max-w-[640px] mx-auto">
          {/* Thumbnail dots */}
          <div className="flex gap-1 justify-center flex-wrap mb-2">
            {questions.map((_, i) => {
              const status = statuses[i];
              const isActive = i === currentIndex;
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => goToIndex(i)}
                  className="relative shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold transition-all"
                  style={{
                    background: isActive
                      ? statusColors[status]
                      : `${statusColors[status]}40`,
                    color: isActive ? '#FFFFFF' : statusColors[status],
                    border: isActive
                      ? `2px solid ${statusColors[status]}`
                      : `2px solid ${statusColors[status]}30`,
                    boxShadow: isActive
                      ? `0 2px 6px ${statusColors[status]}50`
                      : 'none',
                  }}
                  title={`第${i + 1}题 - ${statusLabels[status]}`}
                >
                  {i + 1}
                </motion.button>
              );
            })}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => goToIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-md text-xs text-pm-text-secondary hover:bg-pm-bg-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← 上一题
            </button>

            {/* Legend */}
            <div className="flex items-center gap-3">
              {(
                [
                  ['remembered', '已会'],
                  ['uncertain', '模糊'],
                  ['forgotten', '不会'],
                  ['unmarked', '未答'],
                ] as [MemoryStatus, string][]
              ).map(([s, label]) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: statusColors[s] }}
                  />
                  <span className="text-[10px] text-pm-text-muted">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {allMarked && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinishEarly}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-pm-primary text-white hover:bg-pm-primary-hover transition-colors"
                >
                  完成背题
                </motion.button>
              )}
              <button
                onClick={() => goToIndex(currentIndex + 1)}
                disabled={currentIndex === total - 1}
                className="px-3 py-1.5 rounded-md text-xs text-pm-text-secondary hover:bg-pm-bg-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                下一题 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====== Result Page Component ======
function ResultPage({
  total,
  statuses,
  elapsedSeconds,
  onRestart,
  onRetryForgotten,
  onGoPractice,
}: {
  total: number;
  statuses: MemoryStatus[];
  elapsedSeconds: number;
  onRestart: () => void;
  onRetryForgotten: () => void;
  onGoPractice: () => void;
}) {
  const remembered = statuses.filter((s) => s === 'remembered').length;
  const forgotten = statuses.filter((s) => s === 'forgotten').length;
  const uncertain = statuses.filter((s) => s === 'uncertain').length;
  const hasForgotten = forgotten > 0;

  const statCards = [
    {
      label: '已掌握',
      value: remembered,
      icon: CheckCircle2,
      color: '#27AE60',
      bgColor: '#E8F8EF',
    },
    {
      label: '需复习',
      value: uncertain,
      icon: HelpCircle,
      color: '#E9A23B',
      bgColor: '#FDF3E0',
    },
    {
      label: '未掌握',
      value: forgotten,
      icon: X,
      color: '#E74C3C',
      bgColor: '#FDEDEC',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="max-w-[560px] mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pm-accent-light mb-3"
        >
          <Trophy className="w-8 h-8 text-pm-accent" />
        </motion.div>
        <h1 className="text-[28px] font-bold text-pm-text-primary mb-1">背题完成</h1>
        <p className="text-pm-text-secondary text-sm">
          用时 {formatTime(elapsedSeconds)} · 共 {total} 题
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                delay: 0.2 + i * 0.08,
              }}
              className="bg-pm-bg-card rounded-xl shadow-md p-4 text-center"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ background: card.bgColor }}
              >
                <Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="text-2xl font-bold"
                style={{ color: card.color }}
              >
                {card.value}
              </motion.div>
              <span className="text-xs text-pm-text-secondary">{card.label}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Distribution bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-pm-bg-card rounded-xl shadow-md p-4 mb-6"
      >
        <div className="flex h-3 rounded-full overflow-hidden">
          {remembered > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (remembered / total) * 100 : 0}%` }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="h-full bg-pm-success"
            />
          )}
          {uncertain > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (uncertain / total) * 100 : 0}%` }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="h-full bg-pm-orange"
            />
          )}
          {forgotten > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (forgotten / total) * 100 : 0}%` }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="h-full bg-pm-error"
            />
          )}
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pm-success" />
            <span className="text-xs text-pm-text-muted">
              已掌握 {Math.round(total > 0 ? (remembered / total) * 100 : 0)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pm-orange" />
            <span className="text-xs text-pm-text-muted">
              需复习 {Math.round(total > 0 ? (uncertain / total) * 100 : 0)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pm-error" />
            <span className="text-xs text-pm-text-muted">
              未掌握 {Math.round(total > 0 ? (forgotten / total) * 100 : 0)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        {hasForgotten && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetryForgotten}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pm-error text-white font-semibold text-sm shadow-md hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" />
            重背不会的题 ({forgotten}题)
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pm-primary text-white font-semibold text-sm shadow-md hover:bg-pm-primary-hover transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          再背一轮
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoPractice}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pm-bg-card border-2 border-pm-primary text-pm-primary font-semibold text-sm hover:bg-pm-primary-light transition-colors"
        >
          <GraduationCap className="w-4 h-4" />
          去练习
        </motion.button>
      </div>
    </motion.div>
  );
}

// ====== Main Component ======
export default function MemoryMode() {
  const navigate = useNavigate();
  const { questions, loading, typeCounts } = useQuestions();
  const { recordAnswer } = useStudyStats();
  void recordAnswer;

  // Persistent storage
  const [, setMemoryStatus] = useLocalStorage<MemoryStatusMap>('pymaster_memory_status', {});
  const [, setMemorySessions] = useLocalStorage<MemorySession[]>('pymaster_memory_sessions', []);

  // Phase & data
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [finalStatuses, setFinalStatuses] = useState<MemoryStatus[]>([]);
  const [finalElapsedSeconds, setFinalElapsedSeconds] = useState(0);

  // ---- Start study ----
  const handleStart = useCallback(
    (config: {
      selectedTypes: QuestionType[];
      questionCount: number;
      shuffle: boolean;
    }) => {
      let pool = questions.filter((q) => config.selectedTypes.includes(q.type));
      if (config.shuffle) {
        pool = shuffleArray(pool);
      }
      const final = pool.slice(0, Math.min(config.questionCount, pool.length));

      setSelectedQuestions(final);
      setFinalStatuses([]);
      setFinalElapsedSeconds(0);
      setPhase('study');
    },
    [questions]
  );

  // ---- Complete study ----
  const handleComplete = useCallback(
    (statuses: MemoryStatus[], elapsedSeconds: number) => {
      setFinalStatuses(statuses);
      setFinalElapsedSeconds(elapsedSeconds);
      setPhase('result');

      // Save session
      const remembered = statuses.filter((s) => s === 'remembered').length;
      const forgotten = statuses.filter((s) => s === 'forgotten').length;
      const uncertain = statuses.filter((s) => s === 'uncertain').length;

      const session: MemorySession = {
        id: generateId(),
        date: new Date().toISOString(),
        totalQuestions: statuses.length,
        remembered,
        forgotten,
        uncertain,
        elapsedSeconds,
      };

      setMemorySessions((prev) => [session, ...prev].slice(0, 50));

      // Persist all statuses
      setMemoryStatus((prev) => {
        const next = { ...prev };
        selectedQuestions.forEach((q, i) => {
          next[q.id] = statuses[i];
        });
        return next;
      });
    },
    [selectedQuestions, setMemorySessions, setMemoryStatus]
  );

  // ---- Restart ----
  const handleRestart = useCallback(() => {
    setPhase('setup');
    setSelectedQuestions([]);
    setFinalStatuses([]);
    setFinalElapsedSeconds(0);
  }, []);

  // ---- Retry forgotten questions ----
  const handleRetryForgotten = useCallback(() => {
    const forgottenQuestions = selectedQuestions.filter(
      (_, i) => finalStatuses[i] === 'forgotten'
    );
    if (forgottenQuestions.length > 0) {
      setSelectedQuestions(shuffleArray(forgottenQuestions));
      setFinalStatuses([]);
      setFinalElapsedSeconds(0);
      setPhase('study');
    }
  }, [selectedQuestions, finalStatuses]);

  // ---- Go practice ----
  const handleGoPractice = useCallback(() => {
    navigate('/practice');
  }, [navigate]);

  // ---- Loading ----
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-pm-text-muted text-sm">加载题库中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-pm-bg-primary">
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SetupPage typeCounts={typeCounts} onStart={handleStart} />
          </motion.div>
        )}

        {phase === 'study' && (
          <motion.div
            key="study"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <StudyPage questions={selectedQuestions} onComplete={handleComplete} />
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ResultPage
              total={selectedQuestions.length}
              statuses={finalStatuses}
              elapsedSeconds={finalElapsedSeconds}
              onRestart={handleRestart}
              onRetryForgotten={handleRetryForgotten}
              onGoPractice={handleGoPractice}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
