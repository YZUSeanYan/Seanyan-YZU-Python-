import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkCheck, Lightbulb } from 'lucide-react';
import type { Question } from '@/types';
import AnswerOptions from './AnswerOptions';
import QuestionContent from './QuestionContent';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  submitted: boolean;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
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

export default function QuestionCard({
  question,
  selectedAnswer,
  submitted,
  onSelectAnswer,
  onSubmit,
  onSkip,
}: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [fillAnswer, setFillAnswer] = useState('');

  const tColor = typeColors[question.type] || typeColors['single'];
  const dColor = difficultyColors[question.difficulty] || difficultyColors.easy;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
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
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-pm-sm text-xs font-medium bg-pm-bg-primary text-pm-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="p-1.5 rounded-md hover:bg-pm-bg-primary transition-colors"
            title="标记待复习"
          >
            {bookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-pm-primary" />
            ) : (
              <Bookmark className="w-4 h-4 text-pm-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Question content */}
      <div className="mb-6">
        <QuestionContent
          content={question.content}
          code={question.code}
          codeLike={question.type === 'codeFill' || question.type === 'codeFix'}
        />
      </div>

      {/* Answer area by type */}
      <div className="mb-6">
        {question.type === 'single' && question.options && question.options.length > 0 && (
          <AnswerOptions
            question={question}
            selectedAnswer={selectedAnswer}
            submitted={submitted}
            correctAnswer={question.answer}
            onSelect={onSelectAnswer}
          />
        )}

        {question.type === 'single' && (!question.options || question.options.length === 0) && (
          <div className="space-y-3">
            <p className="text-sm text-pm-text-secondary mb-2">
              请输入程序改错后的完整代码：
            </p>
            <textarea
              value={selectedAnswer || ''}
              onChange={(e) => onSelectAnswer(e.target.value)}
              disabled={submitted}
              placeholder="请描述错误所在行及正确代码..."
              rows={6}
              className="w-full px-4 py-3 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-pm-border-focus focus:ring-[3px] focus:ring-[rgba(15,76,129,0.1)] disabled:opacity-60 resize-vertical font-mono text-sm"
            />
          </div>
        )}

        {question.type === 'fill' && (
          <div className="space-y-3">
            <input
              type="text"
              value={fillAnswer || selectedAnswer || ''}
              onChange={(e) => {
                setFillAnswer(e.target.value);
                onSelectAnswer(e.target.value);
              }}
              disabled={submitted}
              placeholder="请输入你的答案..."
              className="w-full min-w-[120px] px-4 py-3 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-pm-border-focus focus:ring-[3px] focus:ring-[rgba(15,76,129,0.1)] disabled:opacity-60"
            />
          </div>
        )}

        {question.type === 'codeFill' && (
          <div className="space-y-4">
            {question.blanks?.map((blank) => (
              <div key={blank.id} className="flex items-center gap-3">
                <span className="text-sm text-pm-text-secondary shrink-0">填空 {blank.id}:</span>
                <input
                  type="text"
                  value={selectedAnswer?.split('|')[blank.id - 1] || ''}
                  onChange={(e) => {
                    const parts = selectedAnswer ? selectedAnswer.split('|') : [];
                    parts[blank.id - 1] = e.target.value;
                    onSelectAnswer(parts.join('|'));
                  }}
                  disabled={submitted}
                  placeholder={`第 ${blank.id} 空`}
                  className="flex-1 min-w-[120px] px-4 py-3 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-pm-border-focus focus:ring-[3px] focus:ring-[rgba(15,76,129,0.1)] disabled:opacity-60"
                />
              </div>
            ))}
            {!question.blanks && (
              <input
                type="text"
                value={selectedAnswer || ''}
                onChange={(e) => onSelectAnswer(e.target.value)}
                disabled={submitted}
                placeholder="请输入填空内容..."
                className="w-full min-w-[120px] px-4 py-3 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-pm-border-focus focus:ring-[3px] focus:ring-[rgba(15,76,129,0.1)] disabled:opacity-60"
              />
            )}
          </div>
        )}

        {question.type === 'codeFix' && (
          <div className="space-y-4">
            <p className="text-sm text-pm-text-secondary mb-2">
              请指出代码中的错误并写出正确答案：
            </p>
            <textarea
              value={selectedAnswer || ''}
              onChange={(e) => onSelectAnswer(e.target.value)}
              disabled={submitted}
              placeholder="请描述错误所在行及正确代码..."
              rows={4}
              className="w-full px-4 py-3 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-pm-border-focus focus:ring-[3px] focus:ring-[rgba(15,76,129,0.1)] disabled:opacity-60 resize-vertical font-mono text-sm"
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!submitted && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onSubmit}
            disabled={!selectedAnswer}
            className="px-6 py-2.5 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-pm-primary"
          >
            提交答案
          </button>
          <button
            onClick={onSkip}
            className="px-5 py-2.5 rounded-pm-md border border-pm-border-color text-pm-text-secondary text-sm font-medium hover:bg-pm-bg-primary transition-colors"
          >
            跳过此题
          </button>
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-pm-md text-pm-orange text-sm font-medium hover:bg-pm-orange-light transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            查看提示
          </button>
        </div>
      )}

      {/* Hint */}
      <AnimatePresence>
        {showHint && !submitted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="overflow-hidden mt-4"
          >
            <div className="p-4 rounded-pm-md bg-pm-orange-light border border-pm-orange/20">
              <p className="text-sm text-pm-orange">
                提示：{question.explanation.slice(0, 60)}...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
