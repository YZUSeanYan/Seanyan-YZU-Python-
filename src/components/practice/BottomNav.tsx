import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart3, LogOut } from 'lucide-react';

interface BottomNavProps {
  currentIndex: number;
  total: number;
  hasAnswer: boolean;
  submitted: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onShowResult: () => void;
}

export default function BottomNav({
  currentIndex,
  total,
  hasAnswer,
  submitted,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onFinish,
  onShowResult,
}: BottomNavProps) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const allAnswered = submitted || hasAnswer;

  return (
    <motion.div
      initial={{ y: 64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="fixed bottom-0 left-0 right-0 bg-pm-bg-card border-t border-pm-border-color z-40"
      style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.04)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Progress bar */}
      <div className="h-1 rounded-full bg-pm-bg-primary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-pm-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between">
        {/* Left: prev/next */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-pm-md text-xs sm:text-sm font-medium text-pm-text-secondary hover:bg-pm-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-friendly"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">上一题</span>
          </button>
          <button
            onClick={onNext}
            disabled={isLast}
            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-pm-md text-xs sm:text-sm font-medium text-pm-text-secondary hover:bg-pm-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-friendly"
          >
            <span className="hidden sm:inline">下一题</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: counter */}
        <div className="text-xs sm:text-sm font-medium text-pm-text-secondary whitespace-nowrap">
          {currentIndex + 1} / {total}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onFinish}
            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-pm-md text-xs sm:text-sm font-medium text-pm-error hover:bg-pm-error-light transition-colors touch-friendly"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">结束</span>
          </button>
          {isLast && allAnswered && (
            <button
              onClick={onShowResult}
              className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-2 rounded-pm-md bg-pm-primary text-white text-xs sm:text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary touch-friendly"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">报告</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
