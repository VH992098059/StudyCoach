/**
 * 定时任务核心状态 Hook（react-hook-form 版，迁移自 antd Form 实现）
 *
 * 保留的业务逻辑（与旧版等价）：
 * - computeNextRunTime / generateCronExpression：五种调度模式的
 *   下次执行时间计算与 cron 表达式生成（秒级：秒 分 时 日 月 周）
 * - 任务列表加载、表单回填（含 cron 表达式反解析）、创建/更新保存
 * - 立即执行 + 3s 轮询执行记录（最多 60 次）、启停/暂停恢复、删除
 * - WS onCronComplete 完成回调（applyCronRunFinished）
 * 差异：
 * - 表单从 antd Form 迁移到 RHF（time 由 Dayjs 改为 'HH:mm:ss' 字符串）
 * - 日志条目使用 cron_execute 真实字段（status/error_message/duration），
 *   不再将全部条目硬编码为成功
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { CronFormValues, CronTask, LogEntry, Mode } from '../types';
import { CronService, type CronCreateReq } from '@/services/cron';

function clampDayOfMonth(year: number, monthIndexZero: number, day: number) {
  const end = dayjs(new Date(year, monthIndexZero + 1, 0)).date();
  return Math.min(Math.max(1, day), end);
}

/** 'HH:mm:ss' → {h,m,s}，缺省 09:00:00 */
function parseTimeStr(t?: string): { h: number; m: number; s: number } {
  const parts = (t || '09:00:00').split(':').map((x) => parseInt(x, 10) || 0);
  return { h: parts[0] || 0, m: parts[1] || 0, s: parts[2] || 0 };
}

export function computeNextRunTime(cfg: Partial<CronFormValues>, paused: boolean): number | null {
  if (paused) return null;
  const now = dayjs();
  switch (cfg.mode) {
    case 'hourly': {
      const m = typeof cfg.minuteOfHour === 'number' ? cfg.minuteOfHour : 0;
      const s = typeof cfg.secondOfMinute === 'number' ? cfg.secondOfMinute : 0;
      let next = now.minute(m).second(s).millisecond(0);
      if (!next.isAfter(now)) {
        next = next.add(1, 'hour');
      }
      return next.valueOf();
    }
    case 'daily': {
      const { h, m, s } = parseTimeStr(cfg.time);
      let next = now.hour(h).minute(m).second(s).millisecond(0);
      if (!next.isAfter(now)) {
        next = next.add(1, 'day');
      }
      return next.valueOf();
    }
    case 'weekly': {
      const { h, m, s } = parseTimeStr(cfg.time);
      const targetDow = typeof cfg.weekday === 'number' ? cfg.weekday : 1;
      let next = now.hour(h).minute(m).second(s).millisecond(0);
      const currentDow = next.day();
      let addDays = (targetDow - currentDow + 7) % 7;
      if (addDays === 0 && !next.isAfter(now)) addDays = 7;
      next = next.add(addDays, 'day');
      return next.valueOf();
    }
    case 'monthly': {
      const { h, m, s } = parseTimeStr(cfg.time);
      const desiredDay = typeof cfg.dayOfMonth === 'number' ? cfg.dayOfMonth : 1;
      const y = now.year();
      const mo = now.month(); // 0-based
      const targetDay = clampDayOfMonth(y, mo, desiredDay);
      let next = dayjs(new Date(y, mo, targetDay))
        .hour(h)
        .minute(m)
        .second(s)
        .millisecond(0);
      if (!next.isAfter(now)) {
        const ny = now.add(1, 'month').year();
        const nm = now.add(1, 'month').month();
        const nd = clampDayOfMonth(ny, nm, desiredDay);
        next = dayjs(new Date(ny, nm, nd)).hour(h).minute(m).second(s).millisecond(0);
      }
      return next.valueOf();
    }
    case 'custom':
    default:
      return null;
  }
}

export function generateCronExpression(values: CronFormValues): string {
  switch (values.mode) {
    case 'hourly': {
      const m = values.minuteOfHour ?? 0;
      const s = values.secondOfMinute ?? 0;
      return `${s} ${m} * * * *`;
    }
    case 'daily': {
      const { h, m, s } = parseTimeStr(values.time);
      return `${s} ${m} ${h} * * *`;
    }
    case 'weekly': {
      const { h, m, s } = parseTimeStr(values.time);
      const w = values.weekday !== undefined ? values.weekday : 1;
      return `${s} ${m} ${h} * * ${w}`;
    }
    case 'monthly': {
      const { h, m, s } = parseTimeStr(values.time);
      const d = values.dayOfMonth || 1;
      return `${s} ${m} ${h} ${d} * *`;
    }
    case 'custom':
    default:
      return values.cronExpr || '';
  }
}

const DEFAULT_FORM_VALUES: CronFormValues = {
  cronName: '',
  kbId: 'none',
  updateType: 'incremental',
  mode: 'daily',
  time: '09:00:00',
  weekday: 1,
  dayOfMonth: 1,
  minuteOfHour: 0,
  secondOfMinute: 0,
  cronExpr: '0 0 9 * * *',
};

export const useCronState = () => {
  const { t } = useTranslation();
  const form = useForm<CronFormValues>({ defaultValues: DEFAULT_FORM_VALUES });

  // Task Management State
  const [tasks, setTasks] = useState<CronTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  // Current Task State
  const [execStatus, setExecStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [detail, setDetail] = useState<{ open: boolean; content?: string }>({ open: false });

  const runPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRunPoll = () => {
    if (runPollRef.current) {
      clearInterval(runPollRef.current);
      runPollRef.current = null;
    }
  };

  // Form Watchers
  const mode = form.watch('mode');
  const cronExpr = form.watch('cronExpr');
  const time = form.watch('time');
  const weekday = form.watch('weekday');
  const dayOfMonth = form.watch('dayOfMonth');
  const minuteOfHour = form.watch('minuteOfHour');
  const secondOfMinute = form.watch('secondOfMinute');
  const kbId = form.watch('kbId');

  // Derived state
  const currentTask = tasks.find((task) => task.id === selectedTaskId);
  const enabled = currentTask ? currentTask.status !== 0 : false;
  const paused = currentTask ? currentTask.status === 2 : false;
  const [isCreating, setIsCreating] = useState(false);

  // Initialize tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      const res = await CronService.list({ page: 1, size: 100 });
      if (res && res.list) {
        const apiTasks: CronTask[] = res.list.map((item) => {
          const schedulingMethod = (item.schedulingMethod || item.scheduling_method) as Mode;
          const contentType = (item.contentType || item.content_type) === 1 ? 1 : 2;
          const knowledgeBaseName =
            item.knowledgeBaseName || item.knowledge_base_name || 'none';
          return {
            id: item.id,
            cronName: item.cronName || item.cron_name || `${t('cron.task')} ${item.id}`,
            cronExpression: item.cronExpression || item.cron_expression,
            knowledgeBasename: knowledgeBaseName,
            contentType,
            status: item.status as 0 | 1 | 2,
            config: {
              mode: schedulingMethod || 'custom',
              cronExpr: item.cronExpression || item.cron_expression,
              kbId: knowledgeBaseName,
              updateType: contentType === 1 ? 'full' : 'incremental',
            },
          };
        });
        setTasks(apiTasks);
      }
    } catch (error) {
      console.error('Failed to fetch cron tasks:', error);
      toast.error(t('cron.messages.fetchFailed'));
    }
  }, [t]);

  // Fetch execution logs；syncExec 为 false 时只更新列表，不根据空列表把状态打成 idle（用于轮询进行中）
  const fetchLogs = useMemo(
    () =>
      async (taskId: string, cronName: string, options?: { syncExec?: boolean }): Promise<number> => {
        const syncExec = options?.syncExec !== false;
        try {
          const res = await CronService.listLogs({ cron_name_fk: cronName, page: 1, size: 20 });
          if (res && res.list) {
            const apiLogs: LogEntry[] = res.list.map((item) => {
              const statusNum = Number(item.status ?? 1);
              const logStatus: LogEntry['status'] =
                statusNum === 2 ? 'failed' : statusNum === 0 ? 'running' : 'success';
              return {
                id: item.id,
                time: dayjs(item.executeTime || item.execute_time).valueOf(),
                status: logStatus,
                detail: item.errorMessage || item.errorMessage,
                durationMs: item.duration,
                cronName: item.cronNameFk || item.cron_name_fk || cronName,
              };
            });
            setLogs(apiLogs);
            if (syncExec) {
              const hasFailed = apiLogs.some((l) => l.status === 'failed');
              if (apiLogs.length > 0) {
                setLastRun(apiLogs[0].time);
                setExecStatus(hasFailed ? 'failed' : 'success');
              } else {
                setLastRun(null);
                setExecStatus('idle');
              }
            }
            return apiLogs.length;
          }
          if (syncExec) {
            setLogs([]);
            setLastRun(null);
            setExecStatus('idle');
          }
          return 0;
        } catch (error) {
          console.error('Failed to fetch logs:', error);
          setLogs([]);
          if (syncExec) {
            setExecStatus('idle');
          }
          return -1;
        }
      },
    [],
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => () => clearRunPoll(), []);

  // Load selected task data into form
  useEffect(() => {
    if (isCreating) return;

    if (selectedTaskId) {
      const task = tasks.find((task) => task.id === selectedTaskId);
      if (task) {
        // Fetch logs
        fetchLogs(task.id, task.cronName);

        // Map scheduling_method to form mode
        const modeValue = (task.config?.mode || 'custom') as Mode;

        // Parse cron expression (6-part: sec min hour dom month dow / 5-part fallback)
        const cronExpr = task.config?.cronExpr || task.cronExpression;
        let timeValue = '09:00:00';
        let weekdayVal = 1;
        let dayOfMonthVal = 1;
        let minuteVal = 0;
        let secondVal = 0;

        if (cronExpr) {
          const parts = cronExpr.split(' ');
          if (parts.length >= 6) {
            const second = parseInt(parts[0]) || 0;
            const minute = parseInt(parts[1]) || 0;
            const hour = parseInt(parts[2]) || 0;
            const dom = parts[3] === '*' ? 1 : parseInt(parts[3]) || 1;
            const dow = parts[5] === '*' ? 1 : parseInt(parts[5]) || 1;
            timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
            weekdayVal = dow;
            dayOfMonthVal = dom;
            minuteVal = minute;
            secondVal = second;
          } else if (parts.length >= 5) {
            const minute = parseInt(parts[0]) || 0;
            const hour = parseInt(parts[1]) || 0;
            const dom = parts[2] === '*' ? 1 : parseInt(parts[2]) || 1;
            const dow = parts[4] === '*' ? 1 : parseInt(parts[4]) || 1;
            timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
            weekdayVal = dow;
            dayOfMonthVal = dom;
            minuteVal = minute;
          }
        }

        form.reset({
          ...DEFAULT_FORM_VALUES,
          cronName: task.cronName || '',
          cronExpr: cronExpr || '',
          ...task.config,
          mode: modeValue,
          time: task.config?.time || timeValue,
          weekday: task.config?.weekday ?? weekdayVal,
          dayOfMonth: task.config?.dayOfMonth ?? dayOfMonthVal,
          minuteOfHour: task.config?.minuteOfHour ?? minuteVal,
          secondOfMinute: task.config?.secondOfMinute ?? secondVal,
          updateType: task.config?.updateType || (task.contentType === 1 ? 'full' : 'incremental'),
          kbId: task.config?.kbId || task.knowledgeBasename,
        });
      }
    }
  }, [selectedTaskId, form, tasks, isCreating, fetchLogs]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedTaskId(undefined);
    form.reset(DEFAULT_FORM_VALUES);
  };

  const handleSave = form.handleSubmit(async (values) => {
    try {
      const generatedCron = generateCronExpression(values);

      if (isCreating) {
        const createData: CronCreateReq = {
          cron_name: values.cronName,
          knowledge_base_name: values.kbId || '',
          scheduling_method: values.mode || 'custom',
          cron_expression: generatedCron,
          status: 0, // 默认未启用
          content_type: values.updateType === 'full' ? 1 : 2,
        };
        const res = await CronService.create(createData);
        if (res && res.id) {
          const newTask: CronTask = {
            id: res.id,
            cronName: createData.cron_name,
            knowledgeBasename: createData.knowledge_base_name,
            cronExpression: createData.cron_expression,
            status: 0,
            contentType: createData.content_type === 1 ? 1 : 2,
            config: {
              ...values,
              cronExpr: generatedCron,
              kbId: createData.knowledge_base_name,
            },
          };
          setTasks((prev) => [...prev, newTask]);
          setSelectedTaskId(newTask.id);
          setIsCreating(false);
          toast.success(t('cron.messages.createSuccess'));
        }
      } else {
        if (!selectedTaskId) return;

        const currentTask = tasks.find((task) => task.id === selectedTaskId);

        const updateData = {
          id: selectedTaskId,
          cron_name: values.cronName,
          knowledge_base_name: values.kbId || '',
          scheduling_method: values.mode || 'custom',
          cron_expression: generatedCron,
          content_type: values.updateType === 'full' ? 1 : 2,
          status: currentTask?.status || 0,
        };

        await CronService.updateOne(updateData);

        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === selectedTaskId) {
              return {
                ...task,
                cronName: values.cronName || task.cronName,
                cronExpression: generatedCron,
                knowledgeBasename: values.kbId || 'none',
                contentType: values.updateType === 'full' ? 1 : 2,
                config: { ...task.config, ...values, cronExpr: generatedCron },
              };
            }
            return task;
          }),
        );
        toast.success(t('cron.messages.saveSuccess'));
      }
    } catch (error) {
      console.error('Save task failed:', error);
      toast.error(t('cron.messages.saveFailed'));
    }
  });

  const applyCronRunFinished = useCallback(
    (cronId: string, success: boolean) => {
      if (cronId !== selectedTaskId) return;
      clearRunPoll();
      setExecStatus(success ? 'success' : 'failed');
      const task = tasks.find((task) => task.id === cronId);
      if (task) {
        void fetchLogs(cronId, task.cronName, { syncExec: true });
      }
    },
    [selectedTaskId, tasks, fetchLogs],
  );

  const handleRunNow = async () => {
    if (!selectedTaskId) return;

    const task = tasks.find((task) => task.id === selectedTaskId);
    if (!task) return;

    const taskId = selectedTaskId;
    const cronName = task.cronName;

    clearRunPoll();
    setExecStatus('running');
    toast.loading(t('cron.messages.startExec'), { id: 'runNow' });

    try {
      await CronService.run({ id: taskId });
      toast.success(t('cron.messages.runTriggered'), { id: 'runNow' });

      let n = 0;
      runPollRef.current = setInterval(async () => {
        n += 1;
        const cnt = await fetchLogs(taskId, cronName, { syncExec: false });
        if (cnt > 0) {
          clearRunPoll();
          await fetchLogs(taskId, cronName, { syncExec: true });
          return;
        }
        if (cnt < 0 || n >= 60) {
          clearRunPoll();
          setExecStatus('idle');
          if (cnt < 0) {
            toast.error(t('cron.messages.logFetchFailed'));
          } else {
            toast.warning(t('cron.messages.execStillRunningHint'));
          }
        }
      }, 3000);
    } catch (error) {
      console.error('Run failed:', error);
      clearRunPoll();
      setExecStatus('failed');
      toast.error(t('cron.messages.execFailed'), { id: 'runNow' });
    }
  };

  /** 启停切换：任务行开关（0↔非0）与配置面板按钮共用 */
  const handleToggleStatus = useCallback(
    async (taskId?: string) => {
      const id = taskId || selectedTaskId;
      if (!id) return;

      const task = tasks.find((task) => task.id === id);
      if (!task) return;

      const nextStatus = task.status === 0 ? 1 : 0;
      try {
        await CronService.updateOneStatus({ id, status: nextStatus });
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? { ...task, status: nextStatus } : task)),
        );
        toast.info(
          nextStatus !== 0 ? t('cron.messages.enable') : t('cron.messages.disable'),
        );
      } catch (error) {
        console.error('Toggle status failed:', error);
        toast.error(t('cron.messages.opFailed'));
      }
    },
    [tasks, selectedTaskId, t],
  );

  const handlePauseResume = async () => {
    if (!selectedTaskId) return;
    const nextStatus = paused ? 1 : 2;
    try {
      await CronService.updateOneStatus({ id: selectedTaskId, status: nextStatus });
      setTasks((prev) =>
        prev.map((task) => (task.id === selectedTaskId ? { ...task, status: nextStatus } : task)),
      );
      toast.info(
        nextStatus === 1 ? t('cron.messages.resumeSuccess') : t('cron.messages.pauseSuccess'),
      );
    } catch (error) {
      console.error('Pause/Resume failed:', error);
      toast.error(t('cron.messages.opFailed'));
    }
  };

  const nextRun = useMemo(
    () =>
      enabled
        ? computeNextRunTime(
            {
              mode: mode || 'custom',
              cronExpr: cronExpr || '',
              time,
              weekday,
              dayOfMonth,
              minuteOfHour,
              secondOfMinute,
            },
            paused,
          )
        : null,
    [enabled, mode, cronExpr, time, weekday, dayOfMonth, minuteOfHour, secondOfMinute, paused],
  );

  const handleDeleteTask = async (id: string) => {
    try {
      await CronService.delete({ id });
      setTasks((prev) => prev.filter((task) => task.id !== id));
      if (selectedTaskId === id) {
        setSelectedTaskId(undefined);
        form.reset(DEFAULT_FORM_VALUES);
      }
      toast.success(t('cron.messages.deleteSuccess'));
    } catch (error) {
      console.error('Delete task failed:', error);
      toast.error(t('cron.messages.deleteFailed'));
    }
  };

  const handleSelectTask = (id: string) => {
    setIsCreating(false);
    setSelectedTaskId(id);
  };

  return {
    form,
    tasks,
    selectedTaskId,
    execStatus,
    lastRun,
    logs,
    detail,
    setDetail,
    mode,
    kbId,
    enabled,
    paused,
    nextRun,
    handleStartCreate,
    isCreating,
    handleDeleteTask,
    handleSave,
    handleRunNow,
    handleToggleStatus,
    handlePauseResume,
    handleSelectTask,
    refreshTasks: fetchTasks,
    applyCronRunFinished,
  };
};
