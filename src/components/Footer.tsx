import { NavLink } from 'react-router';
import { motion } from 'framer-motion';
import { PythonLogo } from './SvgAssets';
import { releaseNotes } from '@/data/releaseNotes';

const quickLinks = [
  { to: '/', label: '首页' },
  { to: '/practice', label: '练习' },
  { to: '/sim-exam', label: '模拟考试' },
  { to: '/wrongbook', label: '错题本' },
  { to: '/stats', label: '学习统计' },
  { to: '/settings', label: '设置与关于' },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="w-full bg-pm-bg-dark"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 sm:gap-10 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PythonLogo className="w-7 h-7" />
              <span className="font-heading font-semibold text-lg text-white">SeanYan</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              SeanYan Python 刷题系统，让期末备考更高效。
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              精选题库，覆盖多种题型与学习统计。
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3 tracking-wide uppercase" style={{ letterSpacing: '0.05em' }}>
              快速链接
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3 tracking-wide uppercase" style={{ letterSpacing: '0.05em' }}>
              题库信息
            </h4>
            <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <p>题目总数：<span className="text-white font-medium">700+ 题</span></p>
              <p>普通练习：基础题库与去重试卷题</p>
              <p>专项练习2：三套仿真卷专项训练</p>
              <p>题型覆盖：单选、填空、程序填空、程序改错</p>
              <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                最后更新：2026-06-26
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3 tracking-wide uppercase" style={{ letterSpacing: '0.05em' }}>
              版本更新记录
            </h4>
            <ol className="space-y-3">
              {releaseNotes.slice(0, 4).map((note) => (
                <li key={note.version} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{note.version}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{note.date}</span>
                  </div>
                  <p className="mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {note.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          &copy; 2026 SeanYan. All rights reserved.
        </div>
      </div>
    </motion.footer>
  );
}
