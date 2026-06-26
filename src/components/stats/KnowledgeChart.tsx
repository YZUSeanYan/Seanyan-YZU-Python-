import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CategoryData {
  category: string;
  answered: number;
  correct: number;
  rate: number;
}

interface KnowledgeChartProps {
  data: CategoryData[];
  delay?: number;
}

export default function KnowledgeChart({ data, delay = 0 }: KnowledgeChartProps) {
  const sorted = [...data].sort((a, b) => a.rate - b.rate);

  const getBarColor = (rate: number) => {
    if (rate >= 75) return '#27AE60';
    if (rate >= 50) return '#E9A23B';
    return '#E74C3C';
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
        知识点掌握情况
      </h3>
      <p className="text-sm text-pm-text-secondary mb-4">各知识点分类的正确率排名</p>

      {sorted.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-pm-text-muted text-sm">
          暂无数据，开始练习后将在这里显示
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
              formatter={(value: unknown, _name: unknown, props: { payload?: Partial<CategoryData> }) => {
                const rate = Number(value) || 0;
                const correct = props.payload?.correct ?? 0;
                const answered = props.payload?.answered ?? 0;
                return [`${rate}% (${correct}/${answered})`, '正确率'];
              }}
            />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={24}>
              {sorted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-pm-text-muted">
          <span className="w-3 h-3 rounded-sm bg-pm-success" />
          掌握 (&gt;75%)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-pm-text-muted">
          <span className="w-3 h-3 rounded-sm bg-pm-orange" />
          一般 (50-75%)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-pm-text-muted">
          <span className="w-3 h-3 rounded-sm bg-pm-error" />
          薄弱 (&lt;50%)
        </span>
      </div>
    </motion.div>
  );
}
