import CodeBlock from './CodeBlock';

interface QuestionContentProps {
  content: string;
  code?: string;
  codeLike?: boolean;
  textClassName?: string;
}

type ContentBlock = {
  type: 'text' | 'code';
  lines: string[];
};

function isCodeLine(line: string): boolean {
  const text = line.trim();
  if (!text) return false;
  if (/^(>>>|\.\.\.|#|import\s|from\s|def\s|class\s|for\s|while\s|if\s|elif\s|else:|try:|except|finally|with\s|return\b|print\s*\(|input\s*\()/.test(text)) {
    return true;
  }
  if (/^(【错误\d*】|错误\d+[：:])/.test(text)) return true;
  if (/^[A-Za-z_]\w*\s*(=|\(|\[|\.)/.test(text)) return true;
  if (/^[}\])]|^[\w'")\]]+\s*[:=+\-*/%<>]/.test(text) && !/[。？，；]/.test(text)) return true;
  return false;
}

function splitContent(content: string, codeLike: boolean): ContentBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ContentBlock[] = [];
  let current: ContentBlock | null = null;

  const pushLine = (type: ContentBlock['type'], line: string) => {
    if (!current || current.type !== type) {
      current = { type, lines: [] };
      blocks.push(current);
    }
    current.lines.push(line);
  };

  lines.forEach((line) => {
    const type = codeLike && isCodeLine(line) ? 'code' : 'text';
    pushLine(type, line);
  });

  return blocks
    .map((block) => ({ ...block, lines: block.lines.filter((line, index, arr) => line.trim() || index > 0 && index < arr.length - 1) }))
    .filter((block) => block.lines.some((line) => line.trim()));
}

export default function QuestionContent({
  content,
  code,
  codeLike = false,
  textClassName = 'text-base font-body leading-relaxed text-pm-text-primary mb-4 whitespace-pre-wrap',
}: QuestionContentProps) {
  const blocks = splitContent(content, codeLike);

  return (
    <>
      {blocks.map((block, index) => {
        const value = block.lines.join('\n').trimEnd();
        if (!value) return null;
        if (block.type === 'code') {
          return <CodeBlock key={`code-${index}`} code={value} className="mb-4" />;
        }
        return (
          <p key={`text-${index}`} className={textClassName}>
            {value}
          </p>
        );
      })}
      {code && <CodeBlock code={code} className="mb-4" />}
    </>
  );
}
