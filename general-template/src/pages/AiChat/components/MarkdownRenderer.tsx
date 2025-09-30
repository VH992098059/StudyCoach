/**
 * Markdown渲染组件
 * 专门处理消息内容的Markdown渲染，包括文本清理和样式应用
 */

import React from 'react';
import { Markdown } from '../../../components/Markdown';
import styles from '../../../components/Markdown/markdown.module.scss';

interface MarkdownRendererProps {
  /** 要渲染的内容 */
  content: string;
  /** 是否为用户消息 */
  isUser: boolean;
  /** 字体大小 */
  fontSize?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 去除后端返回的 ```markdown 语言标识，避免渲染出文字
 */
const sanitizeMarkdown = (text: string): string => {
  return text ? text.replace(/```markdown/g, '```').replace(/^[\s\n]+/, '') : '';
};

/**
 * Markdown渲染器组件
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUser,
  fontSize,
  className
}) => {
  const sanitizedContent = sanitizeMarkdown(content);
  const markdownClassName = isUser ? styles['user-markdown'] : styles['ai-markdown'];
  const finalClassName = className ? `${markdownClassName} ${className}` : markdownClassName;

  return (
    <Markdown
      className={finalClassName}
      content={sanitizedContent}
      fontSize={fontSize}
    />
  );
};

export default MarkdownRenderer;
export { sanitizeMarkdown };