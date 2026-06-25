import { motion } from 'framer-motion';
import { Check, X, ArrowRight, BookOpen } from 'lucide-react';
import type { Question } from '@/types';
import CodeBlock from './CodeBlock';

interface ExplanationPanelProps {
  question: Question;
  isCorrect: boolean;
  userAnswer: string | null;
  onNext: () => void;
}

export default function ExplanationPanel({
  question,
  isCorrect,
  userAnswer,
  onNext,
}: ExplanationPanelProps) {
  const answerDisplay = Array.isArray(question.answer)
    ? question.answer.join(' | ')
    : question.answer;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className="overflow-hidden"
    >
      <div className="mt-4 bg-pm-bg-card rounded-pm-lg shadow-pm-md overflow-hidden">
        {/* Status bar */}
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="h-1"
          style={{ background: isCorrect ? 'var(--pm-success)' : 'var(--pm-error)' }}
        />

        <div className="p-6">
          {/* Status header */}
          <div className="flex items-center gap-2 mb-4">
            {isCorrect ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                >
                  <Check className="w-5 h-5 text-pm-success" />
                </motion.div>
                <span className="text-sm font-semibold text-pm-success">回答正确！</span>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                >
                  <X className="w-5 h-5 text-pm-error" />
                </motion.div>
                <span className="text-sm font-semibold text-pm-error">回答错误</span>
                <span className="text-sm text-pm-text-secondary ml-2">
                  正确答案：
                  <span className="font-semibold text-pm-success ml-1">{answerDisplay}</span>
                </span>
              </>
            )}
          </div>

          {/* User answer vs correct */}
          {!isCorrect && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-pm-md bg-pm-error-light">
                <p className="text-xs text-pm-error font-medium mb-1">你的答案</p>
                <p className="text-sm text-pm-error font-medium">{userAnswer || '未作答'}</p>
              </div>
              <div className="p-3 rounded-pm-md bg-pm-success-light">
                <p className="text-xs text-pm-success font-medium mb-1">正确答案</p>
                <p className="text-sm text-pm-success font-medium">{answerDisplay}</p>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mb-4">
            <h4 className="text-lg font-heading font-semibold text-pm-text-primary mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pm-primary" />
              解析
            </h4>
            <p className="text-sm text-pm-text-secondary leading-relaxed mb-3">
              {question.explanation}
            </p>
            {question.code && (
              <CodeBlock code={question.code} />
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {question.tags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="px-2.5 py-1 rounded-pm-sm text-xs font-medium bg-pm-primary-light text-pm-primary"
              >
                #{tag}
              </motion.span>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
          >
            下一题
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
