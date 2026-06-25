import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Lock } from 'lucide-react';
import { useQuestions } from '@/hooks/useQuestions';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useWrongBook } from '@/hooks/useWrongBook';
import { useAuth } from '@/hooks/useAuth';
import type { Question, QuestionType, ExamRecord } from '@/types';
import ExamHeader from '@/components/simexam/ExamHeader';
import ExamSidebar from '@/components/simexam/ExamSidebar';
import QuestionPanel from '@/components/simexam/QuestionPanel';
import BottomNav from '@/components/simexam/BottomNav';
import QuestionPicker from '@/components/simexam/QuestionPicker';
import ExamRules from '@/components/simexam/ExamRules';
import ScoreReport from '@/components/simexam/ScoreReport';
import SubmitConfirm from '@/components/simexam/SubmitConfirm';
import { playNext } from '@/lib/sound';

interface ExamSection {
  type: QuestionType;
  label: string;
  count: number;
  questions: Question[];
}

type ExamPhase = 'rules' | 'in-progress' | 'submitted';
type ActiveTab = 'rules' | 'search' | 'helper';

const SECTION_COUNTS: { type: QuestionType; label: string; count: number }[] = [
  { type: 'single', label: '选择题', count: 32 },
  { type: 'fill', label: '填空题', count: 20 },
  { type: 'codeFix', label: '程序改错', count: 3 },
  { type: 'codeFill', label: '程序填空', count: 5 },
];

const TOTAL_TIME_MINUTES = 120;
const SEAT_NUMBER = '01';

export default function SimExam() {
  const navigate = useNavigate();
  const { questions, loading, getRandomQuestions } = useQuestions();
  const { recordAnswer } = useStudyStats();
  const { addWrongAnswer } = useWrongBook();
  const { authState, getCurrentUser, getUserData, saveUserData } = useAuth();

  const [phase, setPhase] = useState<ExamPhase>('rules');
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('rules');
  const [showPicker, setShowPicker] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_MINUTES * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize exam sections with random questions
  useEffect(() => {
    if (!questions.length || sections.length > 0) return;

    const newSections: ExamSection[] = SECTION_COUNTS.map((cfg) => ({
      type: cfg.type,
      label: cfg.label,
      count: cfg.count,
      questions: getRandomQuestions(cfg.count, cfg.type),
    }));
    setSections(newSections);
  }, [questions, sections.length, getRandomQuestions]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'in-progress') return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Auto-submit on time up
  useEffect(() => {
    if (isTimeUp && phase === 'in-progress') {
      setTimeout(() => handleSubmit(), 2000);
    }
  }, [isTimeUp, phase]);

  const currentSection = sections[activeSectionIdx];
  const currentQuestion = currentSection?.questions[currentQuestionIdx];

  const totalQuestions = useMemo(() => sections.reduce((s, sec) => s + sec.questions.length, 0), [sections]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const sectionAnsweredCount = useMemo(() => {
    if (!currentSection) return 0;
    return currentSection.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;
  }, [currentSection, answers]);

  const globalQuestionNumber = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < activeSectionIdx; i++) {
      offset += sections[i]?.questions.length || 0;
    }
    return offset + currentQuestionIdx + 1;
  }, [activeSectionIdx, currentQuestionIdx, sections]);

  const handleStartExam = useCallback(() => {
    setPhase('in-progress');
    setActiveTab('rules');
  }, []);

  const handleAnswer = useCallback((questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleSwitchSection = useCallback((sectionIdx: number) => {
    if (sectionIdx !== activeSectionIdx) playNext();
    setActiveSectionIdx(sectionIdx);
    setCurrentQuestionIdx(0);
  }, [activeSectionIdx]);

  const handlePrevQuestion = useCallback(() => {
    playNext();
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    } else if (activeSectionIdx > 0) {
      const prevSectionIdx = activeSectionIdx - 1;
      setActiveSectionIdx(prevSectionIdx);
      setCurrentQuestionIdx(sections[prevSectionIdx]?.questions.length - 1 || 0);
    }
  }, [currentQuestionIdx, activeSectionIdx, sections]);

  const handleNextQuestion = useCallback(() => {
    if (!currentSection) return;
    playNext();
    if (currentQuestionIdx < currentSection.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx((prev) => prev + 1);
      setCurrentQuestionIdx(0);
    }
  }, [currentQuestionIdx, currentSection, activeSectionIdx, sections.length]);

  const handleJumpToQuestion = useCallback((sectionIdx: number, questionIdx: number) => {
    if (sectionIdx !== activeSectionIdx || questionIdx !== currentQuestionIdx) playNext();
    setActiveSectionIdx(sectionIdx);
    setCurrentQuestionIdx(questionIdx);
    setShowPicker(false);
  }, [activeSectionIdx, currentQuestionIdx]);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correct = 0;
    const byType: Record<string, { correct: number; total: number }> = {};

    sections.forEach((section) => {
      let sectionCorrect = 0;
      let sectionTotal = 0;

      section.questions.forEach((q) => {
        const ans = answers[q.id];
        if (ans) {
          const correctAnswer = Array.isArray(q.answer) ? q.answer[0] : q.answer;
          // Helper to extract answer letter from formats like 'A. xxx' or 'A'
          const extractLetter = (s: string) => {
            const m = s.trim().match(/^([A-D])[.\s]/i);
            return m ? m[1].toUpperCase() : s.trim().toUpperCase();
          };
          const isCorrect = q.type === 'single'
            ? extractLetter(ans) === extractLetter(correctAnswer)
            : ans.trim().toLowerCase() === correctAnswer.toLowerCase();
          if (isCorrect) {
            correct++;
            sectionCorrect++;
          }
          sectionTotal++;

          recordAnswer(
            {
              questionId: q.id,
              userAnswer: ans,
              isCorrect,
              answeredAt: new Date().toISOString(),
              timeSpent: 0,
            },
            q.type,
            q.category
          );

          if (!isCorrect) {
            addWrongAnswer(q.id, ans, correctAnswer);
          }
        }
      });

      byType[section.type] = { correct: sectionCorrect, total: sectionTotal };
    });

    const totalScore = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    setCorrectCount(correct);
    setScore(totalScore);
    setPhase('submitted');
    setShowSubmitConfirm(false);

    // Save exam record to user data
    const user = getCurrentUser();
    if (user) {
      const userData = getUserData(user.id);
      const examRecord: ExamRecord = {
        id: `exam_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString(),
        score: totalScore,
        totalQuestions,
        correctCount: correct,
        timeSpent: TOTAL_TIME_MINUTES * 60 - timeRemaining,
        byType,
      };
      const updatedExamHistory = [examRecord, ...userData.examHistory];
      saveUserData(user.id, {
        ...userData,
        examHistory: updatedExamHistory,
      });
    }
  }, [sections, answers, totalQuestions, recordAnswer, addWrongAnswer, getCurrentUser, getUserData, saveUserData, timeRemaining]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  }, []);

  // Login check overlay
  if (!authState.isLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F5F5F0]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-pm-xl shadow-pm-xl border border-pm-border p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pm-primary-light flex items-center justify-center">
            <Lock className="w-8 h-8 text-pm-primary" />
          </div>
          <h2 className="text-xl font-bold text-pm-text-primary font-heading mb-2">
            请先登录
          </h2>
          <p className="text-sm text-pm-text-secondary mb-6">
            仿真考试功能需要登录后才能使用。登录后，你的考试成绩将会被保存到个人记录中。
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pm-lg bg-pm-primary text-white font-medium text-sm hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
          >
            <LogIn className="w-4 h-4" />
            去登录
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading || sections.length === 0) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F5F5F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-pm-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-pm-text-secondary">正在加载考试题目...</p>
        </div>
      </div>
    );
  }

  if (phase === 'submitted') {
    return (
      <ScoreReport
        score={score}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        sections={sections}
        answers={answers}
        timeSpent={TOTAL_TIME_MINUTES * 60 - timeRemaining}
        onRestart={() => {
          setPhase('rules');
          setAnswers({});
          setTimeRemaining(TOTAL_TIME_MINUTES * 60);
          setIsTimeUp(false);
          setActiveSectionIdx(0);
          setCurrentQuestionIdx(0);
          setSections([]);
        }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      {/* 1. Top Title Bar */}
      <ExamHeader
        seatNumber={SEAT_NUMBER}
        studentId={authState.user?.studentId}
        studentName={authState.user?.name}
      />

      {/* 2. Top Info Bar */}
      <div className="h-[42px] bg-white border-b border-[#D4D4D4] flex items-center px-0 shrink-0">
        {/* Left Tabs */}
        <div className="flex items-center h-full">
          {(['rules', 'search', 'helper'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-full px-4 text-[13px] transition-colors ${
                activeTab === tab
                  ? 'bg-[#E8E8E8] text-pm-text-primary font-medium'
                  : 'bg-white text-pm-text-secondary hover:bg-[#F5F5F0]'
              }`}
            >
              {tab === 'rules' && '须知'}
              {tab === 'search' && '查询'}
              {tab === 'helper' && '考试助手'}
            </button>
          ))}
        </div>

        {/* Center: Question Type Info */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[13px] text-pm-text-primary">
            {currentSection?.label}(共{currentSection?.count}题)
            {' '}
            <span className="text-pm-text-secondary">已答：{sectionAnsweredCount}</span>
            {' '}
            <span className="text-pm-text-muted">{currentQuestionIdx + 1}/{currentSection?.questions.length}</span>
          </span>
        </div>

        {/* Right: Countdown */}
        <div className="px-4 flex items-center">
          <span
            className={`text-[15px] font-mono font-semibold ${
              timeRemaining <= 300 ? 'text-[#CC0000] animate-pulse' : 'text-[#CC0000]'
            }`}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3. Left Sidebar */}
        <ExamSidebar
          sections={sections}
          activeSectionIdx={activeSectionIdx}
          answers={answers}
          onSwitchSection={handleSwitchSection}
        />

        {/* 4. Center Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'rules' && phase === 'rules' ? (
            <ExamRules onStart={handleStartExam} />
          ) : activeTab === 'rules' && phase === 'in-progress' ? (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {currentQuestion && (
                    <QuestionPanel
                      key={`${activeSectionIdx}-${currentQuestionIdx}`}
                      question={currentQuestion}
                      globalNumber={globalQuestionNumber}
                      answer={answers[currentQuestion.id] || ''}
                      onAnswer={handleAnswer}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* 5. Bottom Navigation */}
              <BottomNav
                onPrev={handlePrevQuestion}
                onNext={handleNextQuestion}
                onPicker={() => setShowPicker(true)}
                onSubmit={() => setShowSubmitConfirm(true)}
                hasPrev={globalQuestionNumber > 1}
                hasNext={globalQuestionNumber < totalQuestions}
              />
            </>
          ) : activeTab === 'search' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-pm-text-muted text-sm">请输入关键词查询题目</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-pm-text-muted text-sm">考试助手功能</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Question Picker Overlay */}
      <AnimatePresence>
        {showPicker && (
          <QuestionPicker
            sections={sections}
            activeSectionIdx={activeSectionIdx}
            activeQuestionIdx={currentQuestionIdx}
            answers={answers}
            onClose={() => setShowPicker(false)}
            onJump={handleJumpToQuestion}
          />
        )}
      </AnimatePresence>

      {/* Submit Confirmation */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <SubmitConfirm
            totalQuestions={totalQuestions}
            answeredCount={answeredCount}
            onCancel={() => setShowSubmitConfirm(false)}
            onConfirm={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* Time's Up Overlay */}
      <AnimatePresence>
        {isTimeUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
              className="bg-white rounded-lg p-8 flex flex-col items-center shadow-xl"
            >
              <div className="text-[#CC0000] text-5xl font-bold mb-2">时间到</div>
              <p className="text-pm-text-secondary mb-4">考试时间已结束，正在自动交卷...</p>
              <div className="w-8 h-8 border-2 border-pm-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
