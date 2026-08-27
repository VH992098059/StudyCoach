/**
 * 重置密码页（设计文档 4.6，RHF + zod 迁移自 antd Form）
 * 四步流程：发送验证码 → 验证身份 → 设置新密码 → 完成
 * 保留：60s 重发倒计时、模拟验证码验证（123456）
 */

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ShieldCheck, KeyRound, CheckCircle2, Send } from 'lucide-react';

import AuthLayout from '@/components/AuthLayout';
import { cn } from '@/lib/utils';

/** 步骤定义（图标 + 标题） */
const STEPS = [
  { icon: Mail, titleKey: 'auth.resetPassword.steps.verifyEmail' },
  { icon: ShieldCheck, titleKey: 'auth.resetPassword.steps.verifyIdentity' },
  { icon: KeyRound, titleKey: 'auth.resetPassword.steps.reset' },
] as const;

/** 步骤条：编号圆点 + 连接线（地铁线网风格） */
const StepBar: React.FC<{ current: number }> = ({ current }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-5 flex items-start">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.titleKey}>
            {i > 0 && (
              <div className={cn('mt-[13px] h-px flex-1', i <= current ? 'bg-primary' : 'bg-border-strong')} />
            )}
            <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-[26px] items-center justify-center rounded-full border transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !done && !active && 'border-border-strong text-text-4',
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}
              </div>
              <span className={cn('text-center text-[11px] leading-tight', active ? 'text-text-1' : 'text-text-3')}>
                {t(step.titleKey)}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** 字段错误文案 */
const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="text-xs text-danger">{message}</p> : null;

/** 邮箱步骤表单 */
const EmailStep: React.FC<{
  loading: boolean;
  onSubmit: (email: string) => void;
}> = ({ loading, onSubmit }) => {
  const { t } = useTranslation();
  const schema = z.object({
    email: z
      .string()
      .min(1, 'auth.resetPassword.validation.emailRequired')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'auth.resetPassword.validation.emailInvalid'),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <form
      onSubmit={form.handleSubmit((v) => onSubmit(v.email))}
      className="flex flex-col gap-3.5"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-email">{t('auth.email')}</Label>
        <Input id="rp-email" type="email" placeholder={t('auth.resetPassword.emailStep.placeholder')} {...form.register('email')} />
        <FieldError message={form.formState.errors.email?.message ? t(form.formState.errors.email.message) : undefined} />
      </div>
      <Button type="submit" className="h-9 w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {loading ? t('auth.resetPassword.emailStep.sending') : t('auth.resetPassword.emailStep.btn')}
      </Button>
    </form>
  );
};

/** 验证码步骤表单 */
const VerifyStep: React.FC<{
  email: string;
  countdown: number;
  loading: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
}> = ({ email, countdown, loading, onSubmit, onResend }) => {
  const { t } = useTranslation();
  const schema = z.object({
    code: z
      .string()
      .min(1, 'auth.resetPassword.validation.codeRequired')
      .regex(/^\d{6}$/, 'auth.resetPassword.validation.codeLen'),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v.code))} className="flex flex-col gap-3.5" noValidate>
      <p className="text-[12.5px] leading-relaxed text-text-3">
        {t('auth.resetPassword.verifyStep.sentTo')}
        <span className="font-medium text-text-1">{email}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-code">{t('auth.resetPassword.steps.verifyIdentity')}</Label>
        <Input
          id="rp-code"
          inputMode="numeric"
          maxLength={6}
          className="font-mono tracking-[0.3em]"
          placeholder={t('auth.resetPassword.verifyStep.placeholder')}
          {...form.register('code')}
        />
        <FieldError message={form.formState.errors.code?.message ? t(form.formState.errors.code.message) : undefined} />
      </div>
      <div className="flex min-h-5 items-center justify-center text-xs">
        {countdown > 0 ? (
          <span className="font-mono text-text-3">
            {countdown}
            {t('auth.resetPassword.verifyStep.countdown')}
          </span>
        ) : (
          <button type="button" className="cursor-pointer bg-transparent p-0 text-primary hover:underline" onClick={onResend}>
            {t('auth.resetPassword.verifyStep.resend')}
          </button>
        )}
      </div>
      <Button type="submit" className="h-9 w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? t('auth.resetPassword.verifyStep.verifying') : t('auth.resetPassword.verifyStep.btn')}
      </Button>
    </form>
  );
};

/** 新密码步骤表单 */
const ResetStep: React.FC<{
  loading: boolean;
  onSubmit: (newPassword: string) => void;
}> = ({ loading, onSubmit }) => {
  const { t } = useTranslation();
  const schema = z
    .object({
      newPassword: z
        .string()
        .min(1, 'auth.resetPassword.validation.pwdRequired')
        .min(6, 'auth.resetPassword.validation.pwdLen')
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'auth.resetPassword.validation.pwdPattern'),
      confirmPassword: z.string().min(1, 'auth.resetPassword.validation.confirmRequired'),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: 'auth.resetPassword.validation.confirmMismatch',
      path: ['confirmPassword'],
    });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v.newPassword))} className="flex flex-col gap-3.5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-new">{t('profile.newPassword')}</Label>
        <Input
          id="rp-new"
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.resetPassword.resetStep.newPwdPlaceholder')}
          aria-invalid={!!errors.newPassword}
          {...register('newPassword')}
        />
        <FieldError message={errors.newPassword?.message ? t(errors.newPassword.message) : undefined} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rp-confirm">{t('profile.confirmPassword')}</Label>
        <Input
          id="rp-confirm"
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.resetPassword.resetStep.confirmPwdPlaceholder')}
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <FieldError message={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined} />
      </div>
      <Button type="submit" className="h-9 w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? t('auth.resetPassword.resetStep.resetting') : t('auth.resetPassword.resetStep.btn')}
      </Button>
    </form>
  );
};

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** 启动 60s 重发倒计时 */
  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /** 发送验证码（模拟 API，保留原逻辑） */
  const handleSendCode = async (value: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEmail(value);
      toast.success(t('auth.resetPassword.messages.codeSent'));
      startCountdown();
      setCurrentStep(1);
    } catch (error) {
      console.error('发送验证码失败:', error);
      toast.error(t('auth.resetPassword.messages.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  /** 验证验证码（模拟 API：123456 通过，保留原逻辑） */
  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (code === '123456') {
        toast.success(t('auth.resetPassword.messages.verifySuccess'));
        setCurrentStep(2);
      } else {
        toast.error(t('auth.resetPassword.messages.verifyFailed'));
      }
    } catch (error) {
      console.error('验证码验证失败:', error);
      toast.error(t('auth.resetPassword.messages.verifyError'));
    } finally {
      setLoading(false);
    }
  };

  /** 重置密码（模拟 API，保留原逻辑） */
  const handleResetPassword = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t('auth.resetPassword.messages.resetSuccess'));
      setCurrentStep(3);
    } catch (error) {
      console.error('密码重置失败:', error);
      toast.error(t('auth.resetPassword.messages.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.resetPassword.title')} subtitle={t('auth.resetPassword.subtitle')}>
      {currentStep < 3 ? (
        <>
          <StepBar current={currentStep} />
          {currentStep === 0 && <EmailStep loading={loading} onSubmit={handleSendCode} />}
          {currentStep === 1 && (
            <VerifyStep
              email={email}
              countdown={countdown}
              loading={loading}
              onSubmit={handleVerifyCode}
              onResend={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && <ResetStep loading={loading} onSubmit={handleResetPassword} />}
          <div className="mt-4 text-center">
            <Link to="/login" className="text-[13px] text-text-3 hover:text-primary hover:underline">
              ← {t('auth.resetPassword.backToLogin')}
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 className="size-10 text-success" strokeWidth={1.5} />
          <div>
            <div className="text-[15px] font-semibold text-text-1">{t('auth.resetPassword.successStep.title')}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-3">{t('auth.resetPassword.successStep.subtitle')}</p>
          </div>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button className="h-9 w-full" onClick={() => navigate('/login')}>
              {t('auth.resetPassword.successStep.loginBtn')}
            </Button>
            <Button variant="outline" className="h-9 w-full" onClick={() => navigate('/')}>
              {t('auth.resetPassword.successStep.backHomeBtn')}
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
