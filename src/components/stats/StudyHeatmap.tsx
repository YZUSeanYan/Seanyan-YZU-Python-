import { motion } from 'framer-motion';

interface HeatmapDay {
  date: string;
  count: number;
}

interface StudyHeatmapProps {
  data: HeatmapDay[];
  delay?: number;
}

const colorLevels = [
  { min: 0, max: 0, color: '#E2E8F0' },
  { min: 1, max: 3, color: '#B8D4E8' },
  { min: 4, max: 7, color: '#6BA3D0' },
  { min: 8, max: 15, color: '#2E7DB8' },
  { min: 16, max: Infinity, color: '#0F4C81' },
];

function getColor(count: number): string {
  for (const level of colorLevels) {
    if (count >= level.min && count <= level.max) return level.color;
  }
  return '#E2E8F0';
}

function getLevelLabel(count: number): string {
  if (count === 0) return '0';
  if (count <= 3) return '1-3';
  if (count <= 7) return '4-7';
  if (count <= 15) return '8-15';
  return '16+';
}

export default function StudyHeatmap({ data, delay = 0 }: StudyHeatmapProps) {
  // Build 26 weeks (182 days) grid
  const today = new Date();
  const days: HeatmapDay[] = [];
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = data.find((item) => item.date === dateStr);
    days.push({ date: dateStr, count: found ? found.count : 0 });
  }

  // Group into weeks
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const dayLabels = ['一', '三', '五', '日'];

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
        学习活跃度
      </h3>
      <p className="text-sm text-pm-text-secondary mb-4">每日练习题目数量</p>

      {/* Heatmap Grid */}
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pt-6">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[12px] flex items-center">
              <span className="text-[10px] text-pm-text-muted w-4">{label}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {week.map((day, dayIdx) => (
              <motion.div
                key={day.date}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.3,
                  delay: delay / 1000 + weekIdx * 0.01 + dayIdx * 0.005,
                  ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                }}
                className="w-[12px] h-[12px] rounded-sm"
                style={{ backgroundColor: getColor(day.count) }}
                title={`${day.date}: ${day.count} 题`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 justify-end">
        <span className="text-[10px] text-pm-text-muted">少</span>
        {colorLevels.map((level, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className="w-[12px] h-[12px] rounded-sm"
              style={{ backgroundColor: level.color }}
            />
            <span className="text-[9px] text-pm-text-muted">{getLevelLabel(level.min)}</span>
          </div>
        ))}
        <span className="text-[10px] text-pm-text-muted">多</span>
      </div>
    </motion.div>
  );
}
