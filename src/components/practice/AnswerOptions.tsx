import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Question } from '@/types';
import { normalizeChoiceAnswer } from '@/lib/answerCheck';

interface AnswerOptionsProps {
  question: Question;
  selectedAnswer: string | null;
  submitted: boolean;
  correctAnswer: string | string[];
  onSelect: (answer: string) => void;
}

const optionLabels = ['A', 'B', 'C', 'D'];

export default function AnswerOptions({
  question,
  selectedAnswer,
  submitted,
  correctAnswer,
  onSelect,
}: AnswerOptionsProps) {
  const options = question.options || [];

  const getOptionState = (option: string, index: number): 'default' | 'selected' | 'correct' | 'wrong' => {
    if (!submitted) {
      return selectedAnswer === option ? 'selected' : 'default';
    }
    const correctLabel = normalizeChoiceAnswer(correctAnswer);
    const currentLabel = optionLabels[index];
    // Extract letter from user's selected answer too
    const selectedLetter = selectedAnswer ? normalizeChoiceAnswer(selectedAnswer) : '';

    if (currentLabel === correctLabel) return 'correct';
    if (selectedLetter === currentLabel && currentLabel !== correctLabel) return 'wrong';
    return 'default';
  };

  const stateStyles = {
    default: {
      border: '1px solid var(--pm-border-color)',
      background: 'var(--pm-bg-primary)',
      color: 'var(--pm-text-primary)',
      indicator: 'transparent',
    },
    selected: {
      border: '1px solid var(--pm-primary)',
      background: 'var(--pm-primary-light)',
      color: 'var(--pm-primary)',
      indicator: 'var(--pm-primary)',
    },
    correct: {
      border: '1px solid var(--pm-success)',
      background: 'var(--pm-success-light)',
      color: 'var(--pm-success)',
      indicator: 'var(--pm-success)',
    },
    wrong: {
      border: '1px solid var(--pm-error)',
      background: 'var(--pm-error-light)',
      color: 'var(--pm-error)',
      indicator: 'var(--pm-error)',
    },
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const state = getOptionState(option, index);
        const styles = stateStyles[state];
        const isDisabled = submitted;

        return (
          <motion.button
            key={index}
            whileTap={!isDisabled ? { scale: 0.97 } : undefined}
            transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
            onClick={() => !isDisabled && onSelect(option)}
            disabled={isDisabled}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-pm-md text-left transition-colors relative overflow-hidden"
            style={{
              border: styles.border,
              background: styles.background,
              cursor: isDisabled ? 'default' : 'pointer',
              opacity: isDisabled && state === 'default' ? 0.7 : 1,
            }}
          >
            {/* Left indicator line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-200"
              style={{
                background: styles.indicator,
                opacity: state !== 'default' ? 1 : 0,
              }}
            />

            {/* Option letter circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold border"
              style={{
                borderColor: state === 'default' ? 'var(--pm-border-color)' : styles.indicator,
                background: state === 'default' ? 'transparent' : styles.indicator,
                color: state === 'default' ? 'var(--pm-text-secondary)' : '#FFFFFF',
              }}
            >
              {optionLabels[index]}
            </div>

            {/* Option text */}
            <span
              className="flex-1 text-sm font-body"
              style={{ color: state === 'default' ? 'var(--pm-text-primary)' : styles.color }}
            >
              {option}
            </span>

            {/* Status icon */}
            {submitted && state === 'correct' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
              >
                <Check className="w-5 h-5" style={{ color: 'var(--pm-success)' }} />
              </motion.div>
            )}
            {submitted && state === 'wrong' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--pm-error)' }} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
