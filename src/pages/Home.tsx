import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Target,
  AlertCircle,
  Flame,
  ListChecks,
  PenLine,
  Code,
  Bug,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { HeroBg } from '@/components/SvgAssets';
import { useQuestions } from '@/hooks/useQuestions';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useWrongBook } from '@/hooks/useWrongBook';
import type { QuestionType } from '@/types';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

const typeCardBase: Omit<
  {
    type: QuestionType;
    label: string;
    icon: React.ElementType;
    desc: string;
    color: string;
    colorKey: string;
  },
  'count'
>[] = [
  {
    type: 'single',
    label: '单选题',
    icon: ListChecks,
    desc: '从四个选项中选择正确答案',
    colorKey: 'primary',
    color: '#0F4C81',
  },
  {
    type: 'fill',
    label: '填空题',
    icon: PenLine,
    desc: '填写正确的代码或值',
    colorKey: 'accent',
    color: '#2A9D8F',
  },
  {
    type: 'codeFill',
    label: '程序填空题',
    icon: Code,
    desc: '补全代码中的空缺部分',
    colorKey: 'purple',
    color: '#6C5CE7',
  },
  {
    type: 'codeFix',
    label: '程序改错题',
    icon: Bug,
    desc: '找出并修正代码中的错误',
    colorKey: 'orange',
    color: '#E9A23B',
  },
];

const typeAbbrev: Record<string, string> = {
  'single': '选',
  'fill': '填',
  'codeFill': '程',
  'codeFix': '改',
};

const typeColorMap: Record<string, string> = {
  'single': '#0F4C81',
  'fill': '#2A9D8F',
  'codeFill': '#6C5CE7',
  'codeFix': '#E9A23B',
};

/* ---------- Hero Section ---------- */
function HeroSection({ totalQuestions }: { totalQuestions: number }) {
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '320px' }}>
      {/* Background */}
      <div className="absolute inset-0 animate-hero-bg-drift">
        <HeroBg className="w-full h-full object-cover" />
      </div>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FA 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex flex-col justify-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.2 }}
          className="font-heading font-bold text-pm-text-primary mb-3 text-[28px] sm:text-[36px] lg:text-[48px] leading-tight"
        >
          Python 期末备考，现在开始
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.35 }}
          className="text-base text-pm-text-secondary mb-8"
        >
          {totalQuestions} 道精选题目 · 四大题型 · 智能错题本 · 学习统计
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.5 }}
          className="flex flex-col sm:flex-row flex-wrap gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/practice')}
            className="flex items-center gap-2 px-6 py-3 bg-pm-primary text-white rounded-pm-md font-medium text-sm shadow-pm-primary transition-colors hover:bg-pm-primary-hover"
          >
            继续练习
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/sim-exam')}
            className="flex items-center gap-2 px-6 py-3 bg-pm-bg-card text-pm-primary border border-pm-primary rounded-pm-md font-medium text-sm transition-colors hover:bg-pm-primary-light"
          >
            仿真考试
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/wrongbook')}
            className="flex items-center gap-2 px-6 py-3 text-pm-error font-medium text-sm transition-colors hover:bg-pm-error-light rounded-pm-md"
          >
            <BookOpen className="w-4 h-4" />
            错题重刷
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Stats Overview ---------- */
function StatsSection({
  totalAnswered,
  correctRate,
  wrongCount,
  streakDays,
  isEmpty,
  totalQuestions,
}: {
  totalAnswered: number;
  correctRate: number;
  wrongCount: number;
  streakDays: number;
  isEmpty: boolean;
  totalQuestions: number;
}) {
  const cards = [
    {
      label: '已练习',
      value: isEmpty ? '—' : `${totalAnswered} / ${totalQuestions}`,
      icon: CheckCircle,
      color: '#0F4C81',
    },
    {
      label: '正确率',
      value: isEmpty ? '—' : `${correctRate}%`,
      icon: Target,
      color: '#2A9D8F',
    },
    {
      label: '待复习',
      value: isEmpty ? '—' : `${wrongCount}`,
      icon: AlertCircle,
      color: '#E74C3C',
    },
    {
      label: '连续学习',
      value: isEmpty ? '—' : `${streakDays} 天`,
      icon: Flame,
      color: '#E9A23B',
    },
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6" style={{ padding: '48px 24px' }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: i * 0.1 }}
            whileHover={{ y: -4, boxShadow: 'var(--pm-shadow-lg)' }}
            className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-6 transition-shadow"
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--pm-text-muted)', letterSpacing: '0.05em' }}
              >
                {card.label}
              </span>
            </div>
            <div
              className="font-heading font-bold text-pm-text-primary"
              style={{ fontSize: '28px', lineHeight: 1 }}
            >
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Quick Start ---------- */
function QuickStartSection({ typeCounts }: { typeCounts: Record<string, number> }) {
  const navigate = useNavigate();

  const typeCardData = useMemo(
    () =>
      typeCardBase.map((card) => ({
        ...card,
        count: typeCounts[card.type] || 0,
      })),
    [typeCounts]
  );

  return (
    <section className="max-w-[1200px] mx-auto px-6" style={{ padding: '48px 24px' }}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="font-heading font-semibold text-pm-text-primary mb-1"
        style={{ fontSize: '28px', lineHeight: 1.25 }}
      >
        选择练习题型
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.1 }}
        className="text-base text-pm-text-secondary mb-8"
      >
        根据你的需要选择题型开始练习
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {typeCardData.map((card, i) => (
          <motion.div
            key={card.type}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: i * 0.12 }}
            whileHover={{ y: -4, boxShadow: 'var(--pm-shadow-lg)' }}
            whileTap={{ scale: 0.98 }}
            className="relative bg-pm-bg-card rounded-pm-xl shadow-pm-md overflow-hidden cursor-pointer transition-shadow"
            style={{ minHeight: '180px' }}
            onClick={() => navigate(`/practice?type=${card.type}`)}
          >
            {/* Left color bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: card.color }}
            />

            <div className="p-6 pl-7 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <span
                  className="px-2.5 py-1 rounded-pm-sm text-xs font-semibold"
                  style={{
                    backgroundColor: `${card.color}15`,
                    color: card.color,
                  }}
                >
                  {card.count} 题
                </span>
              </div>

              <h3
                className="font-heading font-semibold mb-1"
                style={{ fontSize: '22px', lineHeight: 1.3, color: card.color }}
              >
                {card.label}
              </h3>
              <p className="text-sm text-pm-text-secondary mb-5">{card.desc}</p>

              <div className="mt-auto flex items-center gap-1 text-sm font-medium" style={{ color: card.color }}>
                开始练习
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Recent Activity ---------- */
function RecentActivitySection({
  isEmpty,
}: {
  isEmpty: boolean;
}) {
  // Generate last 7 days activity
  const weekDays = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 8) });
    }
    return days;
  }, []);

  // Mock recent activity data for display
  const mockActivities = [
    { questionId: 1, type: 'single', content: '关于turtle库的画笔控制函数，以下选项中描述正确的是', isCorrect: true, time: '2 小时前' },
    { questionId: 5, type: 'single', content: '以下选项中，不属于Python语言关键字的是', isCorrect: false, time: '3 小时前' },
    { questionId: 16, type: 'fill', content: '访问字符串中的部分字符的操作称为', isCorrect: true, time: '5 小时前' },
    { questionId: 20, type: 'single', content: '以下选项中，描述正确的是', isCorrect: true, time: '昨天' },
    { questionId: 33, type: 'fill', content: 'Python中用于表示逻辑与、逻辑或、逻辑非的关键字分别是', isCorrect: false, time: '昨天' },
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6" style={{ padding: '48px 24px' }}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="font-heading font-semibold text-pm-text-primary mb-6"
        style={{ fontSize: '28px', lineHeight: 1.25 }}
      >
        最近练习
      </motion.h2>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Activity List */}
        <div className="flex-1">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-8 text-center"
            >
              <p className="text-pm-text-secondary mb-2">
                你还没有开始练习，选择上方题型开始吧！
              </p>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-pm-primary"
              >
                <ArrowRight className="w-5 h-5 mx-auto rotate-90" />
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {mockActivities.map((act, i) => {
                const color = typeColorMap[act.type] || '#0F4C81';
                return (
                  <motion.div
                    key={`${act.questionId}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: easeOutExpo, delay: i * 0.08 }}
                    className="flex items-center gap-3 bg-pm-bg-card rounded-pm-md shadow-pm-sm p-3"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {typeAbbrev[act.type] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-pm-text-primary truncate">
                        {act.content.substring(0, 30)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {act.isCorrect ? (
                        <Check className="w-4 h-4 text-pm-success" />
                      ) : (
                        <X className="w-4 h-4 text-pm-error" />
                      )}
                      <span className="text-xs text-pm-text-muted">
                        {act.time}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Heatmap */}
        <div className="lg:w-64">
          <div className="bg-pm-bg-card rounded-pm-lg shadow-pm-md p-4">
            <p className="text-xs text-pm-text-muted mb-3 uppercase tracking-wider" style={{ letterSpacing: '0.05em' }}>
              近7天活动
            </p>
            <div className="flex gap-2">
              {weekDays.map((day, i) => {
                const intensity = Math.min(day.count / 8, 1);
                return (
                  <motion.div
                    key={day.date}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, ease: easeSpring, delay: i * 0.04 }}
                    className="flex-1 aspect-square rounded-pm-sm"
                    style={{
                      backgroundColor:
                        day.count === 0
                          ? '#F1F5F9'
                          : `rgba(15, 76, 129, ${0.15 + intensity * 0.85})`,
                    }}
                    title={`${day.date}: ${day.count} 题`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
                <span key={d} className="flex-1 text-center text-[10px] text-pm-text-muted">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Daily Challenge ---------- */
function DailyChallengeSection() {
  const navigate = useNavigate();

  // Static daily challenge
  const challenge = {
    question: '以下选项中的Python语句正确的是______。',
    type: 'single' as QuestionType,
  };

  const timeLeft = '08:32:15';

  return (
    <section className="max-w-[1200px] mx-auto px-6" style={{ padding: '48px 24px 80px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="relative overflow-hidden rounded-pm-xl shadow-pm-lg animate-hue-shift"
        style={{
          background: 'linear-gradient(135deg, #0F4C81 0%, #2A9D8F 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-8 gap-6">
          {/* Left */}
          <div className="flex-1">
            <span
              className="inline-block px-3 py-1 rounded-pm-sm text-xs font-medium mb-3"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
              }}
            >
              每日挑战
            </span>
            <p className="text-white text-base mb-3 leading-relaxed opacity-95">
              {challenge.question.substring(0, 40)}...
            </p>
            <span
              className="inline-block px-2.5 py-0.5 rounded-pm-sm text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }}
            >
              单选题
            </span>
          </div>

          {/* Right */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/practice')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-pm-primary rounded-pm-md font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
            >
              接受挑战
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              距离下次刷新: {timeLeft}
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- Home Page ---------- */
export default function Home() {
  const { loading, questions, typeCounts } = useQuestions();
  const { stats, isEmpty } = useStudyStats();
  const { unmasteredCount } = useWrongBook();
  const totalQuestions = questions.length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-pm-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <HeroSection totalQuestions={totalQuestions} />
      <StatsSection
        totalAnswered={stats.totalAnswered}
        correctRate={stats.correctRate}
        wrongCount={unmasteredCount}
        streakDays={stats.streakDays}
        isEmpty={isEmpty}
        totalQuestions={totalQuestions}
      />
      <QuickStartSection typeCounts={typeCounts} />
      <RecentActivitySection isEmpty={isEmpty} />
      <DailyChallengeSection />
    </div>
  );
}
