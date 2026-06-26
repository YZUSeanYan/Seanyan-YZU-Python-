import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Coffee,
  Github,
  HeartHandshake,
  Info,
  Mail,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { isSoundEnabled, playSoundPreview, setSoundEnabled } from '@/lib/sound';
import { releaseNotes } from '@/data/releaseNotes';

const githubUrl = 'https://github.com/YZUSeanYan';
const email = 'z40681992@163.com';

export default function Settings() {
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) {
      window.setTimeout(() => playSoundPreview(), 40);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-[70dvh]"
    >
      <div className="bg-pm-bg-card border-b border-pm-border-color">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex items-center gap-2 text-xs text-pm-text-muted mb-3">
            <span>首页</span>
            <span>&gt;</span>
            <span className="text-pm-primary font-medium">设置</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-pm-md bg-pm-primary-light text-pm-primary flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-[32px] font-bold text-pm-text-primary">设置</h1>
              <p className="text-sm text-pm-text-secondary mt-1">
                管理学习体验，查看网站信息和更新记录。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-pm-lg border border-pm-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-pm-md bg-pm-accent-light text-pm-accent flex items-center justify-center">
                  {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-semibold text-pm-text-primary">音效</h2>
                  <p className="text-sm text-pm-text-secondary mt-1">
                    控制答题、切题、完成练习时的提示音。切题音效已调整为更轻柔的短提示。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  soundOn ? 'bg-pm-primary' : 'bg-pm-neutral'
                }`}
                aria-pressed={soundOn}
                aria-label="切换音效"
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    soundOn ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`text-sm font-medium ${soundOn ? 'text-pm-success' : 'text-pm-text-muted'}`}>
                当前状态：{soundOn ? '已开启' : '已关闭'}
              </span>
              <button
                onClick={() => playSoundPreview()}
                disabled={!soundOn}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pm-md border border-pm-border text-sm text-pm-text-secondary hover:bg-pm-bg-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Bell className="w-4 h-4" />
                试听
              </button>
            </div>
          </section>

          <section className="bg-white rounded-pm-lg border border-pm-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-pm-primary" />
              <h2 className="font-semibold text-pm-text-primary">关于 SeanYan</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-pm-text-secondary">
              <p>
                SeanYan 是一个面向 Python 期末复习的小型刷题系统，包含普通练习、专项练习2、背题、错题本、
                仿真考试和学习统计。它更适合临考前高频复盘：刷题、看解析、回收错题，再用三套卷做专项训练。
              </p>
              <p>
                作者：<span className="font-medium text-pm-text-primary">严心远</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 text-pm-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {email}
                </a>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-pm-primary hover:underline"
                >
                  <Github className="w-4 h-4" />
                  GitHub 主页
                </a>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-pm-lg border border-pm-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <HeartHandshake className="w-5 h-5 text-pm-orange" />
              <h2 className="font-semibold text-pm-text-primary">捐助支持</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-[1fr_240px] items-start">
              <div className="text-sm leading-relaxed text-pm-text-secondary space-y-3">
                <p>
                  如果这个小站帮你少熬了一会儿夜、少翻了几页资料，或者让考前复习更有方向，
                  可以请作者喝一杯咖啡。你的支持会用来继续整理题库、打磨解析和维护服务器。
                </p>
                <p className="font-medium text-pm-text-primary">
                  自愿支持，量力而行。能认真刷题、顺利通过考试，就是这个网站最重要的意义。
                </p>
                <div className="inline-flex items-center gap-2 rounded-pm-md bg-pm-orange-light px-3 py-2 text-sm text-pm-orange">
                  <Coffee className="w-4 h-4" />
                  微信扫码支持
                </div>
              </div>
              <div className="rounded-pm-md border border-pm-border bg-pm-bg-primary p-3">
                <img
                  src="/donate-wechat.png"
                  alt="微信收款码"
                  className="w-full rounded-pm-sm bg-white"
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="bg-white rounded-pm-lg border border-pm-border p-5 h-fit">
          <h2 className="font-semibold text-pm-text-primary mb-4">更新记录</h2>
          <ol className="space-y-4">
            {releaseNotes.map((note) => (
              <li key={note.version} className="border-l-2 border-pm-primary-light pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-pm-primary">{note.version}</span>
                  <span className="text-xs text-pm-text-muted">{note.date}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-pm-text-secondary">{note.text}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </motion.div>
  );
}
