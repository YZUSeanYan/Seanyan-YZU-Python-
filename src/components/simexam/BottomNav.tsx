import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grid3X3, Send } from 'lucide-react';

interface BottomNavProps {
  onPrev: () => void;
  onNext: () => void;
  onPicker?: () => void;
  onSubmit: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function BottomNav({ onPrev, onNext, onPicker, onSubmit, hasPrev, hasNext }: BottomNavProps) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="h-12 sm:h-[50px] bg-[#F0F0F0] border-t border-[#D4D4D4] flex items-center justify-between px-3 sm:px-6 shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Left: Navigation Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-[13px] font-medium transition-all touch-friendly ${
            hasPrev
              ? 'bg-white text-pm-text-primary border border-[#D4D4D4] hover:bg-[#E8E8E8]'
              : 'bg-[#E8E8E8] text-pm-text-muted cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">上一题</span>
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-[13px] font-medium transition-all touch-friendly ${
            hasNext
              ? 'bg-[#0F4C81] text-white hover:bg-[#0D3F6B] shadow-sm'
              : 'bg-[#94A3B8] text-white cursor-not-allowed'
          }`}
        >
          <span className="hidden sm:inline">下一题</span>
          <ChevronRight className="w-4 h-4" />
        </button>
        {onPicker && (
          <button
            onClick={onPicker}
            className="hidden sm:flex items-center gap-1 px-4 py-1.5 rounded-md text-[13px] font-medium bg-white text-pm-text-primary border border-[#D4D4D4] hover:bg-[#E8E8E8] transition-all touch-friendly"
          >
            <Grid3X3 className="w-4 h-4" />
            选题
          </button>
        )}
      </div>

      {/* Right: Submit Button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        className="flex items-center gap-1 px-3 sm:px-5 py-1.5 rounded-md text-xs sm:text-[13px] font-semibold bg-[#E74C3C] text-white hover:bg-[#C0392B] shadow-sm transition-colors touch-friendly"
      >
        <Send className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">交卷</span>
      </motion.button>
    </motion.div>
  );
}
