import React, { useRef, useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import RehypeKatex from 'rehype-katex';
import RemarkGfm from 'remark-gfm';
import RehypeHighlight from 'rehype-highlight';
import { Button, message } from 'antd';
import { CopyOutlined, FullscreenOutlined } from '@ant-design/icons';
import mermaid from 'mermaid';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';

// 复制到剪贴板功能
const copyToClipboard = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  } else {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      message.success('已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
    document.body.removeChild(textArea);
  }
};

// 显示图片模态框
const showImageModal = (src: string) => {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    cursor: pointer;
  `;
  
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
  `;
  
  modal.appendChild(img);
  document.body.appendChild(modal);
  
  modal.onclick = () => {
    document.body.removeChild(modal);
  };
};

// Mermaid 图表组件
export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error('[Mermaid] ', e.message);
        });
    }
  }, [props.code]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: 'image/svg+xml' });
    showImageModal(URL.createObjectURL(blob));
  }

  if (hasError) {
    return null;
  }

  return (
    <div
      className={clsx('no-dark', 'mermaid')}
      style={{
        cursor: 'pointer',
        overflow: 'auto',
      }}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
    >
      {props.code}
    </div>
  );
}

// HTML 预览组件
function HTMLPreview({ code, autoHeight = false, height = 600 }: { 
  code: string; 
  autoHeight?: boolean; 
  height?: number; 
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%',
        height: autoHeight ? 'auto' : `${height}px`,
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

// 全屏容器组件
function FullScreen({ 
  children, 
  className, 
  right = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  right?: number; 
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={className} style={{ position: 'relative' }}>
      <Button
        icon={<FullscreenOutlined />}
        onClick={toggleFullscreen}
        style={{ position: 'absolute', right: right + 70, top: 10, zIndex: 10 }}
        size="small"
      />
      {children}
    </div>
  );
}

// 代码块组件
export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector('code.language-mermaid');
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
    const htmlDom = ref.current.querySelector('code.language-html');
    const refText = ref.current.querySelector('code')?.innerText;
    if (htmlDom) {
      setHtmlCode((htmlDom as HTMLElement).innerText);
    } else if (
      refText?.startsWith('<!DOCTYPE') ||
      refText?.startsWith('<svg') ||
      refText?.startsWith('<?xml')
    ) {
      setHtmlCode(refText);
    }
  }, 600);

  useEffect(() => {
    if (ref.current) {
      const codeElements = ref.current.querySelectorAll(
        'code',
      ) as NodeListOf<HTMLElement>;
      const wrapLanguages = [
        '',
        'md',
        'markdown',
        'text',
        'txt',
        'plaintext',
        'tex',
        'latex',
      ];
      codeElements.forEach((codeElement) => {
        let languageClass = codeElement.className.match(/language-(\w+)/);
        let name = languageClass ? languageClass[1] : '';
        if (wrapLanguages.includes(name)) {
          codeElement.style.whiteSpace = 'pre-wrap';
        }
      });
      setTimeout(renderArtifacts, 1);
    }
  }, []);

  return (
    <>
      <pre ref={ref}>
        <span
          className="copy-code-button"
          onClick={() => {
            if (ref.current) {
              copyToClipboard(
                ref.current.querySelector('code')?.innerText ?? '',
              );
            }
          }}
        ></span>
        {props.children}
      </pre>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      {htmlCode.length > 0 && (
        <FullScreen className="no-dark html" right={70}>
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(htmlCode)}
            style={{ position: 'absolute', right: 20, top: 10 }}
            size="small"
          />
          <HTMLPreview
            code={htmlCode}
            autoHeight={!document.fullscreenElement}
            height={!document.fullscreenElement ? 600 : window.innerHeight}
          />
        </FullScreen>
      )}
    </>
  );
}

// 自定义代码组件
function CustomCode(props: { children: any; className?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 400);
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [props.children]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };

  const renderShowMoreButton = () => {
    if (showToggle && collapsed) {
      return (
        <div
          className={clsx('show-hide-button', {
            collapsed,
            expanded: !collapsed,
          })}
        >
          <button onClick={toggleCollapsed}>显示更多</button>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <code
        className={clsx(props?.className)}
        ref={ref}
        style={{
          maxHeight: collapsed ? '400px' : 'none',
          overflowY: 'hidden',
        }}
      >
        {props.children}
      </code>
      {renderShowMoreButton()}
    </>
  );
}

// 转义括号
function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

// 尝试包装HTML代码
function tryWrapHtmlCode(text: string) {
  if (text.includes('```')) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? '\n```html\n' + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + '\n```\n' : match;
      },
    );
}

// Markdown 内容组件
function _MarkDownContent(props: { content: string }) {
  const escapedContent = useMemo(() => {
    return tryWrapHtmlCode(escapeBrackets(props.content));
  }, [props.content]);

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkGfm]}
      rehypePlugins={[
        RehypeKatex,
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
      ]}
      components={{
        pre: PreCode,
        code: CustomCode,
        p: (pProps) => <p {...pProps} dir="auto" />,
        a: (aProps) => {
          const href = aProps.href || '';
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure>
                <audio controls src={href}></audio>
              </figure>
            );
          }
          if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
            return (
              <video controls width="99.9%">
                <source src={href} />
              </video>
            );
          }
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? '_self' : aProps.target ?? '_blank';
          return <a {...aProps} target={target} />;
        },
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(_MarkDownContent);

// 主 Markdown 组件
export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    fontFamily?: string;
    className?: string;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={clsx('markdown-body', props.className)}
      style={{
        fontSize: `${props.fontSize ?? 14}px`,
        fontFamily: props.fontFamily || 'inherit',
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      {props.loading ? (
        <div>加载中...</div>
      ) : (
        <MarkdownContent content={props.content} />
      )}
    </div>
  );
}

export default Markdown;