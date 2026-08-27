/**
 * Markdown 文本渲染（Text part 组件）
 * 基于 @assistant-ui/react-markdown 的 MarkdownTextPrimitive：
 * - GFM 表格/任务列表
 * - 数学公式（remark-math + rehype-katex，兼容 $...$ / $$...$$ / \[...\]）
 * - 代码高亮（rehype-highlight）
 * - mermaid 图表按需渲染（沿用旧版 MermaidBlock 逻辑）
 */

import React, { useEffect, useState } from 'react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';

import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

// mermaid 渲染初始化（startOnLoad:false，仅按需 render）
mermaid.initialize({ startOnLoad: false, theme: 'default' });

/** hast 元素节点的最小结构描述 */
interface HastElement {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastElement[];
}

/**
 * 将 CSS 声明字符串解析为 React style 对象（camelCase）。
 * 仅需覆盖 KaTeX 输出的简单声明（height / vertical-align / margin 等）。
 */
function styleStringToObject(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of raw.split(';')) {
    const i = decl.indexOf(':');
    if (i <= 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl
      .slice(i + 1)
      .trim()
      .replace(/!important$/i, '')
      .trim();
    if (prop && val) {
      out[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = val;
    }
  }
  return out;
}

/**
 * rehype 插件：把 KaTeX 等生成的内联 style「字符串」预先解析为对象。
 * 必要性：依赖图中的 style-to-js@1.0.0 为纯 CJS，经默认导入互操作后不是函数，
 * 而 react-markdown 设置了 ignoreInvalidStyle 会静默丢弃全部公式排版样式，
 * 导致数学公式塌缩重叠。此插件让转换器直接命中「style 已是对象」分支从而绕开该缺陷。
 */
const reactifyInlineStyles = () => (tree: HastElement) => {
  const walk = (node: HastElement): void => {
    if (node.properties && typeof node.properties.style === 'string') {
      node.properties.style = styleStringToObject(node.properties.style);
    }
    node.children?.forEach(walk);
  };
  walk(tree);
};

/** mermaid 源码异步渲染为 SVG 图表（迁移自旧 BubbleMessageList） */
const MermaidBlock: React.FC<{ code: string }> = ({ code }) => {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (failed) {
    return (
      <pre className="overflow-x-auto rounded-md border border-border bg-hover p-3 text-xs">
        <code>{code}</code>
      </pre>
    );
  }
  return <div className="my-2 overflow-x-auto [&_svg]:mx-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
};

/** Markdown 正文容器（流式平滑 + 数学公式预处理） */
const MarkdownText: React.FC = () => (
  <div className="sc-markdown text-[14px] leading-[1.75] text-text-1">
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, reactifyInlineStyles, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      smooth
      componentsByLanguage={{
        mermaid: {
          SyntaxHighlighter: ({ code }) => <MermaidBlock code={code} />,
        },
      }}
    />
  </div>
);

export default MarkdownText;
