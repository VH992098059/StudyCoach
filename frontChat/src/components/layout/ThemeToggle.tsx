import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

/**
 * 主题切换按钮（地铁线网设计系统）
 * 图标随主题切换：浅色显示月亮（点击进入深色），深色显示太阳
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      className={cn(
        'flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-3 transition-colors hover:bg-hover hover:text-text-1',
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
