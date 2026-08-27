/**
 * 注册页（设计文档 4.6，RHF + zod 迁移自 antd Form）
 * 保留：用户名/邮箱/密码完整校验、服务条款勾选、注册成功跳登录
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, UserPlus } from 'lucide-react';

import AuthLayout from '@/components/AuthLayout';
import { LoginRegisterService } from '@/services/login_register';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'auth.validation.usernameRequired')
      .min(3, 'auth.validation.usernameMin')
      .max(20, 'auth.validation.usernameMax')
      .regex(/^[a-zA-Z0-9_]+$/, 'auth.validation.usernamePattern'),
    email: z
      .string()
      .min(1, 'auth.validation.emailRequired')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'auth.validation.emailInvalid'),
    password: z
      .string()
      .min(1, 'auth.validation.passwordRequired')
      .min(6, 'auth.validation.passwordMin')
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'auth.validation.passwordPattern'),
    confirmPassword: z.string().min(1, 'auth.validation.confirmPasswordRequired'),
    agreement: z.boolean(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'auth.validation.passwordMismatch',
    path: ['confirmPassword'],
  })
  .refine((v) => v.agreement, {
    message: 'auth.validation.agreementRequired',
    path: ['agreement'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '', agreement: false },
  });
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const result = await LoginRegisterService.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });

      if (result && result.id) {
        toast.success(t('auth.success.register'));
        navigate('/login');
      } else {
        toast.error(t('auth.error.register'));
      }
    } catch (error) {
      console.error('注册请求失败:', error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-username">{t('auth.username')}</Label>
          <Input
            id="reg-username"
            autoComplete="username"
            placeholder={t('auth.username')}
            aria-invalid={!!errors.username}
            {...register('username')}
          />
          {errors.username && <p className="text-xs text-danger">{t(errors.username.message || '')}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-email">{t('auth.email')}</Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.email')}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-danger">{t(errors.email.message || '')}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-password">{t('auth.password')}</Label>
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.password')}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-danger">{t(errors.password.message || '')}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-confirm">{t('auth.confirmPassword')}</Label>
          <Input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-danger">{t(errors.confirmPassword.message || '')}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reg-agreement" className="flex cursor-pointer items-start gap-2 text-[12.5px] leading-relaxed text-text-2">
            <Checkbox
              id="reg-agreement"
              className="mt-0.5"
              checked={watch('agreement')}
              onCheckedChange={(v) => setValue('agreement', v === true, { shouldValidate: true })}
            />
            <span>
              {t('auth.agreement')}
              <Link to="/terms" target="_blank" className="mx-0.5 text-primary hover:underline">
                {t('auth.terms')}
              </Link>
              {t('auth.and')}
              <Link to="/privacy" target="_blank" className="mx-0.5 text-primary hover:underline">
                {t('auth.privacy')}
              </Link>
            </span>
          </label>
          {errors.agreement && <p className="text-xs text-danger">{t(errors.agreement.message || '')}</p>}
        </div>

        <Button type="submit" className="mt-1 h-9 w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {loading ? t('auth.registerLoading') : t('auth.registerBtn')}
        </Button>

        <div className="my-1 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-text-4">{t('auth.haveAccount')}</span>
          <Separator className="flex-1" />
        </div>

        <div className="text-center text-[13px] text-text-3">
          {t('auth.haveAccount')}
          <Link to="/login" className="ml-1 font-medium text-primary hover:underline">
            {t('auth.loginNow')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
