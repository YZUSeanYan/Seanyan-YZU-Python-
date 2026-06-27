import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, CheckCircle, XCircle, HelpCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Question, QuestionType } from '@/types';
import { isQuestionAnswerCorrect } from '@/lib/answerCheck';

interface ExamSection {
  type: QuestionType;
  label: string;
  count: number;
  questions: Question[];
}

interface ScoreReportProps {
  score: number;
  correctCount: number;
  totalQuestions: number;
  answeredCount: number;
  sections: ExamSection[];
  answers: Record<number, string>;
  timeSpent: number;
  onRestart: () => void;
}

const typeLabels: Record<string, string> = {
  single: '单选题',
  fill: '填空题',
  codeFill: '程序填空',
  codeFix: '程序改错',
};

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}小时${m}分${s}秒`;
  return `${m}分${s}秒`;
}

function isAnswerCorrect(question: Question, answer?: string) {
  return isQuestionAnswerCorrect(question, answer);
}

function answerText(value: unknown) {
  if (Array.isArray(value)) return value.join(' / ');
  return String(value ?? '');
}

export default function ScoreReport({
  score,
  correctCount,
  totalQuestions,
  answeredCount,
  sections,
  answers,
  timeSpent,
  onRestart,
}: ScoreReportProps) {
  const navigate = useNavigate();

  const sectionStats = sections.map((section) => {
    const answered = section.questions.filter((q) => Boolean(answers[q.id]?.trim())).length;
    const correct = section.questions.filter((q) => isAnswerCorrect(q, answers[q.id])).length;
    return {
      ...section,
      answered,
      correct,
      rate: section.questions.length > 0 ? Math.round((correct / section.questions.length) * 100) : 0,
    };
  });

  const grade = score >= 90
    ? { label: '优秀', color: '#27AE60', bg: '#E8F8EF' }
    : score >= 80
      ? { label: '良好', color: '#0F4C81', bg: '#E8F1F8' }
      : score >= 60
        ? { label: '及格', color: '#E9A23B', bg: '#FDF3E0' }
        : { label: '需要加强', color: '#E74C3C', bg: '#FDEDEC' };

  const reviewItems = sections.flatMap((section, sectionIndex) => {
    const offset = sections
      .slice(0, sectionIndex)
      .reduce((sum, item) => sum + item.questions.length, 0);
    return section.questions.map((question, questionIndex) => ({
      section,
      question,
      number: offset + questionIndex + 1,
    }));
  });

  return (
    <div className="min-h-[100dvh] bg-[#F5F7FA] pt-4 pb-12">
      <div className="max-w-[980px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="bg-white rounded-xl shadow-pm-lg overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-[#0F4C81] to-[#1A6BAF] px-6 py-6 text-center">
            <Trophy className="w-10 h-10 text-[#E9A23B] mx-auto mb-2" />
            <h1 className="text-[22px] font-bold text-white mb-1">考试结束</h1>
            <p className="text-[13px] text-white/70">Python 期末考试模拟成绩报告</p>
          </div>

          <div className="flex flex-col items-center py-8">
            <div className="relative mb-4">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={grade.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - score / 100) }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[36px] font-bold" style={{ color: grade.color }}>{score}</span>
                <span className="text-[12px] text-pm-text-muted">分</span>
              </div>
            </div>
            <span className="px-4 py-1 rounded-full text-[14px] font-semibold" style={{ color: grade.color, backgroundColor: grade.bg }}>
              {grade.label}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-6">
            <Stat icon={<CheckCircle className="w-5 h-5 text-[#27AE60]" />} value={correctCount} label="答对题数" />
            <Stat icon={<XCircle className="w-5 h-5 text-[#E74C3C]" />} value={answeredCount - correctCount} label="答错题数" />
            <Stat icon={<HelpCircle className="w-5 h-5 text-[#94A3B8]" />} value={totalQuestions - answeredCount} label="未答题数" />
            <Stat icon={<Clock className="w-5 h-5 text-[#0F4C81]" />} value={formatTime(timeSpent)} label="用时" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="bg-white rounded-xl shadow-pm-md p-6 mb-6"
        >
          <h2 className="text-[16px] font-semibold text-pm-text-primary mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#0F4C81]" />
            各题型得分
          </h2>
          <div className="space-y-4">
            {sectionStats.map((stat, idx) => (
              <div key={stat.type} className="flex items-center gap-4">
                <div className="w-[110px] shrink-0">
                  <p className="text-[13px] font-medium text-pm-text-primary">{typeLabels[stat.type] || stat.label}</p>
                  <p className="text-[11px] text-pm-text-muted">共 {stat.questions.length} 题，已答 {stat.answered}</p>
                </div>
                <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: stat.rate >= 60 ? '#27AE60' : '#E74C3C' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.rate}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + idx * 0.08 }}
                  />
                </div>
                <div className="w-[80px] text-right shrink-0">
                  <p className="text-[13px] font-semibold" style={{ color: stat.rate >= 60 ? '#27AE60' : '#E74C3C' }}>
                    {stat.correct}/{stat.questions.length}
                  </p>
                  <p className="text-[11px] text-pm-text-muted">{stat.rate}%</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F4C81]" />
              <span className="text-[14px] font-medium text-pm-text-primary">总体正确率</span>
            </div>
            <span className="text-[20px] font-bold text-[#0F4C81]">
              {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="bg-white rounded-xl shadow-pm-md p-6 mb-6"
        >
          <h2 className="text-[16px] font-semibold text-pm-text-primary mb-4">逐题解析</h2>
          <div className="space-y-4">
            {reviewItems.map(({ section, question: q, number }) => {
                const userAnswer = answers[q.id];
                const correct = isAnswerCorrect(q, userAnswer);
                const answered = Boolean(userAnswer?.trim());
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg border p-4 ${!answered ? 'border-[#CBD5E1] bg-[#F8FAFC]' : correct ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-[#FECACA] bg-[#FEF2F2]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-1">
                        {!answered ? <HelpCircle className="w-5 h-5 text-[#94A3B8]" /> : correct ? <CheckCircle className="w-5 h-5 text-[#27AE60]" /> : <XCircle className="w-5 h-5 text-[#E74C3C]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[13px] font-semibold text-pm-text-primary">第 {number} 题</span>
                          <span className="text-[12px] px-2 py-0.5 rounded-full bg-white/80 text-pm-text-secondary">{typeLabels[q.type] || section.label}</span>
                          <span className="text-[12px] text-pm-text-muted">题库ID {q.id}</span>
                        </div>
                        <p className="text-[14px] leading-7 text-pm-text-primary whitespace-pre-wrap mb-3">{q.content}</p>
                        {q.code && (
                          <pre className="mb-3 rounded-md bg-[#1E293B] p-3 text-[13px] leading-6 text-[#E2E8F0] overflow-x-auto">
                            <code>{q.code}</code>
                          </pre>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px] mb-3">
                          <div className="rounded-md bg-white/80 border border-white px-3 py-2">
                            <span className="text-pm-text-muted">你的答案：</span>
                            <span className={answered ? 'text-pm-text-primary font-medium' : 'text-pm-text-muted'}>{answered ? userAnswer : '未作答'}</span>
                          </div>
                          <div className="rounded-md bg-white/80 border border-white px-3 py-2">
                            <span className="text-pm-text-muted">正确答案：</span>
                            <span className="text-[#15803D] font-medium">{answerText(q.answer)}</span>
                          </div>
                        </div>
                        <div className="rounded-md bg-white/80 border border-white px-3 py-2">
                          <p className="text-[13px] font-medium text-pm-text-primary mb-1">解析</p>
                          <p className="text-[13px] leading-6 text-pm-text-secondary whitespace-pre-wrap">
                            {q.explanation || '暂无解析。建议对照题干、代码和正确答案，重点复盘本题涉及的知识点。'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={onRestart}
            className="flex items-center gap-2 bg-[#0F4C81] text-white font-medium px-6 py-2.5 rounded-lg hover:bg-[#0D3F6B] transition-colors shadow-pm-primary"
          >
            <RotateCcw className="w-4 h-4" />
            重新考试
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white text-pm-text-primary font-medium px-6 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F5F7FA] transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="text-center p-3 bg-[#F5F7FA] rounded-lg">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-[18px] font-bold text-pm-text-primary">{value}</p>
      <p className="text-[11px] text-pm-text-muted">{label}</p>
    </div>
  );
}
