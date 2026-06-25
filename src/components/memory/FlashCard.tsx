import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import type { Question } from '@/types';

interface FlashCardProps {
  question: Question;
  index: number;
  total: number;
  isFlipped: boolean;
  onFlip: () => void;
}

const typeLabels: Record<string, string> = {
  'single': '单选题',
  'fill': '填空题',
  'codeFill': '程序填空',
  'codeFix': '程序改错',
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

export default function FlashCard({
  question,
  index: _index,
  total: _total,
  isFlipped,
  onFlip,
}: FlashCardProps) {
  void _index;
  void _total;
  const handleFlip = useCallback(() => {
    onFlip();
  }, [onFlip]);

  const tColor = typeColors[question.type] || typeColors['single'];
  const dColor = difficultyColors[question.difficulty] || difficultyColors.easy;

  const correctAnswerText = Array.isArray(question.answer)
    ? question.answer.join(' | ')
    : question.answer;

  return (
    <div className="w-full max-w-[640px] mx-auto perspective-[1200px]">
      {/* Type & difficulty tags */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ background: tColor.bg, color: tColor.text }}
          >
            {typeLabels[question.type]}
          </span>
          <span
            className="px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ background: dColor.bg, color: dColor.text }}
          >
            {difficultyLabels[question.difficulty]}
          </span>
        </div>
        <span className="text-xs text-pm-text-muted">
          ID: {question.id}
        </span>
      </div>

      {/* 3D Flip Card Container */}
      <div className="relative" style={{ height: '400px' }}>
        <motion.div
          className="w-full h-full relative cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          onClick={handleFlip}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 w-full h-full bg-pm-bg-card rounded-xl shadow-lg p-5 flex flex-col overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Front Header: tags */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-pm-bg-primary text-pm-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Question Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto">
              <p className="text-base font-medium text-pm-text-primary leading-relaxed mb-4">
                {question.content}
              </p>

              {question.code && (
                <pre className="w-full bg-[#1E293B] text-[#E2E8F0] rounded-lg p-4 text-left text-sm font-mono leading-relaxed overflow-x-auto mb-3">
                  <code>{question.code}</code>
                </pre>
              )}

              {question.options && question.options.length > 0 && (
                <div className="w-full space-y-2 text-left">
                  {question.options.map((opt, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 rounded-lg bg-pm-bg-primary border border-pm-border text-sm text-pm-text-primary"
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              )}

              {question.blanks && question.blanks.length > 0 && (
                <div className="w-full space-y-2 text-left">
                  {question.blanks.map((blank) => (
                    <div
                      key={blank.id}
                      className="px-4 py-2.5 rounded-lg bg-pm-bg-primary border border-pm-border text-sm text-pm-text-secondary"
                    >
                      填空 {blank.id}: <span className="inline-block w-24 border-b border-pm-border" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Front Footer Hint */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-pm-border">
              <Eye className="w-4 h-4 text-pm-primary" />
              <span className="text-sm text-pm-primary font-medium">点击卡片或按空格查看答案</span>
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 w-full h-full rounded-xl shadow-lg p-5 flex flex-col overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: '#E8F1F8',
            }}
          >
            {/* Back Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-pm-primary" />
                <span className="text-sm font-semibold text-pm-primary">答案与解析</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/60 hover:bg-white text-sm text-pm-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                翻回
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto pr-1">
              {/* Answer Section */}
              <div className="bg-white/70 rounded-lg p-4 mb-3">
                <h4 className="text-xs font-semibold text-pm-text-secondary uppercase tracking-wider mb-2">
                  正确答案
                </h4>
                <p className="text-lg font-semibold text-pm-success">{correctAnswerText}</p>
              </div>

              {/* Explanation */}
              <div className="bg-white/70 rounded-lg p-4 mb-3">
                <h4 className="text-xs font-semibold text-pm-text-secondary uppercase tracking-wider mb-2">
                  解析
                </h4>
                <p className="text-sm text-pm-text-primary leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-pm-border/50">
              <span className="text-xs text-pm-text-muted">知识点：</span>
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-pm-primary-light text-pm-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
