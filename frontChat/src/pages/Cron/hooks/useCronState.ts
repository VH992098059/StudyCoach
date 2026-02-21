import { useState, useEffect, useRef, useMemo } from 'react';
import { Form, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { CronConfig, LogEntry } from '../types';
import type { CronTask } from '../components/TaskListCard';
import { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';
import { CronService, type CronCreateReq } from '@/services/cron';

function clampDayOfMonth(year: number, monthIndexZero: number, day: number) {
  const end = dayjs(new Date(year, monthIndexZero + 1, 0)).date();
  return Math.min(Math.max(1, day), end);
}

function computeNextRunTime(cfg: CronConfig, paused: boolean): number | null {
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
      const t = cfg.time || dayjs('09:00:00', 'HH:mm:ss');
      let next = now.hour(t.hour()).minute(t.minute()).second(t.second()).millisecond(0);
      if (!next.isAfter(now)) {
        next = next.add(1, 'day');
      }
      return next.valueOf();
    }
    case 'weekly': {
      const t = cfg.time || dayjs('09:00:00', 'HH:mm:ss');
      const targetDow = typeof cfg.weekday === 'number' ? cfg.weekday : 1;
      let next = now.hour(t.hour()).minute(t.minute()).second(t.second()).millisecond(0);
      const currentDow = next.day();
      let addDays = (targetDow - currentDow + 7) % 7;
      if (addDays === 0 && !next.isAfter(now)) addDays = 7;
      next = next.add(addDays, 'day');
      return next.valueOf();
    }
    case 'monthly': {
      const t = cfg.time || dayjs('09:00:00', 'HH:mm:ss');
      const desiredDay = typeof cfg.dayOfMonth === 'number' ? cfg.dayOfMonth : 1;
      const y = now.year();
      const m = now.month(); // 0-based
      const targetDay = clampDayOfMonth(y, m, desiredDay);
      let next = dayjs(new Date(y, m, targetDay)).hour(t.hour()).minute(t.minute()).second(t.second()).millisecond(0);
      if (!next.isAfter(now)) {
        const ny = now.add(1, 'month').year();
        const nm = now.add(1, 'month').month();
        const nd = clampDayOfMonth(ny, nm, desiredDay);
        next = dayjs(new Date(ny, nm, nd)).hour(t.hour()).minute(t.minute()).second(t.second()).millisecond(0);
      }
      return next.valueOf();
    }
    case 'custom': {
      return null;
    }
    default:
      return null;
  }
}

function generateCronExpression(values: CronConfig): string {
  switch (values.mode) {
    case 'hourly': {
      const m = values.minuteOfHour || 0;
      const s = values.secondOfMinute || 0;
      return `${s} ${m} * * * *`;
    }
    case 'daily': {
      const t = values.time || dayjs('09:00:00', 'HH:mm:ss');
      return `${t.second()} ${t.minute()} ${t.hour()} * * *`;
    }
    case 'weekly': {
      const t = values.time || dayjs('09:00:00', 'HH:mm:ss');
      const w = values.weekday !== undefined ? values.weekday : 1;
      return `${t.second()} ${t.minute()} ${t.hour()} * * ${w}`;
    }
    case 'monthly': {
      const t = values.time || dayjs('09:00:00', 'HH:mm:ss');
      const d = values.dayOfMonth || 1;
      return `${t.second()} ${t.minute()} ${t.hour()} ${d} * *`;
    }
    case 'custom':
    default:
      return values.cronExpr || '';
  }
}

export const useCronState = () => {
  const { t } = useTranslation();
  // Casting to any to bypass missing type definitions for setFieldsValue, etc. in current antd version
  const [form] = Form.useForm() as any;
  
  // Task Management State
  const [tasks, setTasks] = useState<CronTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  
  // Current Task State (derived from selected task or form)
  const [execStatus, setExecStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [detail, setDetail] = useState<{ open: boolean; content?: string }>({ open: false });
  
  const knowledgeSelectorRef = useRef<KnowledgeSelectorRef>(null);

  // Form Watchers
  const mode = Form.useWatch('mode', form);
  const cronExpr = Form.useWatch('cronExpr', form);
  const time = Form.useWatch('time', form);
  const weekday = Form.useWatch('weekday', form);
  const dayOfMonth = Form.useWatch('dayOfMonth', form);
  const minuteOfHour = Form.useWatch('minuteOfHour', form);
  const secondOfMinute = Form.useWatch('secondOfMinute', form);
  const selectedKnowledge = (Form.useWatch('kbId', form) as string) || 'none';

  // Derived state for ConfigPanel
  const currentTask = tasks.find(t => t.id === selectedTaskId);
  const enabled = currentTask ? currentTask.status !== 0 : false;
  const paused = currentTask ? currentTask.status === 2 : false;
  // 新增状态：标记是否正在创建新任务
  const [isCreating, setIsCreating] = useState(false);

  // Initialize tasks from API
  const fetchTasks = async () => {
    try {
      const res = await CronService.list({ page: 1, size: 100 });
      if (res && res.list) {
        const apiTasks: CronTask[] = res.list.map(item => ({
          id: String(item.id),
          cronName: item.cronName || item.cron_name || `${t('cron.task')} ${item.id}`,
          cronExpression: item.cronExpression || item.cron_expression,
          knowledgeBasename: item.knowledgeBaseName || item.knowledge_base_name,
          contentType: (item.contentType || item.content_type) === 1 ? 1 : 2,
          status: item.status as 0 | 1 | 2,
          // Frontend specific
          config: {
            mode: (item.schedulingMethod || item.scheduling_method as any) || 'custom',
            cronExpr: item.cronExpression || item.cron_expression,
            kbId: item.knowledgeBaseName || item.knowledge_base_name,
            updateType: (item.contentType || item.content_type) === 1 ? 'full' : 'incremental',
          }
        }));
        setTasks(apiTasks);
      }
    } catch (error) {
      console.error('Failed to fetch cron tasks:', error);
      message.error(t('cron.messages.fetchFailed'));
    }
  };

  // Fetch execution logs
  const fetchLogs = useMemo(() => async (taskId: string, cronName: string) => {
    try {
      const res = await CronService.listLogs({ cron_name_fk: cronName, page: 1, size: 20 });
      if (res && res.list) {
          const apiLogs: LogEntry[] = res.list.map(item => ({
              id: item.id,
              time: dayjs(item.executeTime || item.execute_time).valueOf(),
              status: 'success', 
              detail: t('cron.messages.execSuccessDetail'),
              durationMs: 0
          }));
          setLogs(apiLogs);
          
          if (apiLogs.length > 0) {
              setLastRun(apiLogs[0].time);
              setExecStatus('success');
          } else {
              setLastRun(null);
              setExecStatus('idle');
          }
      } else {
          setLogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    }
  }, [t]);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Load selected task data into form
  useEffect(() => {
    if (isCreating) return; // 如果正在创建，不加载选中任务数据
    
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
          // Fetch logs
          fetchLogs(task.id, task.cronName);

          // Fallback: initialize form from task fields
          // Map string scheduling_method (e.g. "daily", "weekly") to form mode
          const modeValue = (task.config?.mode || 'custom') as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
          
          // Parse cron expression if needed (e.g. "0 0 9 * * *")
          const cronExpr = task.config?.cronExpr || task.cronExpression;
          let timeValue = dayjs('09:00:00', 'HH:mm:ss');
          let weekdayVal = 1;
          let dayOfMonthVal = 1;
          let minuteVal = 0;
          let secondVal = 0;
          
          if (cronExpr) {
              const parts = cronExpr.split(' ');
              // Try to parse 6-part cron first (second minute hour dayOfMonth month dayOfWeek)
              if (parts.length >= 6) {
                  const second = parseInt(parts[0]) || 0;
                  const minute = parseInt(parts[1]) || 0;
                  const hour = parseInt(parts[2]) || 0;
                  const dom = parts[3] === '*' ? 1 : (parseInt(parts[3]) || 1);
                  const dow = parts[5] === '*' ? 1 : (parseInt(parts[5]) || 1);
                  
                  timeValue = dayjs().hour(hour).minute(minute).second(second);
                  weekdayVal = dow;
                  dayOfMonthVal = dom;
                  minuteVal = minute;
                  secondVal = second;
              } else if (parts.length >= 5) {
                  // 5-part cron (minute hour dayOfMonth month dayOfWeek)
                  const minute = parseInt(parts[0]) || 0;
                  const hour = parseInt(parts[1]) || 0;
                  const dom = parts[2] === '*' ? 1 : (parseInt(parts[2]) || 1);
                  const dow = parts[4] === '*' ? 1 : (parseInt(parts[4]) || 1);
                  
                  timeValue = dayjs().hour(hour).minute(minute).second(0);
                  weekdayVal = dow;
                  dayOfMonthVal = dom;
                  minuteVal = minute;
              }
          }

          form.setFieldsValue({ 
            mode: modeValue, 
            cronName: task.cronName || '', 
            cronExpr: cronExpr,
            time: timeValue,
            weekday: weekdayVal,
            dayOfMonth: dayOfMonthVal,
            minuteOfHour: minuteVal,
            secondOfMinute: secondVal,
            updateType: task.config?.updateType || (task.contentType === 1 ? 'full' : 'incremental'), 
            kbId: task.config?.kbId || task.knowledgeBasename,
            ...task.config
        });
        
        setExecStatus(task.execStatus || 'idle');
        setLastRun(task.lastRunTime || null);
      }
    }
  }, [selectedTaskId, form, tasks, isCreating]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedTaskId(undefined);
    form.resetFields();
    // 设置默认值
    form.setFieldsValue({
        mode: 'daily',
        updateType: 'incremental',
        time: dayjs('09:00:00', 'HH:mm:ss'),
        cronExpr: '0 0 9 * * *'
    });
  };

  const handleSave = async () => {
    try {
        const values = await form.validateFields();
        const generatedCron = generateCronExpression(values);

        if (isCreating) {
            // 创建新任务逻辑
            const createData: CronCreateReq = {
                cron_name: values.cronName,
                knowledge_base_name: (values.kbId || '') as string,
                scheduling_method: values.mode || 'custom',
                cron_expression: generatedCron,
                status: 0, // 默认未启用
                content_type: values.updateType === 'full' ? 1 : 2
            };
            const res = await CronService.create(createData);
            if (res && res.id) {
                const newTask: CronTask = {
                    id: String(res.id),
                    cronName: createData.cron_name,
                    knowledgeBasename: createData.knowledge_base_name,
                    cronExpression: createData.cron_expression,
                    status: 0,
                    contentType: createData.content_type === 1 ? 1 : 2,
                    config: {
                        ...values,
                        cronExpr: generatedCron, // Update config with generated cron
                        kbId: createData.knowledge_base_name,
                    }
                };
                setTasks(prev => [...prev, newTask]);
                setSelectedTaskId(newTask.id);
                setIsCreating(false);
                message.success(t('cron.messages.createSuccess'));
            }
        } else {
            // 更新现有任务逻辑
            if (!selectedTaskId) return;
            
            const currentTask = tasks.find(t => t.id === selectedTaskId);
            
            const updateData = {
                id: parseInt(selectedTaskId),
                cron_name: values.cronName,
                knowledge_base_name: (values.kbId || '') as string,
                scheduling_method: values.mode || 'custom',
                cron_expression: generatedCron,
                content_type: values.updateType === 'full' ? 1 : 2,
                status: currentTask?.status || 0, // Include current status
            };
            
            await CronService.updateOne(updateData);

            setTasks(prev => prev.map(t => {
                if (t.id === selectedTaskId) {
                    return {
                        ...t,
                        cronName: values.cronName || t.cronName,
                        cronExpression: generatedCron,
                        knowledgeBasename: values.kbId || 'none',
                        contentType: values.updateType === 'full' ? 1 : 2,
                        config: { ...t.config, ...values, cronExpr: generatedCron }
                    };
                }
                return t;
            }));
            message.success(t('cron.messages.saveSuccess'));
        }
    } catch (error) {
        console.error('Save task failed:', error);
        message.error(t('cron.messages.saveFailed'));
    }
  };

  const handleRunNow = async () => {
    if (!selectedTaskId) return;
    
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    setExecStatus('running');
    message.loading({ content: t('cron.messages.startExec'), key: 'runNow' });
    
    try {
        await CronService.run({ id: parseInt(selectedTaskId) });
        message.success({ content: t('cron.messages.execSuccess'), key: 'runNow' });
        
        // Refresh logs after a short delay to allow async execution to start/finish
        setTimeout(() => {
            fetchLogs(selectedTaskId, task.cronName);
        }, 2000);
    } catch (error) {
        console.error('Run failed:', error);
        setExecStatus('failed');
        message.error({ content: t('cron.messages.execFailed'), key: 'runNow' });
    }
  };

  const handleEnableToggle = async () => {
    if (!selectedTaskId) return;
    
    const nextStatus = enabled ? 0 : 1;
    try {
        await CronService.updateOneStatus({ id: parseInt(selectedTaskId), status: nextStatus });
        setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: nextStatus } : t));
        message.info(nextStatus !== 0 ? t('cron.messages.enable') : t('cron.messages.disable'));
    } catch (error) {
        console.error('Toggle status failed:', error);
        message.error(t('cron.messages.opFailed'));
    }
  };
  
  const handlePauseResume = async () => {
    if (!selectedTaskId) return;
    const nextStatus = paused ? 1 : 2;
    try {
        await CronService.updateOneStatus({ id: parseInt(selectedTaskId), status: nextStatus });
        setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: nextStatus } : t));
        message.info(nextStatus === 1 ? t('cron.messages.resumeSuccess') : t('cron.messages.pauseSuccess'));
    } catch (error) {
        console.error('Pause/Resume failed:', error);
        message.error(t('cron.messages.opFailed'));
    }
  };

  const handleKnowledgeChange = (id: string) => {
    form.setFieldsValue({ kbId: id });
  };

  const nextRun = useMemo(() => (enabled ? computeNextRunTime({ 
      mode: mode || 'custom', 
      cronName: '', 
      cronExpr: cronExpr || '', 
      time, 
      weekday, 
      dayOfMonth, 
      minuteOfHour, 
      secondOfMinute, 
      kbId: selectedKnowledge, 
      updateType: 'incremental' 
  }, paused) : null), [enabled, mode, cronExpr, time, weekday, dayOfMonth, minuteOfHour, secondOfMinute, paused, selectedKnowledge]);

  const handleDeleteTask = async (id: string) => {
    try {
        await CronService.delete({ id: parseInt(id) });
        setTasks(prev => prev.filter(t => t.id !== id));
        if (selectedTaskId === id) {
            setSelectedTaskId(undefined);
            form.resetFields();
        }
        message.success(t('cron.messages.deleteSuccess'));
    } catch (error) {
        console.error('Delete task failed:', error);
        message.error(t('cron.messages.deleteFailed'));
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
    knowledgeSelectorRef,
    mode,
    selectedKnowledge,
    enabled,
    paused,
    nextRun,
    handleStartCreate,
    isCreating,
    handleDeleteTask,
    handleSave,
    handleRunNow,
    handleEnableToggle,
    handlePauseResume,
    handleKnowledgeChange,
    setSelectedTaskId,
    handleSelectTask,
    refreshTasks: fetchTasks,
  };
};
