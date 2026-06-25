import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DailyData {
  date: string;
  answered: number;
  correct: number;
}

interface DailyVolumeProps {
  data: DailyData[];
  delay?: number;
}

export default function DailyVolume({ data, delay = 0 }: DailyVolumeProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[d.getDay()];
  };

  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

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
        每日答题量
      </h3>
      <p className="text-sm text-pm-text-secondary mb-4">
        {chartData.length > 0 ? `近 ${chartData.length} 天每日练习题目数量` : '每日练习统计'}
      </p>

      {chartData.length === 0 || chartData.every((d) => d.answered === 0) ? (
        <div className="h-[240px] flex items-center justify-center text-pm-text-muted text-sm">
          该时段暂无数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              allowDecimals={false}
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
                return [value, name === 'answered' ? '答题数' : '正确数'];
              }}
            />
            <Bar dataKey="answered" fill="#0F4C81" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
