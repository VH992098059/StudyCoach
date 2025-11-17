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