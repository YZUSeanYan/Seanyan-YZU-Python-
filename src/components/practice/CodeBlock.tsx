import { useMemo } from 'react';

interface CodeBlockProps {
  code: string;
  className?: string;
}

const keywordRegex = /\b(def|class|return|if|else|elif|for|while|in|import|from|as|try|except|finally|with|lambda|yield|assert|break|continue|del|global|nonlocal|pass|raise|and|or|not|is|None|True|False|print|len|range|open|str|int|float|list|dict|tuple|set|sorted|sum|max|min|enumerate|zip|map|filter)\b/g;
const stringRegex = /(["'])(?:\\.|(?!\1)[^\\])*\1/g;
const numberRegex = /\b\d+\.?\d*\b/g;
const commentRegex = /#.*/g;
const functionRegex = /\b([a-zA-Z_]\w*)\s*(?=\()/g;

export default function CodeBlock({ code, className = '' }: CodeBlockProps) {
  const highlighted = useMemo(() => {
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments first (so they don't get highlighted as keywords)
    html = html.replace(commentRegex, (match) => `<span style="color:#6B7280">${match}</span>`);

    // Strings
    html = html.replace(stringRegex, (match) => `<span style="color:#4ADE80">${match}</span>`);

    // Numbers
    html = html.replace(numberRegex, (match) => `<span style="color:#FBBF24">${match}</span>`);

    // Functions
    html = html.replace(functionRegex, (match) => `<span style="color:#60A5FA">${match}</span>`);

    // Keywords (but not inside already-colored spans)
    const parts = html.split(/(<span[^>]*>.*?<\/span>)/g);
    for (let i = 0; i < parts.length; i += 2) {
      parts[i] = parts[i].replace(keywordRegex, (match) => `<span style="color:#C084FC">${match}</span>`);
    }
    html = parts.join('');

    return html;
  }, [code]);

  return (
    <div className={`rounded-pm-md bg-[#1E293B] p-4 overflow-x-auto ${className}`}>
      <pre className="font-mono text-[15px] leading-[1.8] text-[#E2E8F0]">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
