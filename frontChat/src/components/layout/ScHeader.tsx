import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, UserRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export interface ScHeaderUser {
  name: string;
  avatar?: string;
}

export interface ScHeaderProps {
  user?: ScHeaderUser;
  onLogin?: () => void;
  onLogout?: () => void;
}

/**
 * 主导航项（常驻三项：AI聊天 / 知识库 / 定时任务）
 * 索引器与检索器已并入知识库页（见前端重构设计文档 2.1 信息架构）
 */
const NAV_ITEMS = [
  { to: '/', i18nKey: 'menu.aiChat', end: true },
  { to: '/knowledgebase', i18nKey: 'menu.knowledgeBase', end: false },
  { to: '/cron', i18nKey: 'menu.cron', end: false },
] as const;

/**
 * 地铁线网风格顶栏
 * - 52px 高、2px 粗下边框（浅色墨黑 / 深色浅灰，随主题联动）
 * - 导航 active 态：primary-bg 底色 + 主色文字
 * - 右侧：主题切换 + 头像菜单（个人中心 / 退出登录）
 * - 移动端（<768px）：导航收纳进汉堡下拉菜单
 */
export function ScHeader({ user, onLogin, onLogout }: ScHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header className="relative z-30 flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-border bg-background px-5 dark:border-white/5">
      <div className="flex flex-1 items-center">
        {/* 移动端汉堡导航 */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="mr-1 flex size-8 cursor-pointer items-center justify-center rounded-sm text-text-1 outline-none md:hidden"
            aria-label="打开导航菜单"
          >
            <Menu className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {NAV_ITEMS.map((item) => (
              <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)}>
                {t(item.i18nKey)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {user ? (
              <>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  {t('common.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onLogout}>
                  {t('common.logout')}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={onLogin}>
                {t('common.login')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/" className="text-[15px] font-medium text-text-1">
          {t('common.appTitle')}
        </Link>

        {/* 桌面端主导航 */}
        <nav className="ml-7 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-sm px-3 py-1.5 text-[13px] text-text-3 transition-colors',
                  isActive &&
                    'bg-primary-bg font-medium text-text-1',
                )
              }
            >
              {t(item.i18nKey)}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground outline-none"
              aria-label={t('common.profile')}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="size-7 rounded-full object-cover" />
              ) : (
                (user.name?.trim()?.[0] ?? <UserRound className="size-4" />)
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                {t('common.profile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => navigate('/register')}>
              {t('common.register')}
            </Button>
            <Button size="sm" onClick={onLogin}>
              {t('common.login')}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
