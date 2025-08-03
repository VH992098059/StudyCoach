/**
 * @fileoverview 响应式容器组件
 * @description 提供响应式布局容器，支持不同设备的自适应显示和间距调整
 * @author 开发团队
 * @version 1.0.0
 */

import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import './index.css';

/**
 * 响应式容器组件属性接口
 * @interface ResponsiveContainerProps
 */
interface ResponsiveContainerProps {
  /** 子组件内容 */
  children: React.ReactNode;
  /** 自定义CSS类名 */
  className?: string;
  /** 容器最大宽度，可以是数字（像素）或字符串 */
  maxWidth?: number | string;
  /** 不同设备的内边距配置 */
  padding?: {
    /** 桌面端内边距 */
    desktop?: number | string;
    /** 平板端内边距 */
    tablet?: number | string;
    /** 移动端内边距 */
    mobile?: number | string;
  };
  /** 响应式断点配置 */
  breakpoints?: {
    /** 移动端断点（像素） */
    mobile?: number;
    /** 平板端断点（像素） */
    tablet?: number;
    /** 桌面端断点（像素） */
    desktop?: number;
  };
}

/**
 * 响应式容器组件
 * @description 提供响应式布局容器，根据设备类型自动调整宽度、间距等样式
 * @param {ResponsiveContainerProps} props - 组件属性

 * @example
 * ```tsx
 * <ResponsiveContainer
 *   maxWidth={1200}
 *   padding={{
 *     desktop: 24,
 *     tablet: 16,
 *     mobile: 12
 *   }}
 *   breakpoints={{
 *     mobile: 768,
 *     tablet: 1024,
 *     desktop: 1200
 *   }}
 * >
 *   <div>响应式内容</div>
 * </ResponsiveContainer>
 * ```
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 1400,
  padding = {
    desktop: 24,
    tablet: 16,
    mobile: 12,
  },
  breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
  },
})=> {
  /** 检测是否为移动端设备 */
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.mobile}px)`);
  /** 检测是否为平板端设备 */
  const isTablet = useMediaQuery(`(max-width: ${breakpoints.tablet}px)`);
  /** 检测是否为桌面端设备 */
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.desktop}px)`);

  /**
   * 获取当前设备对应的内边距
   * @description 根据设备类型返回相应的内边距值
   * @returns {number | string | undefined} 内边距值
   */
  const getPadding = (): number | string | undefined => {
    if (isMobile) return padding.mobile;
    if (isTablet) return padding.tablet;
    return padding.desktop;
  };

  /**
   * 容器样式配置
   * @description 根据属性和设备类型生成容器的CSS样式
   */
  const containerStyle: React.CSSProperties = {
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    margin: '0 auto',
    padding: typeof getPadding() === 'number' ? `${getPadding()}px` : getPadding(),
    width: '100%',
  };

  return (
    <div 
      className={`responsive-container ${className}`}
      style={containerStyle}
      data-device={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
export type { ResponsiveContainerProps };