import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, Send } from 'lucide-react';

interface SubmitConfirmProps {
  totalQuestions: number;
  answeredCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SubmitConfirm({ totalQuestions, answeredCount, onCancel, onConfirm }: SubmitConfirmProps) {
  const unanswered = totalQuestions - answeredCount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="bg-white rounded-lg shadow-xl w-[420px] max-w-[90vw] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#FDF3E0] flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[#E9A23B]" />
          </div>
          <h3 className="text-[16px] font-semibold text-pm-text-primary">确认交卷</h3>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-[14px] text-pm-text-secondary">
            你还有 <strong className="text-[#CC0000]">{unanswered}</strong> 道题未作答。
          </p>

          {/* Stats Summary */}
          <div className="bg-[#F5F7FA] rounded-md p-3 space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-pm-text-secondary">总题数</span>
              <span className="font-medium text-pm-text-primary">{totalQuestions} 题</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-pm-text-secondary">已作答</span>
              <span className="font-medium text-[#27AE60]">{answeredCount} 题</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-pm-text-secondary">未作答</span>
              <span className="font-medium text-[#CC0000]">{unanswered} 题</span>
            </div>
          </div>

          <p className="text-[13px] text-pm-text-muted">
            交卷后将无法修改答案，确定要提交吗？
          </p>

          {unanswered > 0 && (
            <div className="flex items-start gap-2 bg-[#FDEDEC] rounded-md p-3">
              <XCircle className="w-4 h-4 text-[#E74C3C] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#C0392B]">
                你还有未完成的题目，建议先完成所有题目后再交卷。
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#E2E8F0] bg-[#FAFAFA]">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-md text-[13px] font-medium text-pm-text-secondary hover:bg-white hover:shadow-sm border border-[#E2E8F0] transition-all"
          >
            继续答题
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md text-[13px] font-medium bg-[#E74C3C] text-white hover:bg-[#C0392B] transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            确认交卷
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
