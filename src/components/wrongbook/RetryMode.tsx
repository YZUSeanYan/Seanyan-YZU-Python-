import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { Question } from '@/types';
import QuestionCard from '@/components/practice/QuestionCard';
import ExplanationPanel from '@/components/practice/ExplanationPanel';
import { isQuestionAnswerCorrect } from '@/lib/answerCheck';
import { playErrorBuzz, playFinish, playNext, playSelect, playSuccessChime } from '@/lib/sound';

interface RetryQuestion {
  question: Question;
  lastAnswer: string;
  lastWrongAt: string;
  wrongCount: number;
}

interface RetryModeProps {
  questions: RetryQuestion[];
  onExit: () => void;
  onComplete: (results: { correct: number; wrong: number; mastered: number }) => void;
  onMarkMastered: (questionId: number) => void;
}

export default function RetryMode({
  questions,
  onExit,
  onComplete,
  onMarkMastered,
}: RetryModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [showComplete, setShowComplete] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());

  const current = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  const handleSelectAnswer = useCallback((answer: string) => {
    if (!submitted) {
      playSelect();
      setSelectedAnswer(answer);
    }
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (!current || !selectedAnswer) return;

    const isCorrect = isQuestionAnswerCorrect(current.question, selectedAnswer);
    if (isCorrect) {
      playSuccessChime();
    } else {
      playErrorBuzz();
    }

    setSubmitted(true);
    setResults((prev) => ({ ...prev, [currentIndex]: isCorrect }));

    if (isCorrect) {
      setMasteredIds((prev) => new Set(prev).add(current.question.id));
      onMarkMastered(current.question.id);
    }
  }, [current, selectedAnswer, currentIndex, onMarkMastered]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      playNext();
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    } else {
      playFinish();
      // Complete
      const c = Object.values(results).filter(Boolean).length;
      const answeredCount = Object.keys(results).length;

      onComplete({
        correct: c,
        wrong: answeredCount - c,
        mastered: masteredIds.size,
      });
      setShowComplete(true);
    }
  }, [currentIndex, total, results, onComplete, masteredIds]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      playNext();
      setCurrentIndex((i) => i - 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    playNext();
    setResults((prev) => ({ ...prev, [currentIndex]: false }));
    setSubmitted(true);
  }, [currentIndex]);

  const handleFinishEarly = useCallback(() => {
    playFinish();
    const c = Object.values(results).filter(Boolean).length;
    const answeredCount = Object.keys(results).length;
    onComplete({
      correct: c,
      wrong: answeredCount - c,
      mastered: masteredIds.size,
    });
    setShowComplete(true);
  }, [results, onComplete, masteredIds]);

  if (!current) return null;

  const isCorrect = results[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-[100dvh] bg-pm-bg-primary"
    >
      {/* Retry header */}
      <div className="bg-pm-bg-card border-b border-pm-border-color">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 min-h-14 flex flex-wrap items-center justify-between gap-2 py-2 sm:py-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onExit}
              className="flex items-center gap-1 text-sm text-pm-text-secondary hover:text-pm-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              返回错题本
            </button>
            <h2 className="hidden sm:block font-heading text-lg font-semibold text-pm-text-primary">错题重刷</h2>
            <span className="text-sm text-pm-text-secondary">
              第 {currentIndex + 1} / {total} 题
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Progress bar */}
            <div className="w-[200px] hidden sm:block">
              <div className="h-2 rounded-full bg-pm-bg-primary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-pm-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                />
              </div>
            </div>
            <button
              onClick={handleFinishEarly}
              className="text-sm text-pm-error hover:bg-pm-error-light px-3 py-1.5 rounded-pm-md transition-colors"
            >
              放弃重刷
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-28">
        {/* Previous wrong hint */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-pm-md bg-pm-error-light border border-pm-error/20"
        >
          <div className="flex items-center gap-2 text-sm text-pm-error">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              这是你在 <span className="font-medium">{new Date(current.lastWrongAt).toLocaleDateString('zh-CN')}</span> 答错的题目
              {current.lastAnswer && (
                <span>，上次答案：<span className="font-medium">{current.lastAnswer}</span></span>
              )}
              {current.wrongCount > 1 && <span>（累计答错 {current.wrongCount} 次）</span>}
            </span>
          </div>
        </motion.div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.question.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <QuestionCard
              question={current.question}
              selectedAnswer={selectedAnswer}
              submitted={submitted}
              onSelectAnswer={handleSelectAnswer}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
            />
          </motion.div>
        </AnimatePresence>

        {/* Retry result feedback */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              {isCorrect ? (
                <div className="p-4 rounded-pm-md bg-pm-success-light border border-pm-success/20 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-pm-success shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-pm-success">这次答对了！</p>
                    <p className="text-xs text-pm-success/80">题目已自动标记为"已掌握"</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-pm-md bg-pm-error-light border border-pm-error/20 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-pm-error shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-pm-error">还是错了，再仔细看看解析吧</p>
                    <p className="text-xs text-pm-error/80">答错次数 +1</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation (auto-expand on submit) */}
        <AnimatePresence>
          {submitted && (
            <ExplanationPanel
              question={current.question}
              isCorrect={isCorrect || false}
              userAnswer={selectedAnswer}
              onNext={handleNext}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <motion.div
        initial={{ y: 64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="fixed bottom-0 left-0 right-0 min-h-14 sm:h-16 bg-pm-bg-card border-t border-pm-border-color z-40"
        style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.04)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-[800px] mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-pm-md text-xs sm:text-sm font-medium text-pm-text-secondary hover:bg-pm-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-friendly"
            >
              <ChevronLeft className="w-4 h-4" />
              上一题
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === total - 1 && !submitted}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-pm-md text-xs sm:text-sm font-medium text-pm-text-secondary hover:bg-pm-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-friendly"
            >
              下一题
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-pm-text-secondary">
            {currentIndex + 1} / {total}
          </span>

          <button
            onClick={handleFinishEarly}
            className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-pm-md text-xs sm:text-sm font-medium text-pm-error hover:bg-pm-error-light transition-colors touch-friendly"
          >
            <LogOut className="w-4 h-4" />
            结束重刷
          </button>
        </div>
      </motion.div>

      {/* Completion modal */}
      <AnimatePresence>
        {showComplete && (
          <RetryCompleteModal
            total={total}
            correct={Object.values(results).filter(Boolean).length}
            wrong={Object.values(results).filter((r) => !r).length}
            mastered={masteredIds.size}
            onBackToWrongBook={onExit}
            onGoPractice={() => { onExit(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Retry Complete Modal ----

interface RetryCompleteModalProps {
  total: number;
  correct: number;
  wrong?: number;
  mastered: number;
  onBackToWrongBook: () => void;
  onGoPractice: () => void;
}

function RetryCompleteModal({
  total,
  correct,
  wrong: _wrong,
  mastered,
  onBackToWrongBook,
  onGoPractice,
}: RetryCompleteModalProps) {
  void _wrong;
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--pm-bg-overlay)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="bg-pm-bg-card rounded-pm-xl shadow-pm-xl w-full max-w-[440px] overflow-hidden"
      >
        <div className="pt-8 pb-6 px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-pm-accent-light mb-4"
          >
            <CheckCircle className="w-7 h-7 text-pm-accent" />
          </motion.div>
          <h2 className="font-heading text-[24px] font-bold text-pm-text-primary mb-1">
            重刷完成！
          </h2>
          <p className="text-sm text-pm-text-secondary">
            本次重刷 {total} 题，正确率 {rate}%
          </p>
        </div>

        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-pm-lg bg-pm-bg-primary">
              <div className="font-heading text-xl font-bold text-pm-text-primary">{total}</div>
              <div className="text-xs text-pm-text-muted">重刷题数</div>
            </div>
            <div className="text-center p-3 rounded-pm-lg bg-pm-success-light">
              <div className="font-heading text-xl font-bold text-pm-success">{correct}</div>
              <div className="text-xs text-pm-success">重刷正确</div>
            </div>
            <div className="text-center p-3 rounded-pm-lg bg-pm-accent-light">
              <div className="font-heading text-xl font-bold text-pm-accent">{mastered}</div>
              <div className="text-xs text-pm-accent">新掌握</div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 space-y-2">
          <button
            onClick={onBackToWrongBook}
            className="w-full px-4 py-3 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
          >
            返回错题本
          </button>
          <button
            onClick={onGoPractice}
            className="w-full px-4 py-3 rounded-pm-md border border-pm-border-color text-pm-text-secondary text-sm font-medium hover:bg-pm-bg-primary transition-colors"
          >
            继续练习
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
