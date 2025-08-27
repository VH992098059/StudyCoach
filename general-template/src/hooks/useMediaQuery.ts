/**
 * @fileoverview 媒体查询相关的React Hooks
 * @description 提供响应式设计所需的各种媒体查询Hook，包括断点检测、设备方向、触摸设备检测和深色模式
 * @author 开发团队
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

/**
 * 媒体查询Hook
 * @param query - CSS媒体查询字符串
 * @returns 是否匹配媒体查询
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // 设置初始值
    setMatches(mediaQuery.matches);

    // 监听变化
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版本浏览器
      mediaQuery.addListener(handleChange);
    }

    // 清理函数
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // 兼容旧版本浏览器
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
};

/**
 * 预定义的断点Hook
 */
export const useBreakpoints = () => {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const isTablet = useMediaQuery('(min-width: 1024px) and (max-width: 1199px)');
  const isDesktop = useMediaQuery('(min-width: 1200px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1400px)');
  
  // 更细粒度的断点
  const isXs = useMediaQuery('(max-width: 575px)');
  const isSm = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 991px)');
  const isLg = useMediaQuery('(min-width: 992px) and (max-width: 1199px)');
  const isXl = useMediaQuery('(min-width: 1200px)');
  const isXxl = useMediaQuery('(min-width: 1400px)');

  return {
    // 基础断点
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    
    // 细粒度断点
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    
    // 当前设备类型
    device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    
    // 屏幕尺寸
    screenSize: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : isXl ? 'xl' : 'xxl',
  };
};

/**
 * 设备方向检测Hook
 * @description 检测设备的屏幕方向（横屏或竖屏）
 * @returns {Object} 包含方向信息的对象
 * @returns {boolean} returns.isPortrait - 是否为竖屏模式
 * @returns {boolean} returns.isLandscape - 是否为横屏模式
 * @returns {'portrait'|'landscape'} returns.orientation - 当前屏幕方向
 * @example
 * ```tsx
 * const { isPortrait, orientation } = useOrientation();
 * ```
 */
export const useOrientation = () => {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  return {
    isPortrait,
    isLandscape,
    orientation: isPortrait ? 'portrait' : 'landscape',
  };
};

/**
 * 触摸设备检测Hook
 * @description 检测当前设备是否支持触摸操作
 * @returns {boolean} 是否为触摸设备
 * @example
 * ```tsx
 * const isTouchDevice = useTouchDevice();
 * if (isTouchDevice) {
 *   // 为触摸设备优化交互
 * }
 * ```
 */
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };
    
    setIsTouchDevice(checkTouchDevice());
  }, []);
  
  return isTouchDevice;
};

/**
 * 深色模式检测和控制Hook
 * @description 检测系统深色模式偏好并提供手动切换功能
 * @returns {Object} 包含深色模式相关状态和方法的对象
 * @returns {boolean} returns.isDarkMode - 当前是否为深色模式
 * @returns {Function} returns.toggleDarkMode - 切换深色模式的函数
 * @returns {boolean} returns.prefersDarkMode - 系统是否偏好深色模式
 * @example
 * ```tsx
 * const { isDarkMode, toggleDarkMode, prefersDarkMode } = useDarkMode();
 * ```
 */
export const useDarkMode = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);
  
  useEffect(() => {
    setIsDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return {
    isDarkMode,
    toggleDarkMode,
    prefersDarkMode,
  };
};