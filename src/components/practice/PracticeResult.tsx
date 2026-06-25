import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, BookOpen, Target, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

interface PracticeResultProps {
  total: number;
  correct: number;
  wrong: number;
  skipped?: number;
  onRetryWrong: () => void;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  onContinue: () => void;
}

export default function PracticeResult({
  total,
  correct,
  wrong,
  skipped: _skipped,
  onRetryWrong,
  onContinue,
}: PracticeResultProps) {
  void _skipped;
  const navigate = useNavigate();
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--pm-bg-overlay)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="bg-pm-bg-card rounded-pm-xl shadow-pm-xl w-full max-w-[480px] overflow-hidden"
      >
        {/* Trophy header */}
        <div className="pt-8 pb-6 px-6 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pm-accent-light mb-4"
          >
            <Trophy className="w-8 h-8 text-pm-accent" />
          </motion.div>
          <h2 className="font-heading text-[28px] font-bold text-pm-text-primary mb-1">
            练习完成！
          </h2>
          <p className="text-sm text-pm-text-secondary">
            本次练习共 {total} 题，正确率 {rate}%
          </p>
        </div>

        {/* Stats */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="text-center p-4 rounded-pm-lg bg-pm-bg-primary"
            >
              <Target className="w-5 h-5 text-pm-primary mx-auto mb-1" />
              <div className="font-heading text-2xl font-bold text-pm-text-primary">{total}</div>
              <div className="text-xs text-pm-text-muted">总题数</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="text-center p-4 rounded-pm-lg bg-pm-success-light"
            >
              <CheckCircle className="w-5 h-5 text-pm-success mx-auto mb-1" />
              <div className="font-heading text-2xl font-bold text-pm-success">{correct}</div>
              <div className="text-xs text-pm-success">答对</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="text-center p-4 rounded-pm-lg bg-pm-error-light"
            >
              <XCircle className="w-5 h-5 text-pm-error mx-auto mb-1" />
              <div className="font-heading text-2xl font-bold text-pm-error">{wrong}</div>
              <div className="text-xs text-pm-error">答错</div>
            </motion.div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-pm-bg-primary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rate}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="h-full rounded-full bg-pm-primary"
              />
            </div>
            <span className="text-sm font-semibold text-pm-primary">{rate}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 space-y-2">
          {wrong > 0 && (
            <button
              onClick={onRetryWrong}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
            >
              <RotateCcw className="w-4 h-4" />
              重刷错题 ({wrong}题)
            </button>
          )}
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-pm-md border border-pm-border-color text-pm-text-secondary text-sm font-medium hover:bg-pm-bg-primary transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            继续练习
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-pm-md text-pm-text-muted text-sm font-medium hover:text-pm-text-secondary transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
