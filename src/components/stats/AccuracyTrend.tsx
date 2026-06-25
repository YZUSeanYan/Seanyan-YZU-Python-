import { motion } from 'framer-motion';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface DailyData {
  date: string;
  answered: number;
  correct: number;
  rate: number;
}

interface AccuracyTrendProps {
  data: DailyData[];
  delay?: number;
}

export default function AccuracyTrend({ data, delay = 0 }: AccuracyTrendProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
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
      className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-6"
    >
      <h3 className="font-heading text-[22px] font-semibold text-pm-text-primary mb-1">
        正确率趋势
      </h3>
      <p className="text-sm text-pm-text-secondary mb-4">每日答题正确率变化</p>

      {data.length === 0 || data.every((d) => d.answered === 0) ? (
        <div className="h-[240px] flex items-center justify-center text-pm-text-muted text-sm">
          该时段暂无数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F4C81" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#0F4C81" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'rate') return [`${value}%`, '正确率'];
                return [value, name === 'answered' ? '答题数' : '正确数'];
              }}
              labelFormatter={(label: string) => formatDate(label)}
            />
            <Area
              type="monotone"
              dataKey="rate"
              fill="url(#areaFill)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#0F4C81"
              strokeWidth={2}
              dot={{ r: 4, fill: '#0F4C81', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#0F4C81', strokeWidth: 2, stroke: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
