import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

interface WeakAreaItem {
  category: string;
  answered: number;
  correct: number;
  rate: number;
  questionCount: number;
}

interface WeakAreasProps {
  areas: WeakAreaItem[];
  delay?: number;
}

export default function WeakAreas({ areas, delay = 0 }: WeakAreasProps) {
  const navigate = useNavigate();

  const getBarColor = (rate: number) => {
    if (rate < 50) return '#E74C3C';
    if (rate < 75) return '#E9A23B';
    return '#27AE60';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="bg-pm-bg-card rounded-pm-lg shadow-pm-md overflow-hidden"
    >
      {/* Warning bar */}
      <div className="h-1 bg-gradient-to-r from-pm-orange to-pm-error" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-pm-orange" />
          <h3 className="font-heading text-[22px] font-semibold text-pm-text-primary">
            薄弱环节
          </h3>
        </div>
        <p className="text-sm text-pm-text-secondary mb-6">以下知识点需要重点复习</p>

        {areas.length === 0 ? (
          <div className="py-8 text-center text-pm-text-muted text-sm">
            暂无薄弱环节数据，继续练习后会在这里显示需要加强的知识点
          </div>
        ) : (
          <div className="space-y-4">
            {areas.slice(0, 5).map((area, idx) => (
              <motion.div
                key={area.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: delay / 1000 + idx * 0.1,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-pm-lg bg-pm-bg-primary"
              >
                {/* Left */}
                <div className="sm:w-32 shrink-0">
                  <p className="text-sm font-semibold text-pm-text-primary">{area.category}</p>
                  <p className="text-xs text-pm-text-muted">涉及 {area.questionCount} 道题目</p>
                </div>

                {/* Progress bar */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white rounded-pm-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-pm-full"
                      style={{ backgroundColor: getBarColor(area.rate) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${area.rate}%` }}
                      transition={{
                        duration: 0.6,
                        delay: delay / 1000 + idx * 0.1,
                        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-pm-text-secondary w-10 text-right">
                    {area.rate}%
                  </span>
                </div>

                {/* Action */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/practice?category=${encodeURIComponent(area.category)}`)}
                  className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-pm-md bg-pm-primary text-white text-xs font-medium hover:bg-pm-primary-hover transition-colors"
                >
                  去练习
                  <ArrowRight className="w-3 h-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
