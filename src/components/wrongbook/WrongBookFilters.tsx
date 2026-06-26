import { motion } from 'framer-motion';
import { Search, Play, CheckSquare } from 'lucide-react';
import type { QuestionType } from '@/types';

interface WrongBookFiltersProps {
  selectedType: QuestionType | 'all';
  selectedStatus: 'all' | 'unmastered' | 'mastered';
  searchQuery: string;
  sortBy: string;
  typeCounts: Record<string, number>;
  onTypeChange: (type: QuestionType | 'all') => void;
  onStatusChange: (status: 'all' | 'unmastered' | 'mastered') => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: string) => void;
  onStartRetry: () => void;
  onToggleBatchMode: () => void;
  batchMode: boolean;
}

const typeTabs: { key: QuestionType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'single', label: '单选题' },
  { key: 'fill', label: '填空题' },
  { key: 'codeFill', label: '程序填空' },
  { key: 'codeFix', label: '程序改错' },
];

const typeDotColors: Record<string, string> = {
  'single': 'var(--pm-primary)',
  'fill': 'var(--pm-accent)',
  'codeFill': 'var(--pm-purple)',
  'codeFix': 'var(--pm-orange)',
};

export default function WrongBookFilters({
  selectedType,
  selectedStatus,
  searchQuery,
  sortBy,
  typeCounts,
  onTypeChange,
  onStatusChange,
  onSearchChange,
  onSortChange,
  onStartRetry,
  onToggleBatchMode,
  batchMode,
}: WrongBookFiltersProps) {
  const getCount = (type: QuestionType | 'all') => {
    if (type === 'all') return Object.values(typeCounts).reduce((a, b) => a + b, 0);
    return typeCounts[type] || 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-4"
    >
      {/* Type filter tabs */}
      <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTypeChange(tab.key)}
            className="relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pm-md text-sm font-medium transition-colors"
            style={{
              color: selectedType === tab.key ? 'var(--pm-primary)' : 'var(--pm-text-secondary)',
              background: selectedType === tab.key ? 'var(--pm-primary-light)' : 'transparent',
            }}
          >
            {tab.key !== 'all' && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: typeDotColors[tab.key] || 'var(--pm-neutral)' }}
              />
            )}
            {tab.label}
            <span
              className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: selectedType === tab.key ? 'var(--pm-primary)' : 'var(--pm-bg-primary)',
                color: selectedType === tab.key ? '#FFFFFF' : 'var(--pm-text-muted)',
              }}
            >
              {getCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Status select */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as 'all' | 'unmastered' | 'mastered')}
          className="w-full sm:w-auto px-3 py-1.5 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-sm text-pm-text-primary focus:outline-none focus:border-pm-border-focus cursor-pointer"
        >
          <option value="all">全部状态</option>
          <option value="unmastered">待复习</option>
          <option value="mastered">已掌握</option>
        </select>

        {/* Sort select */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-sm text-pm-text-primary focus:outline-none focus:border-pm-border-focus cursor-pointer"
        >
          <option value="recent">最近答错</option>
          <option value="count">错题次数</option>
          <option value="difficulty-asc">难度递增</option>
          <option value="difficulty-desc">难度递减</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 w-full min-w-0 sm:min-w-[180px] sm:max-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索错题..."
            className="w-full pl-9 pr-3 py-1.5 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-sm text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-pm-border-focus"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {/* Batch mode toggle */}
          <button
            onClick={onToggleBatchMode}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-pm-md text-sm font-medium transition-colors"
            style={{
              background: batchMode ? 'var(--pm-primary-light)' : 'transparent',
              color: batchMode ? 'var(--pm-primary)' : 'var(--pm-text-secondary)',
              border: batchMode ? '1px solid var(--pm-primary)' : '1px solid var(--pm-border-color)',
            }}
          >
            <CheckSquare className="w-4 h-4" />
            批量选择
          </button>

          {/* Retry button */}
          <button
            onClick={onStartRetry}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-1.5 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
          >
            <Play className="w-4 h-4" />
            开始重刷
          </button>
        </div>
      </div>
    </motion.div>
  );
}
