import { motion } from 'framer-motion';
import type { Question } from '@/types';

type AnswerState = 'unanswered' | 'correct' | 'wrong' | 'current' | 'skipped';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  answerStates: AnswerState[];
  onNavigate: (index: number) => void;
}

export default function QuestionNavigator({
  questions,
  currentIndex,
  answerStates,
  onNavigate,
}: QuestionNavigatorProps) {
  const correctCount = answerStates.filter((s) => s === 'correct').length;
  const wrongCount = answerStates.filter((s) => s === 'wrong').length;
  const unansweredCount = answerStates.filter((s) => s === 'unanswered').length;
  const progress = questions.length > 0 ? Math.round((answerStates.filter((s) => s !== 'unanswered').length / questions.length) * 100) : 0;

  return (
    <div className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-4">
      {/* Progress overview */}
      <div className="mb-4 text-center">
        <p className="text-sm text-pm-text-secondary mb-2">
          第 {currentIndex + 1} / {questions.length} 题
        </p>

        {/* Circular progress */}
        <div className="flex justify-center mb-3">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--pm-bg-primary)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="var(--pm-primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={339.292}
                strokeDashoffset={339.292 * (1 - progress / 100)}
                initial={{ strokeDashoffset: 339.292 }}
                animate={{ strokeDashoffset: 339.292 * (1 - progress / 100) }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-heading text-pm-primary">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-pm-success">
            <span className="w-2 h-2 rounded-full bg-pm-success" />{correctCount}
          </span>
          <span className="flex items-center gap-1 text-pm-error">
            <span className="w-2 h-2 rounded-full bg-pm-error" />{wrongCount}
          </span>
          <span className="flex items-center gap-1 text-pm-neutral">
            <span className="w-2 h-2 rounded-full bg-pm-neutral" />{unansweredCount}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-pm-border-color my-3" />

      {/* Question grid */}
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const state = answerStates[i] || 'unanswered';
          const isCurrent = i === currentIndex;

          const stateStyles: Record<AnswerState, { bg: string; text: string; border: string }> = {
            unanswered: {
              bg: 'var(--pm-bg-primary)',
              text: 'var(--pm-text-secondary)',
              border: '1px solid var(--pm-border-color)',
            },
            correct: {
              bg: 'var(--pm-success-light)',
              text: 'var(--pm-success)',
              border: '1px solid rgba(39, 174, 96, 0.3)',
            },
            wrong: {
              bg: 'var(--pm-error-light)',
              text: 'var(--pm-error)',
              border: '1px solid rgba(231, 76, 60, 0.3)',
            },
            current: {
              bg: 'var(--pm-primary)',
              text: '#FFFFFF',
              border: '1px solid var(--pm-primary)',
            },
            skipped: {
              bg: 'var(--pm-orange-light)',
              text: 'var(--pm-orange)',
              border: '1px solid rgba(233, 162, 59, 0.3)',
            },
          };

          const style = stateStyles[state];

          return (
            <motion.button
              key={q.id}
              onClick={() => onNavigate(i)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: i * 0.015,
                duration: 0.2,
                ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
              }}
              className="w-[44px] h-[44px] rounded-pm-sm flex items-center justify-center text-sm font-medium transition-all"
              style={{
                background: style.bg,
                color: style.text,
                border: style.border,
                boxShadow: isCurrent
                  ? '0 0 0 0 rgba(15,76,129,0.4)'
                  : 'none',
                animation: isCurrent ? 'pulse-current 2s ease-in-out infinite' : 'none',
              }}
            >
              {i + 1}
              <style>{`
                @keyframes pulse-current {
                  0% { box-shadow: 0 0 0 0 rgba(15,76,129,0.4); }
                  70% { box-shadow: 0 0 0 8px rgba(15,76,129,0); }
                  100% { box-shadow: 0 0 0 0 rgba(15,76,129,0); }
                }
              `}</style>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
