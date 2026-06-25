import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trash2, CheckCircle, RotateCcw, CheckSquare, Square } from 'lucide-react';
import type { Question, WrongAnswer } from '@/types';
import CodeBlock from '@/components/practice/CodeBlock';

interface WrongQuestionCardProps {
  question: Question;
  wrongAnswer: WrongAnswer;
  batchMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onMarkMastered: () => void;
  onRemove: () => void;
  onRetry: () => void;
  index: number;
}

const typeLabels: Record<string, string> = {
  'single': '单选题',
  'fill': '填空题',
  'codeFill': '程序填空题',
  'codeFix': '程序改错题',
};

const typeColors: Record<string, { bg: string; text: string }> = {
  'single': { bg: 'var(--pm-primary-light)', text: 'var(--pm-primary)' },
  'fill': { bg: 'var(--pm-accent-light)', text: 'var(--pm-accent)' },
  'codeFill': { bg: 'var(--pm-purple-light)', text: 'var(--pm-purple)' },
  'codeFix': { bg: 'var(--pm-orange-light)', text: 'var(--pm-orange)' },
};

const difficultyLabels: Record<string, string> = {
  easy: '易',
  medium: '中',
  hard: '难',
};

const difficultyColors: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'var(--pm-success-light)', text: 'var(--pm-success)' },
  medium: { bg: 'var(--pm-orange-light)', text: 'var(--pm-orange)' },
  hard: { bg: 'var(--pm-error-light)', text: 'var(--pm-error)' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

export default function WrongQuestionCard({
  question,
  wrongAnswer,
  batchMode,
  selected,
  onToggleSelect,
  onMarkMastered,
  onRemove,
  onRetry,
  index,
}: WrongQuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [removing, setRemoving] = useState(false);

  const tColor = typeColors[question.type] || typeColors['single'];
  const dColor = difficultyColors[question.difficulty] || difficultyColors.easy;
  const isMastered = wrongAnswer.isMastered;

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => {
      onRemove();
    }, 300);
  };

  const answerDisplay = Array.isArray(question.answer)
    ? question.answer.join(' | ')
    : question.answer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: removing ? 0 : 1,
        y: removing ? 20 : 0,
        x: removing ? 100 : 0,
        height: removing ? 0 : 'auto',
      }}
      transition={{
        duration: removing ? 0.3 : 0.4,
        delay: removing ? 0 : index * 0.06,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="bg-pm-bg-card rounded-pm-lg shadow-pm-sm hover:shadow-pm-md transition-all duration-200 overflow-hidden"
      style={{
        borderLeft: '4px solid',
        borderLeftColor: isMastered ? 'var(--pm-success)' : 'var(--pm-error)',
      }}
    >
      <div className="p-5">
        {/* Top row: tags + meta */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {batchMode && (
              <button
                onClick={onToggleSelect}
                className="mr-1 text-pm-primary"
              >
                {selected ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-pm-neutral" />
                )}
              </button>
            )}
            <span
              className="px-2.5 py-1 rounded-pm-sm text-xs font-semibold"
              style={{ background: tColor.bg, color: tColor.text }}
            >
              {typeLabels[question.type]}
            </span>
            <span
              className="px-2.5 py-1 rounded-pm-sm text-xs font-semibold"
              style={{ background: dColor.bg, color: dColor.text }}
            >
              {difficultyLabels[question.difficulty]}
            </span>
            {question.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-pm-sm text-xs font-medium bg-pm-bg-primary text-pm-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            {wrongAnswer.wrongCount > 1 && (
              <span className="px-2 py-1 rounded-pm-sm text-xs font-medium bg-pm-error-light text-pm-error">
                答错 {wrongAnswer.wrongCount} 次
              </span>
            )}
            <span className="text-xs text-pm-text-muted">{timeAgo(wrongAnswer.lastWrongAt)}</span>
          </div>
        </div>

        {/* Question content */}
        <p className="text-sm text-pm-text-primary leading-relaxed mb-3 line-clamp-2">
          {question.content}
        </p>

        {question.code && (
          <div className="mb-3">
            <CodeBlock code={question.code.split('\n').slice(0, 3).join('\n')} className="opacity-70" />
          </div>
        )}

        {/* Answer comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-pm-md bg-pm-error-light">
            <p className="text-xs text-pm-error font-medium mb-1">你的答案</p>
            <p className="text-sm text-pm-error font-medium truncate">
              {wrongAnswer.userAnswer || '未作答'}
            </p>
          </div>
          <div className="p-3 rounded-pm-md bg-pm-success-light">
            <p className="text-xs text-pm-success font-medium mb-1">正确答案</p>
            <p className="text-sm text-pm-success font-medium truncate">{answerDisplay}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1.5 rounded-pm-md border border-pm-primary text-pm-primary text-xs font-medium hover:bg-pm-primary-light transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重刷此题
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-pm-md text-pm-text-secondary text-xs font-medium hover:bg-pm-bg-primary transition-colors"
          >
            查看解析
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </button>
          <button
            onClick={onMarkMastered}
            className="flex items-center gap-1 px-3 py-1.5 rounded-pm-md text-xs font-medium transition-colors"
            style={{
              border: isMastered ? '1px solid var(--pm-success)' : '1px solid var(--pm-success)',
              color: isMastered ? 'var(--pm-success)' : 'var(--pm-success)',
              background: isMastered ? 'var(--pm-success-light)' : 'transparent',
            }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isMastered ? '取消掌握' : '标记已掌握'}
          </button>
          <button
            onClick={handleRemove}
            className="ml-auto p-1.5 rounded-md text-pm-text-muted hover:text-pm-error hover:bg-pm-error-light transition-colors"
            title="删除错题"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded explanation */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-pm-border-color">
                <h4 className="text-sm font-semibold text-pm-text-primary mb-2">解析</h4>
                <p className="text-sm text-pm-text-secondary leading-relaxed mb-3">
                  {question.explanation}
                </p>
                {question.code && (
                  <CodeBlock code={question.code} />
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {question.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-pm-sm text-xs font-medium bg-pm-primary-light text-pm-primary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
