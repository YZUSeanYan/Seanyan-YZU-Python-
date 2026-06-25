import { motion } from 'framer-motion';

interface ExamHeaderProps {
  seatNumber: string;
  studentId?: string;
  studentName?: string;
}

export default function ExamHeader({ seatNumber, studentId, studentName }: ExamHeaderProps) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="h-[56px] bg-[#E8E8E8] flex items-center justify-between px-6 shrink-0 border-b border-[#D4D4D4]"
    >
      <h1 className="text-[16px] font-semibold text-pm-text-primary tracking-wide">
        Python 期末考试模拟
      </h1>

      <div className="flex items-center gap-5">
        <div className="text-right leading-tight">
          <p className="text-[12px] text-pm-text-muted">考生信息</p>
          <p className="text-[14px] font-medium text-pm-text-primary">
            {studentName || '未登录'}
            {studentId && <span className="ml-2 text-pm-text-secondary">学号 {studentId}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-pm-text-secondary">座位号</span>
          <span className="text-[28px] font-bold text-[#CC0000] leading-none">{seatNumber}</span>
        </div>
      </div>
    </motion.div>
  );
}
