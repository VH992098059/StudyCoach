/**
 * 任务配置面板（设计文档 4.4，RHF 迁移自 antd Form 版）
 * 配置头含上次/下次执行时间（等宽）；短字段两两并排；
 * 更新方式 Radio（附语义说明）；五段调度模式分段按钮组（按模式联动）；
 * cron 表达式非自定义只读自动生成；操作按钮：保存/立即执行/启停/暂停恢复
 */

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { HelpCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusPill } from '@/components/common/StatusPill';
import KnowledgeSelector from '@/components/KnowledgeSelector';
import { cn } from '@/lib/utils';
import { generateCronExpression } from '../hooks/useCronState';
import type { CronFormValues, Mode } from '../types';

interface ConfigPanelProps {
  isCreating: boolean;
  taskName?: string;
  enabled: boolean;
  paused: boolean;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRun: number | null;
  nextRun: number | null;
  saving?: boolean;
  onSave: () => void;
  onRunNow: () => void;
  onEnableToggle: () => void;
  onPauseResume: () => void;
}

const MODES: Mode[] = ['hourly', 'daily', 'weekly', 'monthly', 'custom'];

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  isCreating,
  taskName,
  enabled,
  paused,
  status,
  lastRun,
  nextRun,
  saving,
  onSave,
  onRunNow,
  onEnableToggle,
  onPauseResume,
}) => {
  const { t } = useTranslation();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CronFormValues>();

  const mode = watch('mode');
  const updateType = watch('updateType');
  const kbId = watch('kbId');
  const cronExpr = watch('cronExpr');
  const values = watch();

  // 非自定义模式：表达式由表单值自动生成（只读展示）
  const displayExpr = mode === 'custom' ? cronExpr : generateCronExpression(values);

  const nextRunText = nextRun
    ? dayjs(nextRun).format('MM-DD HH:mm:ss')
    : !enabled
      ? t('cron.config.disabled')
      : mode === 'custom'
        ? t('cron.config.skipCustom')
        : paused
          ? t('cron.config.paused')
          : '—';

  const statusTone =
    status === 'running'
      ? ('primary' as const)
      : status === 'success'
        ? ('success' as const)
        : status === 'failed'
          ? ('danger' as const)
          : ('neutral' as const);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* 配置头：标题 + 执行状态 + 上次/下次执行 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-hover px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-text-1">
            {isCreating ? t('cron.config.createTitle') : t('cron.config.title')}
          </span>
          {taskName && !isCreating && (
            <span className="max-w-[160px] truncate text-[12.5px] text-text-3">· {taskName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={statusTone}>{t(`cron.status.${status}`)}</StatusPill>
          {!enabled && <StatusPill tone="neutral">{t('cron.config.disabled')}</StatusPill>}
          {paused && <StatusPill tone="warning">{t('cron.config.paused')}</StatusPill>}
        </div>
        <div className="flex w-full flex-col gap-0.5 text-[11.5px] text-text-3 sm:w-auto">
          <span>
            {t('cron.config.lastRun')}{' '}
            <b className="font-mono font-medium text-text-2">
              {lastRun ? dayjs(lastRun).format('MM-DD HH:mm:ss') : '—'}
            </b>
          </span>
          <span>
            {t('cron.config.nextRun')}{' '}
            <b className="font-mono font-medium text-text-2">{nextRunText}</b>
          </span>
        </div>
      </div>

      {/* 表单体 */}
      <div className="flex flex-col gap-3 p-4">
        {/* 任务名称 + 目标知识库（两两并排） */}
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="cron-cronName">{t('cron.config.name')}</Label>
            <Input
              id="cron-cronName"
              placeholder={t('cron.validation.nameRequired')}
              maxLength={20}
              aria-invalid={!!errors.cronName}
              {...register('cronName', {
                required: t('cron.validation.nameRequired'),
                maxLength: { value: 20, message: t('cron.validation.nameMax') },
              })}
            />
            {errors.cronName && (
              <p className="text-xs text-danger">{errors.cronName.message}</p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label>{t('cron.config.kb')}</Label>
            <KnowledgeSelector
              value={kbId}
              onChange={(v) => setValue('kbId', v, { shouldValidate: true })}
            />
          </div>
        </div>

        {/* 更新方式 */}
        <div className="flex flex-col gap-1.5">
          <Label>{t('cron.config.updateType')}</Label>
          <RadioGroup
            value={updateType}
            onValueChange={(v) =>
              setValue('updateType', v as CronFormValues['updateType'])
            }
            className="gap-2.5"
          >
            {(['incremental', 'full'] as const).map((type) => (
              <Label
                key={type}
                className={cn(
                  'flex cursor-pointer items-start gap-2 rounded-md border p-2.5 transition-colors',
                  updateType === type
                    ? 'border-primary bg-primary-bg'
                    : 'border-border hover:border-border-strong',
                )}
              >
                <RadioGroupItem value={type} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-text-1">
                    {t(`cron.config.${type}`)}
                  </span>
                  <span className="text-[11.5px] leading-relaxed text-text-3">
                    {t(`cron.config.${type}Desc`)}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* 调度模式：分段按钮组 */}
        <div className="flex flex-col gap-1.5">
          <Label>{t('cron.config.mode')}</Label>
          <div className="flex w-fit flex-wrap gap-1 rounded-md border border-border-strong p-[3px]">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('mode', m)}
                className={cn(
                  'cursor-pointer rounded-[3px] px-2.5 py-[5px] text-[12.5px] transition-colors',
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-text-3 hover:text-text-1',
                )}
              >
                {t(`cron.config.modes.${m}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 模式联动字段 */}
        {mode === 'hourly' && (
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t('cron.config.minute')}</Label>
              <Select
                value={String(values.minuteOfHour ?? 0)}
                onValueChange={(v) => setValue('minuteOfHour', Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i} {t('cron.config.minute')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('cron.config.second')}</Label>
              <Select
                value={String(values.secondOfMinute ?? 0)}
                onValueChange={(v) => setValue('secondOfMinute', Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i} {t('cron.config.second')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {(mode === 'daily' || mode === 'weekly' || mode === 'monthly') && (
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cron-time">{t('cron.config.execTime')}</Label>
              <Input
                id="cron-time"
                type="time"
                step={1}
                {...register('time', { required: t('cron.validation.timeRequired') })}
              />
            </div>

            {mode === 'weekly' && (
              <div className="flex flex-col gap-1.5">
                <Label>{t('cron.config.weekday')}</Label>
                <Select
                  value={String(values.weekday ?? 1)}
                  onValueChange={(v) => setValue('weekday', Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(
                      (key, i) => (
                        <SelectItem key={key} value={String(i)}>
                          {t(`cron.weekdays.${key}`)}
                        </SelectItem>
                      ),
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === 'monthly' && (
              <div className="flex flex-col gap-1.5">
                <Label>{t('cron.config.day')}</Label>
                <Select
                  value={String(values.dayOfMonth ?? 1)}
                  onValueChange={(v) => setValue('dayOfMonth', Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1} {t('cron.config.day')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* cron 表达式（自动生成只读 / 自定义可编辑）+ 帮助 */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cron-expr" className="flex items-center gap-1.5">
            {t('cron.config.cronExpr')}
            <span className="text-text-4">
              {mode === 'custom'
                ? `（${t('cron.config.customEditable')}）`
                : `（${t('cron.config.autoGenerated')}）`}
            </span>
          </Label>
          <div className="flex items-stretch gap-2">
            {mode === 'custom' ? (
              <Input
                id="cron-expr"
                placeholder={t('cron.help.ex2')}
                className="min-w-0 flex-1 font-mono"
                aria-invalid={!!errors.cronExpr}
                {...register('cronExpr', {
                  required: t('cron.validation.exprRequired'),
                })}
              />
            ) : (
              <Input
                id="cron-expr"
                readOnly
                value={displayExpr}
                className="min-w-0 flex-1 bg-hover font-mono text-text-2"
              />
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t('cron.config.help')}
                >
                  <HelpCircle className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top" align="end">
                <div className="flex flex-col gap-1 text-xs leading-relaxed text-text-2">
                  <p className="font-medium text-text-1">{t('cron.help.desc')}</p>
                  <p>{t('cron.help.example')}</p>
                  <p className="font-mono">{t('cron.help.ex1')}</p>
                  <p className="font-mono">{t('cron.help.ex2')}</p>
                  <p className="font-mono">{t('cron.help.ex3')}</p>
                  <p className="text-text-3">{t('cron.help.note')}</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {errors.cronExpr && (
            <p className="text-xs text-danger">{errors.cronExpr.message}</p>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {t('cron.actions.save')}
        </Button>
        <Button variant="outline" onClick={onRunNow} disabled={isCreating || status === 'running'}>
          {status === 'running' && <Loader2 className="size-4 animate-spin" />}
          {t('cron.actions.runNow')}
        </Button>
        <Button variant="outline" onClick={onEnableToggle} disabled={isCreating}>
          {enabled ? t('cron.actions.disable') : t('cron.actions.enable')}
        </Button>
        <Button variant="outline" onClick={onPauseResume} disabled={isCreating || !enabled}>
          {paused ? t('cron.actions.resume') : t('cron.actions.pause')}
        </Button>
      </div>
    </div>
  );
};

export default ConfigPanel;
