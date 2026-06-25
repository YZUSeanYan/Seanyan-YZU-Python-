import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import type { Question } from '@/types';

interface QuestionPanelProps {
  question: Question;
  globalNumber: number;
  answer: string;
  onAnswer: (questionId: number, answer: string) => void;
}

const typeLabels: Record<string, string> = {
  'single': '单选题',
  'fill': '填空题',
  'codeFill': '程序填空',
  'codeFix': '程序改错',
};

const optionLetters = ['A', 'B', 'C', 'D'];

export default function QuestionPanel({ question, globalNumber, answer, onAnswer }: QuestionPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="max-w-[800px] mx-auto"
    >
      {/* Question Header */}
      <div className="mb-4">
        <span className="text-[#0F4C81] text-[18px] font-semibold">{globalNumber}</span>
        <span className="text-pm-text-secondary text-[14px] ml-1">
          （{typeLabels[question.type]}）
        </span>
        <span className="text-pm-text-primary text-[14px]">：</span>
      </div>

      {/* Question Content */}
      <div className="mb-6">
        <p className="text-[15px] text-pm-text-primary leading-[1.8] mb-4 whitespace-pre-wrap">
          {question.content}
        </p>
        {question.code && (
          <pre className="bg-[#1E293B] text-[#E2E8F0] rounded-md p-4 font-mono text-[14px] leading-[1.8] overflow-x-auto mb-4">
            <code>{question.code}</code>
          </pre>
        )}
      </div>

      {/* Answer Area - Single Choice */}
      {question.type === 'single' && question.options && (
        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            const letter = optionLetters[i];
            const isSelected = answer === letter;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAnswer(question.id, letter)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-[#0F4C81] bg-[#E8F1F8]'
                    : 'border-[#D4D4D4] bg-white hover:border-[#0F4C81]/50 hover:bg-[#F5F7FA]'
                }`}
              >
                {/* Radio Button */}
                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-[#0F4C81] bg-[#0F4C81] flex items-center justify-center">
                      <div className="w-[7px] h-[7px] rounded-full bg-white" />
                    </div>
                  ) : (
                    <Circle className="w-[18px] h-[18px] text-[#94A3B8]" strokeWidth={1.5} />
                  )}
                </div>
                <span className={`text-[14px] leading-relaxed ${isSelected ? 'text-[#0F4C81] font-medium' : 'text-pm-text-primary'}`}>
                  {opt}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Answer Area - Fill in the Blank */}
      {question.type === 'fill' && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] text-pm-text-secondary">请在下方输入答案：</span>
          </div>
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswer(question.id, e.target.value)}
            placeholder="在此输入答案..."
            className="w-full max-w-[500px] px-4 py-3 border-b-2 border-[#0F4C81] bg-[#F5F7FA] text-[15px] text-pm-text-primary placeholder:text-pm-text-muted focus:outline-none focus:border-[#0D3F6B] transition-colors rounded-t-md"
          />
        </div>
      )}

      {/* Answer Area - Code Fix */}
      {question.type === 'codeFix' && (
        <div className="mt-4 space-y-4">
          {question.blanks && question.blanks.length > 0 ? (
            /* Code-fix with specific blank positions */
            <div className="space-y-3">
              {question.blanks.map((blank) => (
                <div key={blank.id} className="flex items-start gap-3">
                  <span className="text-[13px] text-pm-text-secondary shrink-0 mt-2.5">
                    第{blank.id}处错误：
                  </span>
                  <input
                    type="text"
                    value={answer?.split('|')[blank.id - 1] || ''}
                    onChange={(e) => {
                      const parts = answer ? answer.split('|') : [];
                      while (parts.length < question.blanks!.length) parts.push('');
                      parts[blank.id - 1] = e.target.value;
                      onAnswer(question.id, parts.join('|'));
                    }}
                    placeholder={`输入修改后的第${blank.id}处语句...`}
                    className="flex-1 px-3 py-2 border-b-2 border-[#CC0000] bg-[#F5F7FA] text-[14px] text-pm-text-primary font-mono placeholder:text-pm-text-muted focus:outline-none focus:border-[#0F4C81] transition-colors rounded-t-md"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Code-fix without specific blanks - full statement replacement */
            <div className="space-y-3">
              <p className="text-[13px] text-[#CC0000] font-medium">
                【注意】改错时，请将整个语句修改后填写在后面的横线上，语句书写不完整，将不能得分。
              </p>
              <textarea
                value={answer}
                onChange={(e) => onAnswer(question.id, e.target.value)}
                placeholder="请输入修改后的完整代码..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-[#D4D4D4] rounded-md bg-[#F5F7FA] text-[14px] text-pm-text-primary font-mono placeholder:text-pm-text-muted focus:outline-none focus:border-[#0F4C81] transition-colors resize-y leading-relaxed"
              />
            </div>
          )}
        </div>
      )}

      {/* Answer Area - Code Fill */}
      {question.type === 'codeFill' && (
        <div className="mt-4 space-y-4">
          {question.blanks && question.blanks.length > 0 ? (
            <div className="space-y-3">
              {question.blanks.map((blank) => (
                <div key={blank.id} className="flex items-start gap-3">
                  <span className="text-[13px] text-pm-text-secondary shrink-0 mt-2.5">
                    空{blank.id}：
                  </span>
                  <input
                    type="text"
                    value={answer?.split('|')[blank.id - 1] || ''}
                    onChange={(e) => {
                      const parts = answer ? answer.split('|') : [];
                      while (parts.length < question.blanks!.length) parts.push('');
                      parts[blank.id - 1] = e.target.value;
                      onAnswer(question.id, parts.join('|'));
                    }}
                    placeholder={`填写第${blank.id}个空...`}
                    className="flex-1 px-3 py-2 border-b-2 border-[#CC0000] bg-[#F5F7FA] text-[14px] text-pm-text-primary font-mono placeholder:text-pm-text-muted focus:outline-none focus:border-[#0F4C81] transition-colors rounded-t-md"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-[#CC0000] font-medium mb-3">
                【注意】请在下方空缺处填写代码：
              </p>
              <textarea
                value={answer}
                onChange={(e) => onAnswer(question.id, e.target.value)}
                placeholder="请输入填空内容..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-[#D4D4D4] rounded-md bg-[#F5F7FA] text-[14px] text-pm-text-primary font-mono placeholder:text-pm-text-muted focus:outline-none focus:border-[#0F4C81] transition-colors resize-y leading-relaxed"
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
