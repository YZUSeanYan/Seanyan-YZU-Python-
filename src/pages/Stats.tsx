import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, AlertCircle, Clock } from 'lucide-react';
import StatCard from '@/components/stats/StatCard';
import ProgressRing from '@/components/stats/ProgressRing';
import AccuracyTrend from '@/components/stats/AccuracyTrend';
import KnowledgeChart from '@/components/stats/KnowledgeChart';
import WeakAreas from '@/components/stats/WeakAreas';
import StudyHeatmap from '@/components/stats/StudyHeatmap';
import DailyVolume from '@/components/stats/DailyVolume';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useWrongBook } from '@/hooks/useWrongBook';
import { useQuestions } from '@/hooks/useQuestions';
import { EmptyState } from '@/components/SvgAssets';

type TimeRange = '7d' | '30d' | 'all';

export default function Stats() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const { stats, getWeeklyActivity } = useStudyStats();
  const { wrongAnswers } = useWrongBook();
  const { questions, typeCounts } = useQuestions();

  const weeklyActivity = getWeeklyActivity();

  // Accuracy trend data (fill gaps with 0)
  const trendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 30;
    const result: { date: string; answered: number; correct: number; rate: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = stats.dailyActivity.find((a) => a.date === dateStr);
      if (found) {
        result.push({
          ...found,
          rate: found.answered > 0 ? Math.round((found.correct / found.answered) * 100) : 0,
        });
      } else {
        result.push({ date: dateStr, answered: 0, correct: 0, rate: 0 });
      }
    }
    return result;
  }, [stats.dailyActivity, timeRange]);

  // Category data for knowledge chart
  const categoryData = useMemo(() => {
    return stats.byCategory.map((c) => ({
      category: c.category,
      answered: c.answered,
      correct: c.correct,
      rate: c.answered > 0 ? Math.round((c.correct / c.answered) * 100) : 0,
    }));
  }, [stats.byCategory]);

  // Weak areas (rate < 60%)
  const weakAreasData = useMemo(() => {
    return stats.byCategory
      .filter((c) => c.answered >= 2 && c.correct / c.answered < 0.6)
      .map((c) => ({
        category: c.category,
        answered: c.answered,
        correct: c.correct,
        rate: Math.round((c.correct / c.answered) * 100),
        questionCount: c.answered,
      }))
      .sort((a, b) => a.rate - b.rate);
  }, [stats.byCategory]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    return stats.dailyActivity.map((d) => ({
      date: d.date,
      count: d.answered,
    }));
  }, [stats.dailyActivity]);

  // Progress data
  const totalQuestions = questions.length;
  const progressPercent = Math.round((stats.totalAnswered / totalQuestions) * 100);

  const typeBreakdown = useMemo(() => {
    const typeTotals: Record<string, number> = {
      'single': typeCounts['single'] || 0,
      'fill': typeCounts['fill'] || 0,
      'codeFill': typeCounts['codeFill'] || 0,
      'codeFix': typeCounts['codeFix'] || 0,
    };
    return stats.byType.map((t) => ({
      type: t.type,
      answered: t.answered,
      total: typeTotals[t.type] || 0,
      correct: t.correct,
      rate: t.answered > 0 ? Math.round((t.correct / t.answered) * 100) : 0,
    }));
  }, [stats.byType, typeCounts]);

  const typeColors: Record<string, string> = {
    'single': '#0F4C81',
    'fill': '#2A9D8F',
    'codeFill': '#6C5CE7',
    'codeFix': '#E9A23B',
  };

  const typeLabels: Record<string, string> = {
    'single': '单选题',
    'fill': '填空题',
    'codeFill': '程序填空',
    'codeFix': '程序改错',
  };

  // Empty state
  if (stats.totalAnswered === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-20"
      >
        {/* Header */}
        <div className="bg-pm-bg-card border-b border-pm-border px-4 sm:px-6 py-6 sm:py-8 rounded-pm-xl mb-8">
          <p className="text-xs text-pm-text-muted mb-2">首页 &gt; 学习统计</p>
          <h1 className="font-heading text-[28px] sm:text-[36px] font-bold text-pm-text-primary mb-2">
            学习统计
          </h1>
          <p className="text-pm-text-secondary">追踪你的学习进度，发现薄弱环节</p>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <EmptyState className="w-[200px] h-[150px] mb-6" />
          <h3 className="font-heading text-[22px] font-semibold text-pm-text-primary mb-2">
            还没有学习数据
          </h3>
          <p className="text-pm-text-secondary text-sm mb-6">
            开始练习后，这里会展示你的学习统计和分析。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="#/practice"
              className="px-6 py-2.5 bg-pm-primary text-white rounded-pm-full text-sm font-medium hover:bg-pm-primary-hover transition-colors text-center"
            >
              开始练习
            </a>
            <a
              href="#/exam"
              className="px-6 py-2.5 border border-pm-primary text-pm-primary rounded-pm-full text-sm font-medium hover:bg-pm-primary-light transition-colors text-center"
            >
              模拟考试
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16 sm:pb-20"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="bg-pm-bg-card border-b border-pm-border px-4 sm:px-6 py-6 sm:py-8 rounded-pm-xl mt-4 sm:mt-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p className="text-xs text-pm-text-muted mb-2">首页 &gt; 学习统计</p>
          <h1 className="font-heading text-[28px] sm:text-[36px] font-bold text-pm-text-primary mb-1">
            学习统计
          </h1>
          <p className="text-pm-text-secondary text-sm">追踪你的学习进度，发现薄弱环节</p>
        </div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex bg-pm-bg-primary rounded-pm-md p-1"
        >
          {([
            { value: '7d', label: '近 7 天' },
            { value: '30d', label: '近 30 天' },
            { value: 'all', label: '全部' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`px-4 py-2 rounded-pm-md text-sm font-medium transition-all duration-200 ${
                timeRange === opt.value
                  ? 'bg-pm-primary text-white'
                  : 'text-pm-text-secondary hover:text-pm-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
        <StatCard
          icon={BookOpen}
          iconColor="#0F4C81"
          label="总练习"
          value={stats.totalAnswered}
          trend={weeklyActivity.reduce((sum, d) => sum + d.answered, 0)}
          trendLabel=" 本周"
          delay={0}
        />
        <StatCard
          icon={Target}
          iconColor="#2A9D8F"
          label="正确率"
          value={stats.correctRate}
          suffix="%"
          delay={100}
        />
        <StatCard
          icon={AlertCircle}
          iconColor="#E74C3C"
          label="错题数"
          value={wrongAnswers.filter((w) => !w.isMastered).length}
          delay={200}
        />
        <StatCard
          icon={Clock}
          iconColor="#E9A23B"
          label="学习时长"
          value={Math.floor(stats.totalAnswered * 0.8)}
          suffix=" 分钟"
          trend={Math.floor(weeklyActivity.reduce((sum, d) => sum + d.answered, 0) * 0.8)}
          trendLabel=" 分钟本周"
          delay={300}
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Overall Progress Ring */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-5 sm:p-8"
        >
          <h3 className="font-heading text-[22px] font-semibold text-pm-text-primary mb-6">
            总体进度
          </h3>
          <div className="flex flex-col items-center">
            <ProgressRing
              progress={progressPercent}
              size={180}
              strokeWidth={10}
              color="#0F4C81"
              label={`${progressPercent}%`}
              sublabel={`已练习 ${stats.totalAnswered} / ${totalQuestions} 题`}
              delay={400}
            />
          </div>

          {/* Type sub-rings */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            {typeBreakdown.map((t, idx) => {
              const pct = Math.round((t.answered / t.total) * 100);
              return (
                <div key={t.type} className="flex flex-col items-center">
                  <div className="relative w-16 h-16">
                    <svg width={64} height={64} className="-rotate-90">
                      <circle cx={32} cy={32} r={26} fill="none" stroke="#E2E8F0" strokeWidth={5} />
                      <motion.circle
                        cx={32}
                        cy={32}
                        r={26}
                        fill="none"
                        stroke={typeColors[t.type]}
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 26}
                        initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 26 - (pct / 100) * 2 * Math.PI * 26 }}
                        transition={{ duration: 0.8, delay: 0.5 + idx * 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-pm-text-primary">{pct}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-pm-text-muted mt-1.5 text-center leading-tight">
                    {typeLabels[t.type]}
                  </span>
                  <span className="text-[10px] text-pm-text-muted">
                    {t.answered}/{t.total}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Type Accuracy Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-5 sm:p-8"
        >
          <h3 className="font-heading text-[22px] font-semibold text-pm-text-primary mb-6">
            各题型正确率
          </h3>
          <div className="space-y-5">
            {typeBreakdown.map((t, idx) => (
              <div key={t.type}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-pm-text-primary font-medium">{typeLabels[t.type]}</span>
                  <span className="text-sm text-pm-text-secondary">{t.rate}%</span>
                </div>
                <div className="w-full h-3 bg-pm-bg-primary rounded-pm-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-pm-full"
                    style={{ backgroundColor: typeColors[t.type] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.rate}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.5 + idx * 0.1,
                      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                    }}
                  />
                </div>
                <p className="text-xs text-pm-text-muted mt-1">
                  已答 {t.answered} 题 · 正确 {t.correct} 题
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <AccuracyTrend data={trendData} delay={500} />
        <KnowledgeChart data={categoryData} delay={600} />
      </div>

      {/* Weak Areas */}
      <div className="mb-6">
        <WeakAreas areas={weakAreasData} delay={700} />
      </div>

      {/* Study Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StudyHeatmap data={heatmapData} delay={800} />
        <DailyVolume data={trendData} delay={900} />
      </div>
    </motion.div>
  );
}
