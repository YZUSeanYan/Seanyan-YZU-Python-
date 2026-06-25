import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Lightbulb,
  ListChecks,
  Target,
  X,
  XCircle,
} from 'lucide-react';
import type { Question } from '@/types';
import CodeBlock from './CodeBlock';

interface ExplanationPanelProps {
  question: Question;
  isCorrect: boolean;
  userAnswer: string | null;
  onNext: () => void;
}

interface ExplanationSection {
  title: string;
  content: string[];
}

const sectionStyles = [
  {
    test: (title: string) => /正确|答案|结论/.test(title),
    icon: CheckCircle2,
    badge: 'bg-pm-success-light text-pm-success',
    border: 'border-pm-success/20',
  },
  {
    test: (title: string) => /错误|选项|易错/.test(title),
    icon: XCircle,
    badge: 'bg-pm-error-light text-pm-error',
    border: 'border-pm-error/20',
  },
  {
    test: (title: string) => /代码|逐行|过程|计算|详细/.test(title),
    icon: Code2,
    badge: 'bg-pm-purple-light text-pm-purple',
    border: 'border-pm-purple/20',
  },
  {
    test: (title: string) => /知识|延伸|考点/.test(title),
    icon: Lightbulb,
    badge: 'bg-pm-orange-light text-pm-orange',
    border: 'border-pm-orange/20',
  },
];

function getSectionStyle(title: string) {
  return sectionStyles.find((style) => style.test(title)) || {
    icon: ListChecks,
    badge: 'bg-pm-primary-light text-pm-primary',
    border: 'border-pm-border-color',
  };
}

function splitExplanation(explanation: string): ExplanationSection[] {
  const normalizedExplanation = explanation
    .replace(
      /\s*(\*\*(?:正确答案|错误选项分析|知识点延伸|代码逐行分析|代码执行过程|详细计算过程|详细分析|其他.*?分析|知识点|答案|解析|错误\d+|第\d+空)[^*]*\*\*(?:[^：:\n]{0,40})?[：:])/g,
      '\n\n$1'
    )
    .replace(/\s+-\s+([A-D][.、]\s*)/g, '\n- $1')
    .replace(/\s+(\d+[.、]\s+)/g, '\n$1');

  const lines = normalizedExplanation
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());

  const sections: ExplanationSection[] = [];
  let current: ExplanationSection = { title: '解析思路', content: [] };
  let inCodeBlock = false;

  const pushCurrent = () => {
    const content = current.content.join('\n').trim();
    if (content) sections.push({ ...current, content: current.content });
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      current.content.push(line);
      return;
    }

    const heading = !inCodeBlock && line.trim().match(/^\*\*(.+?)\*\*([^：:\n]{0,40})?[：:]\s*(.*)$/);
    if (heading) {
      pushCurrent();
      current = { title: `${heading[1]}${heading[2] || ''}`.trim(), content: [] };
      if (heading[3]) current.content.push(heading[3].trim());
      return;
    }

    current.content.push(line);
  });

  pushCurrent();

  if (sections.length > 0) return sections;

  const fallback = explanation
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return fallback.length
    ? fallback.map((part, index) => ({
        title: index === 0 ? '核心解析' : `补充说明 ${index + 1}`,
        content: part.split('\n'),
      }))
    : [{ title: '解析', content: ['暂无解析。'] }];
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-pm-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="px-1.5 py-0.5 rounded-pm-sm bg-pm-bg-primary text-pm-primary font-mono text-[0.92em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderSectionContent(lines: string[]) {
  const blocks: { type: 'text' | 'code'; value: string }[] = [];
  let codeLines: string[] = [];
  let inCodeBlock = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', value: codeLines.join('\n') });
        codeLines = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    blocks.push({ type: 'text', value: line });
  });

  if (codeLines.length > 0) {
    blocks.push({ type: 'code', value: codeLines.join('\n') });
  }

  return blocks.map((block, index) => {
    if (block.type === 'code') {
      return <CodeBlock key={`code-${index}`} code={block.value} className="my-3" />;
    }

    const text = block.value.trim();
    if (!text) return <div key={`space-${index}`} className="h-2" />;

    const bullet = text.match(/^[-•]\s+(.*)$/);
    if (bullet) {
      return (
        <div key={`bullet-${index}`} className="flex gap-2 text-sm leading-relaxed text-pm-text-secondary">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pm-primary" />
          <p>{renderInline(bullet[1])}</p>
        </div>
      );
    }

    const numbered = text.match(/^(\d+)[.、]\s*(.*)$/);
    if (numbered) {
      return (
        <div key={`number-${index}`} className="flex gap-2 text-sm leading-relaxed text-pm-text-secondary">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pm-primary-light text-[11px] font-semibold text-pm-primary">
            {numbered[1]}
          </span>
          <p>{renderInline(numbered[2])}</p>
        </div>
      );
    }

    return (
      <p key={`text-${index}`} className="text-sm leading-relaxed text-pm-text-secondary">
        {renderInline(text)}
      </p>
    );
  });
}

export default function ExplanationPanel({
  question,
  isCorrect,
  userAnswer,
  onNext,
}: ExplanationPanelProps) {
  const answerDisplay = Array.isArray(question.answer)
    ? question.answer.join(' | ')
    : question.answer;
  const sections = splitExplanation(question.explanation || '');
  const memoryTags = (question.tags || []).slice(0, 3);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className="overflow-hidden"
    >
      <div className="mt-4 bg-pm-bg-card rounded-pm-lg shadow-pm-md overflow-hidden">
        {/* Status bar */}
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="h-1"
          style={{ background: isCorrect ? 'var(--pm-success)' : 'var(--pm-error)' }}
        />

        <div className="p-6">
          {/* Status header */}
          <div className="flex items-center gap-2 mb-4">
            {isCorrect ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                >
                  <Check className="w-5 h-5 text-pm-success" />
                </motion.div>
                <span className="text-sm font-semibold text-pm-success">回答正确！</span>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                >
                  <X className="w-5 h-5 text-pm-error" />
                </motion.div>
                <span className="text-sm font-semibold text-pm-error">回答错误</span>
                <span className="text-sm text-pm-text-secondary ml-2">
                  正确答案：
                  <span className="font-semibold text-pm-success ml-1">{answerDisplay}</span>
                </span>
              </>
            )}
          </div>

          {/* User answer vs correct */}
          {!isCorrect && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-pm-md bg-pm-error-light">
                <p className="text-xs text-pm-error font-medium mb-1">你的答案</p>
                <p className="text-sm text-pm-error font-medium">{userAnswer || '未作答'}</p>
              </div>
              <div className="p-3 rounded-pm-md bg-pm-success-light">
                <p className="text-xs text-pm-success font-medium mb-1">正确答案</p>
                <p className="text-sm text-pm-success font-medium">{answerDisplay}</p>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mb-4">
            <h4 className="text-lg font-heading font-semibold text-pm-text-primary mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pm-primary" />
              解析
            </h4>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-pm-md border border-pm-border-color bg-pm-bg-primary p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-pm-primary">
                  <Target className="h-3.5 w-3.5" />
                  先记结论
                </div>
                <p className="text-sm font-medium text-pm-text-primary">{answerDisplay}</p>
              </div>
              <div className="rounded-pm-md border border-pm-border-color bg-pm-bg-primary p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-pm-orange">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  再防混淆
                </div>
                <p className="text-sm text-pm-text-secondary">
                  {isCorrect ? '对照错误选项，确认为什么不是它们。' : '重点看你的答案和正确答案差在哪里。'}
                </p>
              </div>
              <div className="rounded-pm-md border border-pm-border-color bg-pm-bg-primary p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-pm-success">
                  <Lightbulb className="h-3.5 w-3.5" />
                  最后留钩子
                </div>
                <p className="text-sm text-pm-text-secondary">
                  {memoryTags.length > 0 ? memoryTags.join(' / ') : question.category}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => {
                const style = getSectionStyle(section.title);
                const Icon = style.icon;

                return (
                  <motion.section
                    key={`${section.title}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    className={`rounded-pm-md border ${style.border} bg-pm-bg-primary p-4`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-pm-sm ${style.badge}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <h5 className="text-sm font-semibold text-pm-text-primary">{section.title}</h5>
                    </div>
                    <div className="space-y-2">
                      {renderSectionContent(section.content)}
                    </div>
                  </motion.section>
                );
              })}
            </div>

            {question.code && (
              <div className="mt-4">
                <CodeBlock code={question.code} />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(question.tags || []).map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="px-2.5 py-1 rounded-pm-sm text-xs font-medium bg-pm-primary-light text-pm-primary"
              >
                #{tag}
              </motion.span>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pm-md bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-hover transition-colors shadow-pm-primary"
          >
            下一题
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
