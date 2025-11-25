/**
 * @fileoverview 滚动处理 Hook
 * @description 提供页面与消息列表滚动的短暂状态标记与节流处理。
 */
import { useRef, useState } from 'react';

const useScrollHandlers = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMessageScrolling, setIsMessageScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
  };

  const handleMessageScroll = () => {
    setIsMessageScrolling(true);
    if (messageScrollTimeoutRef.current) clearTimeout(messageScrollTimeoutRef.current);
    messageScrollTimeoutRef.current = setTimeout(() => setIsMessageScrolling(false), 1000);
  };

  return { isScrolling, isMessageScrolling, handleScroll, handleMessageScroll };
};

export default useScrollHandlers;