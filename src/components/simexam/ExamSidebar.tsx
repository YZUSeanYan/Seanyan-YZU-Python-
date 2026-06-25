import { motion } from 'framer-motion';
import { User, FileText, Edit3, Bug, Code } from 'lucide-react';
import type { QuestionType } from '@/types';
import type { Question } from '@/types';

interface ExamSection {
  type: QuestionType;
  label: string;
  count: number;
  questions: Question[];
}

interface ExamSidebarProps {
  sections: ExamSection[];
  activeSectionIdx: number;
  answers: Record<number, string>;
  studentId?: string;
  studentName?: string;
  onSwitchSection: (index: number) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  'single': <FileText className="w-4 h-4" />,
  'fill': <Edit3 className="w-4 h-4" />,
  'codeFix': <Bug className="w-4 h-4" />,
  'codeFill': <Code className="w-4 h-4" />,
};

export default function ExamSidebar({
  sections,
  activeSectionIdx,
  answers,
  studentId,
  studentName,
  onSwitchSection,
}: ExamSidebarProps) {
  return (
    <motion.div
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="w-[220px] bg-[#F0F0F0] flex flex-col shrink-0 border-r border-[#D4D4D4]"
    >
      {/* Avatar & Student Info */}
      <div className="flex flex-col items-center pt-6 pb-4 border-b border-[#D4D4D4]">
        {/* Green Avatar */}
        <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#4ADE80] via-[#22C55E] to-[#16A34A] flex items-center justify-center shadow-md mb-3">
          <User className="w-9 h-9 text-white" />
        </div>
        <p className="text-[13px] text-pm-text-primary font-mono mb-0.5">{studentId || '未登录'}</p>
        <p className="text-[14px] text-pm-text-primary font-medium mb-0.5">{studentName || '考生'}</p>
        <p className="text-[12px] text-pm-text-secondary font-mono">PYTHON-1</p>
      </div>

      {/* Question Type Buttons */}
      <div className="flex-1 py-3 px-2 space-y-1.5 overflow-y-auto">
        {sections.map((section, idx) => {
          const answeredCount = section.questions.filter(
            (q) => answers[q.id] !== undefined && answers[q.id] !== ''
          ).length;
          const isActive = idx === activeSectionIdx;

          return (
            <motion.button
              key={section.type}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSwitchSection(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-left transition-all duration-200 ${
                isActive
                  ? 'bg-[#0F4C81] text-white shadow-md'
                  : 'bg-white text-pm-text-primary hover:bg-[#E8E8E8] border border-[#D4D4D4]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-pm-text-secondary'}>
                {typeIcons[section.type]}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium block truncate">
                  {section.label}(共{section.count}题)
                </span>
                <span className={`text-[11px] ${isActive ? 'text-white/70' : 'text-pm-text-muted'}`}>
                  已答 {answeredCount}/{section.count}
                </span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="w-1.5 h-1.5 rounded-full bg-white shrink-0"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="px-3 py-3 border-t border-[#D4D4D4]">
        <p className="text-[11px] text-pm-text-muted text-center">
          考试题目单元：
        </p>
        <div className="mt-1 space-y-0.5">
          {sections.map((s, i) => (
            <p key={s.type} className="text-[11px] text-pm-text-secondary text-center">
              {i + 1}. {s.label}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
