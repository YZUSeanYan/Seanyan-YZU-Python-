import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function EmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      {/* Illustration placeholder */}
      <div className="w-40 h-32 mb-6 flex items-center justify-center rounded-pm-xl bg-pm-bg-primary">
        <BookOpen className="w-16 h-16 text-pm-neutral" strokeWidth={1.5} />
      </div>

      <h3 className="font-heading text-[22px] font-semibold text-pm-text-primary mb-2">
        还没有错题记录
      </h3>
      <p className="text-sm text-pm-text-secondary text-center max-w-[360px] mb-6">
        你答错的题目会自动记录在这里。快去练习吧，错题是进步的开始！
      </p>

      <button
        onClick={() => navigate('/practice')}
        className="px-6 py-2.5 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
      >
        开始练习
      </button>
    </motion.div>
  );
}
