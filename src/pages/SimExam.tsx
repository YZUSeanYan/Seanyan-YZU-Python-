import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, LogIn, Lock, Play } from 'lucide-react';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useWrongBook } from '@/hooks/useWrongBook';
import { useAuth } from '@/hooks/useAuth';
import type { Question, QuestionType, ExamRecord } from '@/types';
import { useExamPapers, type ExamPaper } from '@/hooks/useExamPapers';
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

type ExamPhase = 'select-paper' | 'rules' | 'in-progress' | 'submitted';
type ActiveTab = 'rules' | 'search' | 'helper';

const TOTAL_TIME_MINUTES = 120;
const SEAT_NUMBER = '01';
const typeLabels: Record<QuestionType, string> = {
  single: '选择题',
  fill: '填空题',
  codeFix: '程序改错',
  codeFill: '程序填空',
};
const typeOrder: QuestionType[] = ['single', 'fill', 'codeFix', 'codeFill'];

function buildSections(paper: ExamPaper): ExamSection[] {
  return typeOrder
    .map((type) => {
      const questions = paper.questions.filter((question) => question.type === type);
      return {
        type,
        label: typeLabels[type],
        count: questions.length,
        questions,
      };
    })
    .filter((section) => section.questions.length > 0);
}

function normalizeAnswer(answer: string) {
  const trimmed = answer.trim();
  const match = trimmed.match(/^([A-D])[.\s]?/i);
  return match ? match[1].toUpperCase() : trimmed.toLowerCase();
}

function isQuestionCorrect(question: Question, answer?: string) {
  if (!answer) return false;
  const correctAnswer = Array.isArray(question.answer) ? question.answer : [question.answer];
  if (question.type === 'single') return normalizeAnswer(answer) === normalizeAnswer(String(correctAnswer[0]));
  if (Array.isArray(question.answer)) {
    const answerParts = answer.split('|').map((part) => part.trim().toLowerCase());
    return question.answer.every((part, index) => answerParts[index] === String(part).trim().toLowerCase());
  }
  return answer.trim().toLowerCase() === String(correctAnswer[0]).trim().toLowerCase();
}

export default function SimExam() {
  const navigate = useNavigate();
  const { papers, loading, error } = useExamPapers();
  const { recordAnswer } = useStudyStats();
  const { addWrongAnswer } = useWrongBook();
  const { authState, getCurrentUser, getUserData, saveUserData } = useAuth();

  const [phase, setPhase] = useState<ExamPhase>('select-paper');
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
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

  const handleSelectPaper = useCallback((paper: ExamPaper) => {
    setSelectedPaper(paper);
    setSections(buildSections(paper));
    setAnswers({});
    setActiveSectionIdx(0);
    setCurrentQuestionIdx(0);
    setTimeRemaining((paper.durationMinutes || TOTAL_TIME_MINUTES) * 60);
    setIsTimeUp(false);
    setScore(0);
    setCorrectCount(0);
    setPhase('rules');
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
          const correctAnswer = Array.isArray(q.answer) ? q.answer.join(' | ') : q.answer;
          const isCorrect = isQuestionCorrect(q, ans);
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
        timeSpent: (selectedPaper?.durationMinutes || TOTAL_TIME_MINUTES) * 60 - timeRemaining,
        byType,
      };
      const updatedExamHistory = [examRecord, ...userData.examHistory];
      saveUserData(user.id, {
        ...userData,
        examHistory: updatedExamHistory,
      });
    }
  }, [sections, answers, totalQuestions, selectedPaper, recordAnswer, addWrongAnswer, getCurrentUser, getUserData, saveUserData, timeRemaining]);

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

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F5F5F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-pm-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-pm-text-secondary">正在加载三套仿真试卷...</p>
        </div>
      </div>
    );
  }

  if (phase === 'select-paper') {
    return (
      <div className="min-h-[100dvh] bg-[#F5F5F0] px-6 py-10">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-pm-text-primary">仿真考试</h1>
            <p className="mt-2 text-sm text-pm-text-secondary">
              请选择一套固定试卷开始考试。题目、答案和解析来自上传的三套 Word 试卷。
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              试卷加载失败：{error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {papers.map((paper, index) => {
              const total = paper.questions.length;
              const single = paper.counts.single || 0;
              const fill = paper.counts.fill || 0;
              const codeFill = paper.counts.codeFill || 0;
              const codeFix = paper.counts.codeFix || 0;

              return (
                <motion.button
                  key={paper.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                  onClick={() => handleSelectPaper(paper)}
                  className="group rounded-lg border border-[#D4D4D4] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0F4C81] hover:shadow-pm-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#0F4C81]">固定试卷 {index + 1}</p>
                      <h2 className="mt-1 text-[18px] font-semibold text-pm-text-primary">{paper.title}</h2>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E8F1F8] text-[#0F4C81]">
                      <FileText className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-[#F5F7FA] px-3 py-2">
                      <p className="text-[11px] text-pm-text-muted">总题数</p>
                      <p className="font-semibold text-pm-text-primary">{total} 题</p>
                    </div>
                    <div className="rounded-md bg-[#F5F7FA] px-3 py-2">
                      <p className="text-[11px] text-pm-text-muted">考试时长</p>
                      <p className="font-semibold text-pm-text-primary">{paper.durationMinutes} 分钟</p>
                    </div>
                  </div>

                  <div className="mb-5 space-y-1.5 text-[13px] text-pm-text-secondary">
                    {single > 0 && <p>选择题：{single} 题</p>}
                    {fill > 0 && <p>填空题：{fill} 题</p>}
                    {codeFill > 0 && <p>程序填空：{codeFill} 题</p>}
                    {codeFix > 0 && <p>程序改错：{codeFix} 题</p>}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-4">
                    <span className="flex items-center gap-1.5 text-xs text-pm-text-muted">
                      <BookOpen className="h-3.5 w-3.5" />
                      答后显示解析
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0F4C81] px-3 py-1.5 text-xs font-medium text-white group-hover:bg-[#0D3F6B]">
                      <Play className="h-3.5 w-3.5" />
                      选择
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F5F5F0]">
        <p className="text-sm text-pm-text-secondary">请先选择一套试卷。</p>
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
        timeSpent={(selectedPaper?.durationMinutes || TOTAL_TIME_MINUTES) * 60 - timeRemaining}
        onRestart={() => {
          setPhase('select-paper');
          setSelectedPaper(null);
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
          studentId={authState.user?.studentId}
          studentName={authState.user?.name}
          onSwitchSection={handleSwitchSection}
        />

        {/* 4. Center Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'rules' && phase === 'rules' ? (
            <ExamRules onStart={handleStartExam} paperTitle={selectedPaper?.title} sections={sections} />
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
