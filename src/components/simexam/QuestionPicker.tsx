import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { QuestionType } from '@/types';
import type { Question } from '@/types';

interface ExamSection {
  type: QuestionType;
  label: string;
  count: number;
  questions: Question[];
}

interface QuestionPickerProps {
  sections: ExamSection[];
  activeSectionIdx: number;
  activeQuestionIdx: number;
  answers: Record<number, string>;
  onClose: () => void;
  onJump: (sectionIdx: number, questionIdx: number) => void;
}

export default function QuestionPicker({ sections, activeSectionIdx, activeQuestionIdx, answers, onClose, onJump }: QuestionPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="bg-white rounded-lg shadow-xl w-[500px] max-h-[70vh] flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0]">
          <h3 className="text-[15px] font-semibold text-pm-text-primary">选题面板</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
          >
            <X className="w-4 h-4 text-pm-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {sections.map((section, sectionIdx) => {
            const sectionOffset = sections.slice(0, sectionIdx).reduce((s, sec) => s + sec.questions.length, 0);
            return (
              <div key={section.type}>
                <h4 className="text-[13px] font-medium text-pm-text-secondary mb-2">
                  {section.label}（共{section.count}题）
                </h4>
                <div className="grid grid-cols-8 gap-1.5">
                  {section.questions.map((q, qIdx) => {
                    const isCurrent = sectionIdx === activeSectionIdx && qIdx === activeQuestionIdx;
                    const isAnswered = Boolean(answers[q.id]?.trim());
                    const globalNum = sectionOffset + qIdx + 1;

                    return (
                      <motion.button
                        key={q.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onJump(sectionIdx, qIdx)}
                        className={`h-8 rounded-md flex items-center justify-center text-[12px] font-medium transition-all ${
                          isCurrent
                            ? 'bg-[#0F4C81] text-white shadow-sm ring-2 ring-[#0F4C81]/30'
                            : isAnswered
                              ? 'bg-[#27AE60] text-white hover:bg-[#1E8A4C]'
                              : 'bg-[#F0F0F0] text-pm-text-secondary hover:bg-[#E2E8F0] border border-[#D4D4D4]'
                        }`}
                      >
                        {globalNum}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Legend */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#0F4C81]" />
            <span className="text-[11px] text-pm-text-secondary">当前</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#27AE60]" />
            <span className="text-[11px] text-pm-text-secondary">已答</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#F0F0F0] border border-[#D4D4D4]" />
            <span className="text-[11px] text-pm-text-secondary">未答</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
