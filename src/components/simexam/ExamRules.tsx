import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, Edit3, Bug, Code, AlertTriangle, Play } from 'lucide-react';
import type { Question, QuestionType } from '@/types';

interface ExamSection {
  type: QuestionType;
  label: string;
  count: number;
  questions: Question[];
}

interface ExamRulesProps {
  onStart: () => void;
  paperTitle?: string;
  sections: ExamSection[];
}

const sectionIcons: Record<string, React.ReactNode> = {
  single: <FileText className="w-4 h-4 text-[#0F4C81]" />,
  fill: <Edit3 className="w-4 h-4 text-[#2A9D8F]" />,
  codeFix: <Bug className="w-4 h-4 text-[#E9A23B]" />,
  codeFill: <Code className="w-4 h-4 text-[#6C5CE7]" />,
};

export default function ExamRules({ onStart, paperTitle, sections }: ExamRulesProps) {
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="max-w-[700px] mx-auto py-8 px-6"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-[22px] font-bold text-[#0F4C81] mb-1">《人工智能及Python语言程序设计》课程考试</h2>
          <h3 className="text-[18px] font-semibold text-[#CC0000]">{paperTitle || '考试须知'}</h3>
        </div>

        {/* Rules List */}
        <div className="space-y-3 text-[14px] leading-[1.8] text-pm-text-primary mb-8">
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">1.</span>
            <p>考试时间120分钟。使用准考证号（课序号+学号）登录。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">2.</span>
            <p>考生迟到15分钟后不得入场。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">3.</span>
            <p>考生入座后，须及时签到，并将有效身份证件（身份证、学生证、照片清晰的校园一卡通）放在考桌左上角，以备监考人员查验。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">4.</span>
            <p>考生不得携带任何书籍、资料、笔记本、草稿纸、电子工具、手机、电子通讯工具、食物、饮料等物品进入考场，已携带入场的开考前应按监考教师要求存放在指定位置。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">5.</span>
            <p>考生要自觉遵守考场秩序，保持安静，不准吸烟或吃东西。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">6.</span>
            <p>考试机出现故障，考生应举手示意，由监考人员进行处理。考试过程中禁止打开与考试内容相关的软件，严禁故意关机或重启机器以及其它恶意操作行为。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">7.</span>
            <p>本次考试使用固定试卷，共 {sections.length} 个题目单元。使用"选题"按钮切换题目单元，双击选题界面中的任何题均可进入该题目单元。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">8.</span>
            <p>本套试卷共 {totalQuestions} 题，系统按正确题数折算百分制成绩。答题结果系统自动保存。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">9.</span>
            <p>考试时间到，系统自动交卷，已保存的答案将自动提交。交卷时屏幕将被锁定，待交卷完成后将显示成绩信息，考生方可离开考场。</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[#0F4C81] font-semibold shrink-0">10.</span>
            <p>考生交卷成功后须立即离开考场，不得在附近逗留、交谈。</p>
          </div>
        </div>

        {/* Exam Info Summary */}
        <div className="bg-[#F0F0F0] rounded-lg p-5 mb-8">
          <h4 className="text-[14px] font-semibold text-pm-text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0F4C81]" />
            考试信息概览
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-white rounded-md p-3">
              <Clock className="w-4 h-4 text-[#0F4C81]" />
              <div>
                <p className="text-[11px] text-pm-text-muted">考试时长</p>
                <p className="text-[13px] font-medium text-pm-text-primary">120分钟</p>
              </div>
            </div>
            {sections.map((section) => (
              <div key={section.type} className="flex items-center gap-2 bg-white rounded-md p-3">
                {sectionIcons[section.type] || <FileText className="w-4 h-4 text-[#0F4C81]" />}
                <div>
                  <p className="text-[11px] text-pm-text-muted">{section.label}</p>
                  <p className="text-[13px] font-medium text-pm-text-primary">{section.questions.length} 题</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 bg-[#FDF3E0] rounded-md p-4 mb-8">
          <AlertTriangle className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#B7791F]">
            请确保您已阅读并理解以上考试须知。点击"开始考试"后将立即开始计时，考试时间结束后系统将自动交卷。
          </p>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-[#0F4C81] text-white font-semibold text-[15px] px-10 py-3 rounded-lg hover:bg-[#0D3F6B] shadow-pm-primary transition-colors"
          >
            <Play className="w-4 h-4" />
            开始考试
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
