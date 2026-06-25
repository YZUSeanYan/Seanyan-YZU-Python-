import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  delay?: number;
}

export default function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  suffix = '',
  trend,
  trendLabel,
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 800;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayValue(Math.round(value * eased));
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const trendUp = trend && trend > 0;
  const trendDown = trend && trend < 0;
  const trendFlat = trend === 0 || trend === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-6 transition-shadow duration-200"
    >
      {/* Top */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
        <span className="text-xs font-medium text-pm-text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-heading text-[40px] font-bold leading-none text-pm-text-primary">
          {displayValue}
        </span>
        {suffix && (
          <span className="text-sm text-pm-text-muted">{suffix}</span>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay / 1000 + 0.6, duration: 0.3 }}
          className="flex items-center gap-1"
        >
          {trendUp && <TrendingUp className="w-3.5 h-3.5 text-pm-success" />}
          {trendDown && <TrendingDown className="w-3.5 h-3.5 text-pm-error" />}
          {trendFlat && <Minus className="w-3.5 h-3.5 text-pm-neutral" />}
          <span
            className={`text-xs font-medium ${
              trendUp ? 'text-pm-success' : trendDown ? 'text-pm-error' : 'text-pm-neutral'
            }`}
          >
            {trendUp ? '+' : ''}{trend}{trendLabel || ''}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
