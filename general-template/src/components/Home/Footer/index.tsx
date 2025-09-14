/**
 * @fileoverview 底部信息组件
 * @description 应用的底部区域，包含公司信息、友情链接、联系方式、社交媒体等
 * @author 开发团队
 * @version 1.0.0
 */

import React from 'react';
import { Layout, Row, Col, Space, Divider } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  WechatOutlined,
  QqOutlined,
} from '@ant-design/icons';
import './index.scss';

const { Footer: AntFooter } = Layout;

/**
 * 链接项接口
 * @interface LinkItem
 */
interface LinkItem {
  /** 链接标题 */
  title: string;
  /** 链接地址 */
  url: string;
  /** 是否为外部链接 */
  external?: boolean;
}

/**
 * 联系信息接口
 * @interface ContactInfo
 */
interface ContactInfo {
  /** 邮箱地址 */
  email?: string;
  /** 联系电话 */
  phone?: string;
  /** 联系地址 */
  address?: string;
}

/**
 * 社交媒体链接接口
 * @interface SocialLink
 */
interface SocialLink {
  /** 社交媒体类型 */
  type: 'github' | 'wechat' | 'qq' | 'custom';
  /** 链接地址 */
  url: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 链接标题 */
  title?: string;
}

/**
 * 底部组件属性接口
 * @interface FooterProps
 */
interface FooterProps {
  /** 版权信息 */
  copyright?: string;
  /** 公司名称 */
  companyName?: string;
  /** 友情链接列表 */
  links?: LinkItem[];
  /** 联系信息 */
  contactInfo?: ContactInfo;
  /** 社交媒体链接列表 */
  socialLinks?: SocialLink[];
  /** 自定义内容 */
  customContent?: React.ReactNode;
}

/**
 * 底部信息组件
 * @description 应用底部区域，包含公司信息、友情链接、联系方式、社交媒体等内容
 * @param {FooterProps} props - 组件属性
 * @example
 * ```tsx
 * <Footer
 *   companyName="我的公司"
 *   contactInfo={{
 *     email: "contact@example.com",
 *     phone: "+86 123-4567-8900",
 *     address: "北京市朝阳区示例大厦"
 *   }}
 *   socialLinks={[
 *     { type: 'github', url: 'https://github.com', title: 'GitHub' }
 *   ]}
 * />
 * ```
 */
const Footer: React.FC<FooterProps> = ({
  copyright = `© ${new Date().getFullYear()} 学习教练Agent. All rights reserved.`,
  companyName = '学习教练Agent',
  links = [],
  contactInfo,
  socialLinks = [],
  customContent,
})=> {
  /**
   * 默认友情链接配置
   * @description 当没有传入自定义链接时使用的默认链接
   */
  const defaultLinks: LinkItem[] = [
    { title: '关于我们', url: '/about' },
    { title: '服务条款', url: '/terms' },
    { title: '隐私政策', url: '/privacy' },
    { title: '帮助中心', url: '/help' },
  ];

  /**
   * 最终使用的链接列表
   * @description 优先使用传入的链接，否则使用默认链接
   */
  const finalLinks = links.length > 0 ? links : defaultLinks;

  /**
   * 获取社交媒体图标
   * @description 根据社交媒体类型返回对应的图标组件
   * @param {SocialLink['type']} type - 社交媒体类型
   * @param {React.ReactNode} customIcon - 自定义图标
   * @returns {React.ReactNode | null} 图标组件
   */
  const getSocialIcon = (type: SocialLink['type'], customIcon?: React.ReactNode): React.ReactNode | null => {
    if (customIcon) return customIcon;
    
    switch (type) {
      case 'github':
        return <GithubOutlined />;
      case 'wechat':
        return <WechatOutlined />;
      case 'qq':
        return <QqOutlined />;
      default:
        return null;
    }
  };

  /**
   * 处理链接点击事件
   * @description 根据链接类型决定是在新窗口打开还是在当前窗口跳转
   * @param {LinkItem} link - 链接项
   */
  const handleLinkClick = (link: LinkItem): void => {
    if (link.external) {
      window.open(link.url, '_blank');
    } else {
      // 这里可以集成路由跳转
      window.location.href = link.url;
    }
  };

  return (
    <AntFooter className="footer">
      <div className="footer-content">
        {/* 主要内容区域 */}
        <Row gutter={[32, 24]} className="footer-main">
          {/* 公司信息 */}
          <Col xs={24} sm={12} md={6}>
            <div className="footer-section">
              <h4 className="footer-title">{companyName}</h4>
              <p className="footer-description">
                致力于提供优质的Web应用模板，
                帮助开发者快速构建现代化的用户界面。
              </p>
            </div>
          </Col>

          {/* 友情链接 */}
          <Col xs={24} sm={12} md={6}>
            <div className="footer-section">
              <h4 className="footer-title">快速链接</h4>
              <ul className="footer-links">
                {finalLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(link);
                      }}
                      className="footer-link"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Col>

          {/* 联系方式 */}
          {contactInfo && (
            <Col xs={24} sm={12} md={6}>
              <div className="footer-section">
                <h4 className="footer-title">联系我们</h4>
                <div className="footer-contact">
                  {contactInfo.email && (
                    <div className="contact-item">
                      <MailOutlined className="contact-icon" />
                      <a href={`mailto:${contactInfo.email}`} className="contact-link">
                        {contactInfo.email}
                      </a>
                    </div>
                  )}
                  {contactInfo.phone && (
                    <div className="contact-item">
                      <PhoneOutlined className="contact-icon" />
                      <span className="contact-text">{contactInfo.phone}</span>
                    </div>
                  )}
                  {contactInfo.address && (
                    <div className="contact-item">
                      <EnvironmentOutlined className="contact-icon" />
                      <span className="contact-text">{contactInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          )}

          {/* 社交媒体 */}
          {socialLinks.length > 0 && (
            <Col xs={24} sm={12} md={6}>
              <div className="footer-section">
                <h4 className="footer-title">关注我们</h4>
                <Space className="footer-social">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title={social.title}
                    >
                      {getSocialIcon(social.type, social.icon)}
                    </a>
                  ))}
                </Space>
              </div>
            </Col>
          )}
        </Row>

        {/* 自定义内容 */}
        {customContent && (
          <>
            <Divider className="footer-divider" />
            <div className="footer-custom">{customContent}</div>
          </>
        )}

        {/* 版权信息 */}
        <Divider className="footer-divider" />
        <div className="footer-copyright">
          <p>{copyright}</p>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;