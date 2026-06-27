import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { QuestionType, Difficulty } from '@/types';
import { useQuestions } from '@/hooks/useQuestions';
import { useExamPapers } from '@/hooks/useExamPapers';
import { useWrongBook } from '@/hooks/useWrongBook';
import { useStudyStats } from '@/hooks/useStudyStats';
import FilterPanel from '@/components/practice/FilterPanel';
import QuestionCard from '@/components/practice/QuestionCard';
import ExplanationPanel from '@/components/practice/ExplanationPanel';
import QuestionNavigator from '@/components/practice/QuestionNavigator';
import BottomNav from '@/components/practice/BottomNav';
import PracticeResult from '@/components/practice/PracticeResult';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePracticeProgress, type PracticeProgress } from '@/hooks/usePracticeProgress';
import { isQuestionAnswerCorrect } from '@/lib/answerCheck';
import { playErrorBuzz, playFinish, playNext, playSelect, playSuccessChime } from '@/lib/sound';

type AnswerState = 'unanswered' | 'correct' | 'wrong' | 'skipped';
type PracticeMode = 'all' | 'exam';
const SKIPPED_ANSWER_LABEL = '未作答/跳过';

function scrollToPracticeTop() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export default function Practice({ mode = 'all' }: { mode?: PracticeMode }) {
  const { questions, categories, loading } = useQuestions();
  const { papers, loading: examLoading } = useExamPapers();
  const { addWrongAnswer } = useWrongBook();
  const { recordAnswer } = useStudyStats();
  const isExamMode = mode === 'exam';
  const { save, saveImmediate, getSavedProgress, clearProgress } = usePracticeProgress(isExamMode ? 'practice2' : 'all');
  const hasCheckedResume = useRef(false);
  const hasResumed = useRef(false);
  const isRestoring = useRef(false);

  // Filter states
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Practice states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | null>>({});
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showMobilePicker, setShowMobilePicker] = useState(false);
  const [direction, setDirection] = useState(1);
  const [pendingProgress, setPendingProgress] = useState<PracticeProgress | null>(null);
  const [retryWrongIndices, setRetryWrongIndices] = useState<number[] | null>(null);

  const examQuestions = useMemo(
    () =>
      papers.flatMap((paper) =>
        paper.questions.map((question) => ({
          ...question,
          tags: Array.from(new Set([...(question.tags || []), '三套卷专项', paper.title])),
        }))
      ),
    [papers]
  );

  const questionPool = isExamMode ? examQuestions : questions;
  const isLoading = isExamMode ? examLoading : loading;
  const availableCategories = useMemo(
    () =>
      isExamMode
        ? Array.from(new Set(questionPool.map((question) => question.category).filter(Boolean)))
        : categories,
    [isExamMode, questionPool, categories]
  );

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    let filtered = [...questionPool];

    if (selectedType !== 'all') {
      filtered = filtered.filter((q) => q.type === selectedType);
    }
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((q) => q.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.content.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [questionPool, selectedType, selectedDifficulty, selectedCategory, searchQuery]);

  // Reset token: changes whenever the filter signature changes. Using a
  // primitive-derived object keeps the effect dependency array stable and
  // gives the effect an explicit "this is the input" handle.
  const filterSignature = `${filteredQuestions.length}|${selectedType}|${selectedDifficulty}|${selectedCategory}`;

  // Reset per-question state when the filter changes. The cascade is
  // bounded to a single extra commit and the user cannot observe it
  // because the new question list already matches the new answer state.
  useEffect(() => {
    if (isRestoring.current) return;
    setAnswerStates(new Array(filteredQuestions.length).fill('unanswered'));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setUserAnswers({});
    setResults({});
    setShowResult(false);
    setRetryWrongIndices(null);
  }, [filterSignature, filteredQuestions.length]);

  // Restore saved practice progress once questions and user data are ready.
  // The cascade is intentional: we set pendingProgress first, then the next
  // effect applies it once filteredQuestions is ready.
  useEffect(() => {
    if (isLoading || questionPool.length === 0 || hasCheckedResume.current) return;
    hasCheckedResume.current = true;

    const progress = getSavedProgress();
    if (!progress) {
      hasResumed.current = true;
      return;
    }

    setPendingProgress(progress);
    isRestoring.current = true;
    setSelectedType(progress.filters.type);
    setSelectedDifficulty(progress.filters.difficulty);
    setSelectedCategory(progress.filters.category);
    setSearchQuery(progress.filters.searchQuery || '');
  }, [isLoading, questionPool.length, getSavedProgress]);

  useEffect(() => {
    if (!pendingProgress || filteredQuestions.length === 0) return;

    const restoredIndex = Math.min(
      Math.max(pendingProgress.currentIndex || 0, 0),
      filteredQuestions.length - 1
    );
    const restoredStates = [...(pendingProgress.answerStates || [])];
    while (restoredStates.length < filteredQuestions.length) {
      restoredStates.push('unanswered');
    }

    setAnswerStates(restoredStates.slice(0, filteredQuestions.length));
    setUserAnswers(pendingProgress.userAnswers || {});
    setResults(pendingProgress.results || {});
    setCurrentIndex(restoredIndex);
    setSelectedAnswer(pendingProgress.userAnswers?.[restoredIndex] || null);
    setSubmitted(restoredStates[restoredIndex] !== 'unanswered');
    setShowResult(false);
    setRetryWrongIndices(null);
    setPendingProgress(null);
    isRestoring.current = false;
    hasResumed.current = true;
  }, [pendingProgress, filteredQuestions.length]);

  const currentQuestion = filteredQuestions[currentIndex];

  useEffect(() => {
    if (!hasResumed.current || !currentQuestion || showResult) return;
    save(
      currentQuestion.id,
      currentIndex,
      {
        type: selectedType,
        difficulty: selectedDifficulty,
        category: selectedCategory,
        searchQuery,
        source: isExamMode ? 'practice2' : 'all',
      },
      userAnswers,
      answerStates,
      results
    );
  }, [
    currentQuestion,
    currentIndex,
    selectedType,
    selectedDifficulty,
    selectedCategory,
    searchQuery,
    userAnswers,
    answerStates,
    results,
    showResult,
    save,
    isExamMode,
  ]);

  const handleSelectAnswer = useCallback((answer: string) => {
    if (!submitted) {
      playSelect();
      setSelectedAnswer(answer);
    }
  }, [submitted]);

  const isAnswerCorrect = useCallback((answer: string) => {
    if (!currentQuestion) return false;
    return isQuestionAnswerCorrect(currentQuestion, answer);
  }, [currentQuestion]);

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !selectedAnswer) return;

    const isCorrect = isAnswerCorrect(selectedAnswer);
    if (isCorrect) {
      playSuccessChime();
    } else {
      playErrorBuzz();
    }

    setSubmitted(true);
    setResults((prev) => ({ ...prev, [currentIndex]: isCorrect }));
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: selectedAnswer }));

    setAnswerStates((prev) => {
      const next = [...prev];
      next[currentIndex] = isCorrect ? 'correct' : 'wrong';
      return next;
    });

    // Record stats
    recordAnswer(
      {
        questionId: currentQuestion.id,
        userAnswer: selectedAnswer,
        isCorrect,
        answeredAt: new Date().toISOString(),
        timeSpent: 0,
      },
      currentQuestion.type,
      currentQuestion.category
    );

    // Add to wrong book if incorrect
    if (!isCorrect) {
      addWrongAnswer(
        currentQuestion.id,
        selectedAnswer,
        Array.isArray(currentQuestion.answer)
          ? currentQuestion.answer.join(' | ')
          : currentQuestion.answer
      );
    }
  }, [currentQuestion, selectedAnswer, currentIndex, isAnswerCorrect, recordAnswer, addWrongAnswer]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;
    playNext();
    setAnswerStates((prev) => {
      const next = [...prev];
      next[currentIndex] = 'skipped';
      return next;
    });
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: null }));
    setResults((prev) => ({ ...prev, [currentIndex]: false }));
    recordAnswer(
      {
        questionId: currentQuestion.id,
        userAnswer: SKIPPED_ANSWER_LABEL,
        isCorrect: false,
        answeredAt: new Date().toISOString(),
        timeSpent: 0,
      },
      currentQuestion.type,
      currentQuestion.category
    );
    addWrongAnswer(
      currentQuestion.id,
      SKIPPED_ANSWER_LABEL,
      Array.isArray(currentQuestion.answer)
        ? currentQuestion.answer.join(' | ')
        : currentQuestion.answer
    );

    const retryPosition = retryWrongIndices?.indexOf(currentIndex) ?? -1;
    const nextRetryIndex =
      retryPosition >= 0 && retryWrongIndices && retryPosition < retryWrongIndices.length - 1
        ? retryWrongIndices[retryPosition + 1]
        : null;

    if (nextRetryIndex !== null) {
      setDirection(1);
      setCurrentIndex(nextRetryIndex);
      setSelectedAnswer(null);
      setSubmitted(false);
      scrollToPracticeTop();
    } else if (!retryWrongIndices && currentIndex < filteredQuestions.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      scrollToPracticeTop();
    } else {
      setRetryWrongIndices(null);
      setShowResult(true);
    }
  }, [currentIndex, currentQuestion, filteredQuestions.length, retryWrongIndices, recordAnswer, addWrongAnswer]);

  const handleRevealAnswer = useCallback(() => {
    if (!currentQuestion) return;
    playErrorBuzz();
    setAnswerStates((prev) => {
      const next = [...prev];
      next[currentIndex] = 'skipped';
      return next;
    });
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: null }));
    setResults((prev) => ({ ...prev, [currentIndex]: false }));
    recordAnswer(
      {
        questionId: currentQuestion.id,
        userAnswer: SKIPPED_ANSWER_LABEL,
        isCorrect: false,
        answeredAt: new Date().toISOString(),
        timeSpent: 0,
      },
      currentQuestion.type,
      currentQuestion.category
    );
    addWrongAnswer(
      currentQuestion.id,
      SKIPPED_ANSWER_LABEL,
      Array.isArray(currentQuestion.answer)
        ? currentQuestion.answer.join(' | ')
        : currentQuestion.answer
    );
    setSelectedAnswer(null);
    setSubmitted(true);
    scrollToPracticeTop();
  }, [currentIndex, currentQuestion, recordAnswer, addWrongAnswer]);

  const handleNavigate = useCallback((index: number) => {
    playNext();
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setSelectedAnswer(userAnswers[index] || null);
    setSubmitted(answerStates[index] !== 'unanswered');
    setShowMobilePicker(false);
    scrollToPracticeTop();
  }, [currentIndex, userAnswers, answerStates]);

  const handleNext = useCallback(() => {
    if (retryWrongIndices?.length) {
      const retryPosition = retryWrongIndices.indexOf(currentIndex);
      if (retryPosition >= 0 && retryPosition < retryWrongIndices.length - 1) {
        const nextIndex = retryWrongIndices[retryPosition + 1];
        playNext();
        setDirection(1);
        setCurrentIndex(nextIndex);
        setSelectedAnswer(userAnswers[nextIndex] || null);
        setSubmitted(answerStates[nextIndex] !== 'unanswered');
        scrollToPracticeTop();
      } else {
        setRetryWrongIndices(null);
        setShowResult(true);
      }
      return;
    }

    if (currentIndex < filteredQuestions.length - 1) {
      playNext();
      setDirection(1);
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(userAnswers[currentIndex + 1] || null);
      setSubmitted(answerStates[currentIndex + 1] !== 'unanswered');
      scrollToPracticeTop();
    }
  }, [currentIndex, filteredQuestions.length, userAnswers, answerStates, retryWrongIndices]);

  const handlePrev = useCallback(() => {
    if (retryWrongIndices?.length) {
      const retryPosition = retryWrongIndices.indexOf(currentIndex);
      if (retryPosition > 0) {
        const prevIndex = retryWrongIndices[retryPosition - 1];
        playNext();
        setDirection(-1);
        setCurrentIndex(prevIndex);
        setSelectedAnswer(userAnswers[prevIndex] || null);
        setSubmitted(answerStates[prevIndex] !== 'unanswered');
        scrollToPracticeTop();
      }
      return;
    }

    if (currentIndex > 0) {
      playNext();
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
      setSelectedAnswer(userAnswers[currentIndex - 1] || null);
      setSubmitted(answerStates[currentIndex - 1] !== 'unanswered');
      scrollToPracticeTop();
    }
  }, [currentIndex, userAnswers, answerStates, retryWrongIndices]);

  const handleFinish = useCallback(() => {
    setShowFinishDialog(true);
  }, []);

  const handleConfirmFinish = useCallback(() => {
    playFinish();
    clearProgress();
    setShowFinishDialog(false);
    setRetryWrongIndices(null);
    setShowResult(true);
  }, [clearProgress]);

  const handleRetryWrong = useCallback(() => {
    const wrongIndices = answerStates
      .map((s, i) => (s === 'wrong' || s === 'skipped' ? i : -1))
      .filter((i) => i !== -1);

    if (wrongIndices.length > 0) {
      playNext();
      setRetryWrongIndices(wrongIndices);
      setAnswerStates((prev) => {
        const next = [...prev];
        wrongIndices.forEach((index) => {
          next[index] = 'unanswered';
        });
        return next;
      });
      setUserAnswers((prev) => {
        const next = { ...prev };
        wrongIndices.forEach((index) => {
          delete next[index];
        });
        return next;
      });
      setResults((prev) => {
        const next = { ...prev };
        wrongIndices.forEach((index) => {
          delete next[index];
        });
        return next;
      });
      setCurrentIndex(wrongIndices[0]);
      setSelectedAnswer(null);
      setSubmitted(false);
      setShowResult(false);
      scrollToPracticeTop();
    }
  }, [answerStates]);

  const handleContinue = useCallback(() => {
    if (currentQuestion) {
      saveImmediate(
        currentQuestion.id,
        0,
        {
          type: selectedType,
          difficulty: selectedDifficulty,
          category: selectedCategory,
          searchQuery,
          source: isExamMode ? 'practice2' : 'all',
        },
        {},
        new Array(filteredQuestions.length).fill('unanswered'),
        {}
      );
    }
    setShowResult(false);
    setRetryWrongIndices(null);
    playNext();
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    scrollToPracticeTop();
  }, [currentQuestion, filteredQuestions.length, saveImmediate, searchQuery, selectedCategory, selectedDifficulty, selectedType, isExamMode]);

  const correctCount = answerStates.filter((s) => s === 'correct').length;
  const wrongCount = answerStates.filter((s) => s === 'wrong').length;
  const skippedCount = answerStates.filter((s) => s === 'skipped').length;
  const reviewWrongCount = wrongCount + skippedCount;
  const retryPosition = retryWrongIndices?.indexOf(currentIndex) ?? -1;
  const isRetryingWrong = Boolean(retryWrongIndices?.length && retryPosition >= 0);

  if (isLoading) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-pm-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-pm-text-secondary">加载题目中...</p>
        </div>
      </div>
    );
  }

  if (filteredQuestions.length === 0) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center">
        <p className="text-pm-text-secondary mb-4">没有符合条件的题目</p>
        <button
          onClick={() => {
            setSelectedType('all');
            setSelectedDifficulty('all');
            setSelectedCategory('all');
            setSearchQuery('');
          }}
          className="px-4 py-2 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors"
        >
          重置筛选条件
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Filter header */}
      {isExamMode && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="rounded-pm-lg border border-pm-primary/20 bg-pm-primary-light px-4 py-3">
            <p className="text-sm font-semibold text-pm-primary">练习模式2：三套卷专项练习</p>
            <p className="mt-1 text-xs text-pm-text-secondary">
              当前只包含三套仿真卷题目，适合考前集中刷卷和查漏补缺。
            </p>
          </div>
        </div>
      )}
      <FilterPanel
        selectedType={selectedType}
        selectedDifficulty={selectedDifficulty}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        availableCategories={availableCategories}
        filteredCount={filteredQuestions.length}
        onTypeChange={setSelectedType}
        onDifficultyChange={setSelectedDifficulty}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
      />

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left sidebar - navigator */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-20">
              <QuestionNavigator
                questions={filteredQuestions}
                currentIndex={currentIndex}
                answerStates={answerStates}
                onNavigate={handleNavigate}
              />
            </div>
          </div>

          {/* Right content - question area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait" custom={direction}>
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                >
                  <QuestionCard
                    question={currentQuestion}
                    selectedAnswer={selectedAnswer}
                    submitted={submitted}
                    onSelectAnswer={handleSelectAnswer}
                    onSubmit={handleSubmit}
                    onSkip={handleSkip}
                    onRevealAnswer={handleRevealAnswer}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Explanation panel */}
            <AnimatePresence>
              {submitted && currentQuestion && (
                <ExplanationPanel
                  question={currentQuestion}
                  isCorrect={results[currentIndex] || false}
                  userAnswer={userAnswers[currentIndex] || null}
                  onNext={() => {
                    if (currentIndex < filteredQuestions.length - 1) {
                      handleNext();
                    } else {
                      setShowResult(true);
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <BottomNav
        currentIndex={currentIndex}
        total={filteredQuestions.length}
        hasAnswer={!!selectedAnswer}
        submitted={submitted}
        isFirst={isRetryingWrong ? retryPosition === 0 : currentIndex === 0}
        isLast={isRetryingWrong ? retryPosition === (retryWrongIndices?.length || 0) - 1 : currentIndex === filteredQuestions.length - 1}
        onPrev={handlePrev}
        onNext={handleNext}
        onPicker={() => setShowMobilePicker(true)}
        onFinish={handleFinish}
        onShowResult={() => setShowResult(true)}
      />

      <AnimatePresence>
        {showMobilePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-pm-bg-overlay lg:hidden"
            onClick={() => setShowMobilePicker(false)}
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="absolute inset-x-3 bottom-3 max-h-[78dvh] overflow-y-auto rounded-pm-lg bg-pm-bg-card p-3 shadow-pm-xl"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-sm font-semibold text-pm-text-primary">题卡</p>
                  <p className="text-xs text-pm-text-secondary">点击题号可直接跳转</p>
                </div>
                <button
                  onClick={() => setShowMobilePicker(false)}
                  className="rounded-pm-md px-3 py-2 text-sm font-medium text-pm-text-secondary hover:bg-pm-bg-primary"
                >
                  关闭
                </button>
              </div>
              <QuestionNavigator
                questions={filteredQuestions}
                currentIndex={currentIndex}
                answerStates={answerStates}
                onNavigate={handleNavigate}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>结束练习</AlertDialogTitle>
            <AlertDialogDescription>
              确定要结束当前练习吗？已作答 {answerStates.filter((s) => s !== 'unanswered').length} / {filteredQuestions.length} 题
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续练习</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFinish}>查看报告</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Practice result modal */}
      <AnimatePresence>
        {showResult && (
          <PracticeResult
            total={filteredQuestions.length}
            correct={correctCount}
            wrong={reviewWrongCount}
            skipped={skippedCount}
            onRetryWrong={handleRetryWrong}
            onContinue={handleContinue}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
