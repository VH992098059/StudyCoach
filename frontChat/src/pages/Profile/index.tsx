/**
 * 个人中心（设计文档 4.5，无统计卡/学科进度条）
 * 头部：头像（首字母）+ 用户名 + ID
 * 账号设置：用户名只读展示；密码修改走 Dialog（RHF + zod，调 updatePassword）
 * 偏好设置：深色模式（联动全局 useTheme）/ 学习提醒通知（localStorage）/ 界面语言（i18n）
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoginRegisterService } from '@/services/login_register';
import { useTheme } from '@/hooks/useTheme';
import { clearAuthStorage } from '@/utils/axios/interceptors';

const NOTIFICATION_PREF_KEY = 'preference_notifications';

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'profile.currentPasswordRequired'),
    newPassword: z.string().min(6, 'auth.validation.passwordMin'),
    confirmPassword: z.string().min(1, 'profile.confirmPasswordRequired'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'profile.passwordMismatch',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface UserInfo {
  username: string;
  uuid?: string;
  avatar?: string;
}

/** 设置列表行（label + 描述 + 右侧值/操作） */
const SettingsRow: React.FC<{
  label: string;
  desc?: string;
  children: React.ReactNode;
}> = ({ label, desc, children }) => (
  <div className="flex items-center justify-between gap-3.5 border-b border-row-border px-4 py-3 last:border-b-0">
    <div className="min-w-0">
      <div className="text-[13.5px] text-text-1">{label}</div>
      {desc && <div className="mt-0.5 text-xs text-text-3">{desc}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [userInfo] = useState<UserInfo | null>(() => {
    const stored = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse user info', e);
      return null;
    }
  });
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const pwForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_PREF_KEY);
    if (saved !== null) {
      setNotificationsEnabled(saved === 'true');
    }
  }, []);

  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem(NOTIFICATION_PREF_KEY, String(checked));
  };

  const handleChangePassword = pwForm.handleSubmit(async (values) => {
    try {
      await LoginRegisterService.updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      toast.success(t('profile.updatePasswordSuccess'));
      setPwDialogOpen(false);
      pwForm.reset();
    } catch (error) {
      console.error('Update password failed:', error);
      toast.error(t('profile.updatePasswordFailed'));
    }
  });

  if (!userInfo) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center gap-3 px-5 py-6 text-center">
        <p className="text-sm text-text-2">{t('profile.userInfoMissing')}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearAuthStorage();
            window.location.href = '/login';
          }}
        >
          {t('common.login')}
        </Button>
      </div>
    );
  }

  const pwErrors = pwForm.formState.errors;

  return (
    <div className="mx-auto w-full max-w-[720px] flex-1 px-5 py-6 md:px-8">
      {/* 头部：头像 + 用户名 + ID */}
      <div className="flex items-center gap-4">
        {userInfo.avatar ? (
          <img
            src={userInfo.avatar}
            alt={userInfo.username}
            className="size-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-medium text-primary-foreground">
            {userInfo.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold text-text-1">{userInfo.username}</h1>
          {userInfo.uuid && (
            <p className="mt-0.5 font-mono text-[12.5px] text-text-3">
              ID: {userInfo.uuid.substring(0, 8)}
            </p>
          )}
        </div>
      </div>

      {/* 账号设置 */}
      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-semibold text-text-2">
          {t('profile.accountSettings')}
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <SettingsRow
            label={t('profile.usernameLabel')}
            desc={t('profile.usernameDesc')}
          >
            <span className="text-[12.5px] text-text-3">{userInfo.username}</span>
          </SettingsRow>
          <SettingsRow
            label={t('profile.passwordLabel')}
            desc={t('profile.passwordDesc')}
          >
            <Button
              variant="link"
              className="h-auto p-0.5 text-[12.5px]"
              onClick={() => setPwDialogOpen(true)}
            >
              {t('profile.changePassword')}
            </Button>
          </SettingsRow>
        </div>
      </section>

      {/* 偏好设置 */}
      <section className="mt-7">
        <h2 className="mb-3 text-[13px] font-semibold text-text-2">
          {t('profile.preferences')}
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <SettingsRow
            label={t('profile.darkMode')}
            desc={t('profile.darkModeDesc')}
          >
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label={t('profile.darkMode')}
            />
          </SettingsRow>
          <SettingsRow
            label={t('profile.notifications')}
            desc={t('profile.notificationsDesc')}
          >
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
              aria-label={t('profile.notifications')}
            />
          </SettingsRow>
          <SettingsRow
            label={t('profile.language')}
            desc={t('profile.languageDesc')}
          >
            <Select
              value={i18n.language.startsWith('zh') ? 'zh' : 'en'}
              onValueChange={(v) => void i18n.changeLanguage(v)}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">{t('common.chinese')}</SelectItem>
                <SelectItem value="en">{t('common.english')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </div>
      </section>

      {/* 修改密码 Dialog */}
      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('profile.changePassword')}</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => void handleChangePassword(e)}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="oldPassword">{t('profile.currentPassword')}</Label>
              <Input
                id="oldPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!pwErrors.oldPassword}
                {...pwForm.register('oldPassword')}
              />
              {pwErrors.oldPassword && (
                <p className="text-xs text-danger">{t(pwErrors.oldPassword.message || '')}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!pwErrors.newPassword}
                {...pwForm.register('newPassword')}
              />
              {pwErrors.newPassword && (
                <p className="text-xs text-danger">{t(pwErrors.newPassword.message || '')}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!pwErrors.confirmPassword}
                {...pwForm.register('confirmPassword')}
              />
              {pwErrors.confirmPassword && (
                <p className="text-xs text-danger">
                  {t(pwErrors.confirmPassword.message || '')}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPwDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={pwForm.formState.isSubmitting}>
                {pwForm.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
