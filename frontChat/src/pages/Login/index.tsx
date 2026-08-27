/**
 * 登录页（设计文档 4.6，RHF + zod 迁移自 antd Form）
 * 保留：匿名会话合并、记住密码、token 存储、来源跳转逻辑
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, LogIn } from 'lucide-react';

import AuthLayout from '@/components/AuthLayout';
import { LoginRegisterService } from '@/services/login_register';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'auth.validation.usernameRequired')
    .min(3, 'auth.validation.usernameMin')
    .max(20, 'auth.validation.usernameMax'),
  password: z
    .string()
    .min(1, 'auth.validation.passwordRequired')
    .min(6, 'auth.validation.passwordMin'),
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** 未登录本地会话（登录后由后端合并到用户历史） */
interface AnonymousSession {
  id: string;
  title: string;
  messages: {
    msg_id: string;
    content: string;
    isUser: boolean;
    timestamp: string;
    reasoningContent?: string;
  }[];
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: false },
  });
  const { register, handleSubmit, setValue, formState: { errors } } = form;

  useEffect(() => {
    // 从需鉴权页面跳转过来时弹出提示
    const state = location.state as { authRequired?: boolean } | null;
    if (state?.authRequired) {
      toast.warning(t('auth.loginRequired'));
    }

    // 回填记住的账号密码
    const remembered = localStorage.getItem('remembered_credentials');
    if (remembered) {
      try {
        const { username, password } = JSON.parse(remembered);
        setValue('username', username);
        setValue('password', atob(password));
        setValue('remember', true);
      } catch (e) {
        console.error('Failed to parse remembered credentials:', e);
        localStorage.removeItem('remembered_credentials');
      }
    }
  }, [location, setValue, t]);

  /** 读取未登录时的本地会话，由后端合并到用户历史 */
  const readAnonymousSessions = (): AnonymousSession[] => {
    try {
      const stored = localStorage.getItem('ai_chat_sessions_local');
      if (!stored) return [];
      const sessions = JSON.parse(stored);
      return (Array.isArray(sessions) ? sessions : [])
        .map((s: {
          id?: string;
          title?: string;
          messages?: {
            msg_id?: string;
            id?: string | number;
            content?: string;
            isUser?: boolean;
            timestamp?: string | Date;
            reasoningContent?: string;
          }[];
        }) => ({
          id: s.id || '',
          title: s.title || '新对话',
          messages: (s.messages || []).map((m) => ({
            msg_id: m.msg_id || String(m.id || Date.now()),
            content: m.content || '',
            isUser: !!m.isUser,
            timestamp:
              m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp || new Date().toISOString()),
            ...(m.reasoningContent ? { reasoningContent: m.reasoningContent } : {}),
          })),
        }))
        .filter((s) => s.id && s.messages.length > 0);
    } catch {
      return [];
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const anonymousSessions = readAnonymousSessions();
      const result = await LoginRegisterService.login({
        username: values.username,
        password: values.password,
        anonymousSessions: anonymousSessions.length > 0 ? anonymousSessions : undefined,
      });

      if (result && result.token) {
        toast.success(t('auth.success.login'));

        const userInfo = {
          username: values.username,
          token: result.token,
          uuid: result.uuid,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('access_token', result.token);

        // 已合并到云端，清除本地未登录会话
        if (anonymousSessions.length > 0) {
          localStorage.removeItem('ai_chat_sessions_local');
        }

        if (values.remember) {
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          localStorage.setItem(
            'remembered_credentials',
            JSON.stringify({ username: values.username, password: btoa(values.password) }),
          );
        } else {
          sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
          localStorage.removeItem('remembered_credentials');
        }

        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
        navigate(from !== '/' && from !== '/login' ? from : '/', { replace: true });
      } else {
        toast.error(t('auth.error.login'));
      }
    } catch (error) {
      console.error('登录请求失败:', error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-username">{t('auth.username')}</Label>
          <Input
            id="login-username"
            autoComplete="username"
            placeholder={t('auth.username')}
            aria-invalid={!!errors.username}
            {...register('username')}
          />
          {errors.username && <p className="text-xs text-danger">{t(errors.username.message || '')}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">{t('auth.password')}</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder={t('auth.password')}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-danger">{t(errors.password.message || '')}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="login-remember" className="flex cursor-pointer items-center gap-2 text-[13px] text-text-2">
            <Checkbox id="login-remember" checked={form.watch('remember')} onCheckedChange={(v) => setValue('remember', v === true)} />
            {t('auth.rememberMe')}
          </label>
          <Link to="/reset-password" className="text-[13px] text-primary hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="mt-1 h-9 w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {loading ? t('auth.loginLoading') : t('auth.loginBtn')}
        </Button>

        <div className="my-1 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-text-4">{t('auth.haveAccount')}</span>
          <Separator className="flex-1" />
        </div>

        <div className="text-center text-[13px] text-text-3">
          {t('auth.noAccount')}
          <Link to="/register" className="ml-1 font-medium text-primary hover:underline">
            {t('auth.registerNow')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
