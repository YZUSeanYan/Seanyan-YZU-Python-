import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { QuestionType, Difficulty } from '@/types';

interface FilterPanelProps {
  selectedType: QuestionType | 'all';
  selectedDifficulty: Difficulty | 'all';
  selectedCategory: string;
  searchQuery: string;
  availableCategories: string[];
  filteredCount: number;
  onTypeChange: (type: QuestionType | 'all') => void;
  onDifficultyChange: (diff: Difficulty | 'all') => void;
  onCategoryChange: (cat: string) => void;
  onSearchChange: (query: string) => void;
}

const typeTabs: { key: QuestionType | 'all'; label: string; shortLabel: string }[] = [
  { key: 'all', label: '全部', shortLabel: '全部' },
  { key: 'single', label: '单选题', shortLabel: '单选' },
  { key: 'fill', label: '填空题', shortLabel: '填空' },
  { key: 'codeFill', label: '程序填空', shortLabel: '程填' },
  { key: 'codeFix', label: '程序改错', shortLabel: '程改' },
];

export default function FilterPanel({
  selectedType,
  selectedDifficulty,
  selectedCategory,
  searchQuery,
  availableCategories,
  filteredCount,
  onTypeChange,
  onDifficultyChange,
  onCategoryChange,
  onSearchChange,
}: FilterPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="bg-pm-bg-card border-b border-pm-border-color"
    >
      <div className="max-w-[1200px] mx-auto px-6 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-pm-text-muted mb-3">
          <span>首页</span>
          <span>&gt;</span>
          <span className="text-pm-primary font-medium">练习模式</span>
          {selectedType !== 'all' && (
            <>
              <span>&gt;</span>
              <span className="text-pm-primary font-medium">
                {typeTabs.find((t) => t.key === selectedType)?.label}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="font-heading text-[36px] font-bold text-pm-text-primary mb-1"
        >
          {selectedType === 'all' ? '全部题目' : typeTabs.find((t) => t.key === selectedType)?.label}
        </motion.h1>
        <p className="text-sm text-pm-text-secondary mb-4">
          当前筛选条件下共 <span className="font-semibold text-pm-primary">{filteredCount}</span> 道题目
        </p>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type tabs - horizontal scroll on mobile */}
          <div className="flex items-center gap-1 bg-pm-bg-primary rounded-pm-md p-1 overflow-x-auto max-w-full scrollbar-hide">
            {typeTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTypeChange(tab.key)}
                className="relative px-2.5 sm:px-3 py-1.5 rounded-pm-sm text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                style={{
                  color: selectedType === tab.key ? 'var(--pm-primary)' : 'var(--pm-text-secondary)',
                  background: selectedType === tab.key ? 'var(--pm-bg-card)' : 'transparent',
                }}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {selectedType === tab.key && (
                  <motion.div
                    layoutId="type-tab-indicator"
                    className="absolute bottom-0 left-1 right-1 sm:left-2 sm:right-2 h-0.5 bg-pm-primary rounded-full"
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Difficulty select */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-pm-text-muted" />
            <select
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value as Difficulty | 'all')}
              className="px-3 py-1.5 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-sm text-pm-text-primary focus:outline-none focus:border-pm-border-focus cursor-pointer"
            >
              <option value="all">全部难度</option>
              <option value="easy">易</option>
              <option value="medium">中</option>
              <option value="hard">难</option>
            </select>
          </div>

          {/* Category select */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-1.5 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-sm text-pm-text-primary focus:outline-none focus:border-pm-border-focus cursor-pointer"
          >
            <option value="all">全部知识点</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索题目关键词..."
              className="w-full pl-9 pr-3 py-1.5 rounded-pm-md bg-pm-bg-primary border border-pm-border-color text-sm text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-pm-border-focus"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
