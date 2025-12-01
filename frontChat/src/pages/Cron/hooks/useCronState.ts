import { useState, useEffect, useRef, useMemo } from 'react';
import { Form, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { CronConfig, LogEntry } from '../types';
import type { CronTask } from '../components/TaskListCard';
import { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';

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

export const useCronState = () => {
  const [form] = Form.useForm<CronConfig>();
  
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

  // Initialize tasks from local storage
  useEffect(() => {
    const storedTasks = localStorage.getItem('cronTasks');
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks);
        // Migration or validation if needed
        const validatedTasks = parsedTasks.map((t: any) => ({
            ...t,
            cronName: t.cronName || t.name || `任务 ${t.id}`,
            knowledgeBaseId: t.knowledgeBaseId || t.kbId || 'none', // fallback
            cronExpression: t.cronExpression || t.cronExpr || '0 0 9 * * *',
            status: t.status !== undefined ? t.status : (t.enabled ? 1 : 0),
            contentType: t.contentType || (t.updateType === 'full' ? 1 : 2)
        }));
        setTasks(validatedTasks);
        if (validatedTasks.length > 0) {
          setSelectedTaskId(validatedTasks[0].id);
        }
      } catch {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
  }, []);

  // Save tasks to local storage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('cronTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Load selected task data into form
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
        const taskConfigStr = localStorage.getItem(`cronConfig_${selectedTaskId}`);
        if (taskConfigStr) {
            try {
                const cfg = JSON.parse(taskConfigStr);
                if (cfg.time) cfg.time = dayjs(cfg.time);
                form.setFieldsValue(cfg);
            } catch {}
        } else {
             // Fallback: initialize form from task fields if no separate config
             form.setFieldsValue({ 
                mode: 'custom', // Default to custom or try to parse cronExpression
                cronName: task.cronName || '', // Ensure cronName is always a string
                cronExpr: task.cronExpression,
                updateType: task.contentType === 1 ? 'full' : 'incremental', 
                kbId: task.knowledgeBaseId,
            });
        }
        // Load logs for this task
        const taskLogs = localStorage.getItem(`cronLogs_${selectedTaskId}`);
        setLogs(taskLogs ? JSON.parse(taskLogs) : []);
        
        setExecStatus(task.execStatus || 'idle');
        setLastRun(task.lastRunTime || null);
      }
    }
  }, [selectedTaskId, form]);

  // Generate cron expression when form fields change
  useEffect(() => {
    if (mode && mode !== 'custom') {
      let expr = '0 * * * * *';
      if (mode === 'hourly') {
        const m = typeof minuteOfHour === 'number' ? minuteOfHour : 0;
        const s = typeof secondOfMinute === 'number' ? secondOfMinute : 0;
        expr = `${s} ${m} * * * *`;
      } else if (mode === 'daily') {
        const t = time || dayjs('09:00:00', 'HH:mm:ss');
        expr = `${t.second()} ${t.minute()} ${t.hour()} * * *`;
      } else if (mode === 'weekly') {
        const t = time || dayjs('09:00:00', 'HH:mm:ss');
        const d = typeof weekday === 'number' ? weekday : 1;
        expr = `${t.second()} ${t.minute()} ${t.hour()} * * ${d}`;
      } else if (mode === 'monthly') {
        const t = time || dayjs('09:00:00', 'HH:mm:ss');
        const d = typeof dayOfMonth === 'number' ? dayOfMonth : 1;
        expr = `${t.second()} ${t.minute()} ${t.hour()} ${d} * *`;
      }
      form.setFieldsValue({ cronExpr: expr });
    }
  }, [mode, time, weekday, dayOfMonth, minuteOfHour, secondOfMinute, form]);

  const nextRun = useMemo(() => (enabled ? computeNextRunTime({ 
      mode, 
      cronName: '', // Not used for computation but required by type
      cronExpr, 
      time, 
      weekday, 
      dayOfMonth, 
      minuteOfHour, 
      secondOfMinute, 
      updateType: form.getFieldValue('updateType') 
  }, paused) : null), [enabled, mode, cronExpr, time, weekday, dayOfMonth, minuteOfHour, secondOfMinute, paused, form]);

  const createNewTask = () => {
    const newTask: CronTask = {
      id: Date.now().toString(),
      cronName: `任务 ${tasks.length + 1}`,
      knowledgeBaseId: 'none',
      cronExpression: '0 0 9 * * *',
      status: 0, // Stopped
      contentType: 2, // Incremental
      execStatus: 'idle'
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTaskId(newTask.id);
    message.success('已创建新任务');
  };

  const handleDeleteTask = (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(newTasks.length > 0 ? newTasks[0].id : undefined);
    }
    // Clean up local storage
    localStorage.removeItem(`cronConfig_${taskId}`);
    localStorage.removeItem(`cronLogs_${taskId}`);
    message.success('任务已删除');
    
    if (newTasks.length === 0) {
        setSelectedTaskId(undefined);
    }
  };

  const handleSave = async () => {
    if (!selectedTaskId) return;
    try {
      const values = await form.validateFields();
      const payload = { ...values, time: values.time ? (values.time as Dayjs).toISOString() : undefined };
      
      // Update local storage for config
      localStorage.setItem(`cronConfig_${selectedTaskId}`, JSON.stringify(payload));
      
      // Update task list
      setTasks(prev => prev.map(t => {
          if (t.id === selectedTaskId) {
              return {
                  ...t,
                  cronName: values.cronName,
                  knowledgeBaseId: values.kbId || 'none',
                  cronExpression: values.cronExpr || '',
                  contentType: values.updateType === 'full' ? 1 : 2,
              };
          }
          return t;
      }));
      
      message.success('已保存任务配置');
    } catch {}
  };

  const handleRunNow = async () => {
    if (!selectedTaskId) return;
    
    const id = Date.now();
    setExecStatus('running');
    
    const newLog: LogEntry = { id, time: Date.now(), status: 'running', detail: '任务开始执行...' };
    const newLogs = [newLog, ...logs];
    setLogs(newLogs);
    localStorage.setItem(`cronLogs_${selectedTaskId}`, JSON.stringify(newLogs));

    setTimeout(() => {
      const success = true; // Mock result
      const duration = Math.floor(1500 + Math.random() * 1500);
      const resultStatus: 'success' | 'failed' = success ? 'success' : 'failed';
      
      setExecStatus(resultStatus);
      setLastRun(Date.now());
      
      const updatedLogs = newLogs.map(l => (l.id === id ? { 
          ...l, 
          status: resultStatus, 
          detail: success ? '执行成功：已完成知识库更新' : '执行失败：请查看错误详情', 
          durationMs: duration 
      } : l));
      
      setLogs(updatedLogs);
      localStorage.setItem(`cronLogs_${selectedTaskId}`, JSON.stringify(updatedLogs));
      
      // Update task status in list
      setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, execStatus: resultStatus, lastRunTime: Date.now() } : t));

      if (success) message.success('任务执行成功'); else message.error('任务执行失败');
    }, 1800);

    if (!enabled) {
      // Update task enabled state
      setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: 1 } : t));
      message.info('已开启定时：将按配置自动调度');
    }
  };

  const handleEnableToggle = () => {
    if (!selectedTaskId) return;
    
    const nextStatus = enabled ? 0 : 1;
    setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: nextStatus } : t));
    message.info(nextStatus !== 0 ? '已开启定时' : '已关闭定时');
  };
  
  const handlePauseResume = () => {
    if (!selectedTaskId) return;
    const nextStatus = paused ? 1 : 2;
    setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: nextStatus } : t));
    message.info(nextStatus === 1 ? '已恢复任务调度' : '已暂停任务调度');
  };

  const handleKnowledgeChange = (id: string) => {
    form.setFieldsValue({ kbId: id });
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
    createNewTask,
    handleDeleteTask,
    handleSave,
    handleRunNow,
    handleEnableToggle,
    handlePauseResume,
    handleKnowledgeChange,
    setSelectedTaskId,
  };
};
