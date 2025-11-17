import React, { useEffect, useMemo, useState } from 'react';
import { Form, Space, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import './index.scss';
import ConfigPanel from './components/ConfigPanel';
import StatusLogsCard from './components/StatusLogsCard';
import ErrorDetailModal from './components/ErrorDetailModal';

type Mode = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
type UpdateType = 'full' | 'incremental';

interface CronConfig {
  mode: Mode;
  cronExpr?: string;
  kbId?: string;
  updateType: UpdateType;
  time?: Dayjs; // HH:mm:ss for daily/weekly/monthly
  weekday?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  minuteOfHour?: number; // 0-59 for hourly
  secondOfMinute?: number; // 0-59 for hourly
}

interface LogEntry {
  id: number;
  time: number; // timestamp
  status: 'success' | 'failed' | 'running';
  detail?: string;
  durationMs?: number;
}

const KB_OPTIONS = [
  { label: '默认知识库', value: 'default' },
  { label: '技术文档库', value: 'docs' },
  { label: '产品知识库', value: 'product' },
];

const WEEK_OPTIONS = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
];

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
      // 暂不解析 cron 表达式，提示使用可视化选择以显示倒计时
      return null;
    }
    default:
      return null;
  }
}

// statusBadge 已迁移到子组件中

const CronPage: React.FC = () => {
  const [form] = Form.useForm<CronConfig>();
  const [paused, setPaused] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [detail, setDetail] = useState<{ open: boolean; content?: string }>({ open: false });

  const mode = Form.useWatch('mode', form);
  const cronExpr = Form.useWatch('cronExpr', form);
  const time = Form.useWatch('time', form);
  const weekday = Form.useWatch('weekday', form);
  const dayOfMonth = Form.useWatch('dayOfMonth', form);
  const minuteOfHour = Form.useWatch('minuteOfHour', form);
  const secondOfMinute = Form.useWatch('secondOfMinute', form);

  useEffect(() => {
    const raw = localStorage.getItem('cronConfig');
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        if (cfg.time) cfg.time = dayjs(cfg.time);
        form.setFieldsValue(cfg);
      } catch {}
    } else {
      form.setFieldsValue({ mode: 'daily', time: dayjs('09:00:00', 'HH:mm:ss'), updateType: 'incremental', kbId: 'default', minuteOfHour: 0, secondOfMinute: 0 });
    }
    const rawEnabled = localStorage.getItem('cronEnabled');
    setEnabled(rawEnabled === 'true');
  }, [form]);

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

  const nextRun = useMemo(() => (enabled ? computeNextRunTime({ mode, cronExpr, time, weekday, dayOfMonth, minuteOfHour, secondOfMinute, updateType: form.getFieldValue('updateType') }, paused) : null), [enabled, mode, cronExpr, time, weekday, dayOfMonth, minuteOfHour, secondOfMinute, paused, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, time: values.time ? (values.time as Dayjs).toISOString() : undefined };
      localStorage.setItem('cronConfig', JSON.stringify(payload));
      message.success('已保存任务配置');
    } catch {}
  };

  const handleRunNow = async () => {
    const id = Date.now();
    setStatus('running');
    setLogs(prev => [{ id, time: Date.now(), status: 'running', detail: '任务开始执行...' }, ...prev]);
    setTimeout(() => {
      const success = true; // 可替换为真实结果
      const duration = Math.floor(1500 + Math.random() * 1500);
      setStatus(success ? 'success' : 'failed');
      setLastRun(Date.now());
      setLogs(prev => prev.map(l => (l.id === id ? { ...l, status: success ? 'success' : 'failed', detail: success ? '执行成功：已完成知识库更新' : '执行失败：请查看错误详情', durationMs: duration } : l)));
      if (success) message.success('任务执行成功'); else message.error('任务执行失败');
    }, 1800);
    if (!enabled) {
      setEnabled(true);
      localStorage.setItem('cronEnabled', 'true');
      message.info('已开启定时：将按配置自动调度');
    }
  };

  const handlePauseResume = () => {
    setPaused(p => !p);
    message.info(paused ? '已恢复任务调度' : '已暂停任务调度');
  };

  const handleEnableToggle = () => {
    setEnabled(e => {
      const next = !e;
      localStorage.setItem('cronEnabled', String(next));
      message.info(next ? '已开启定时' : '已关闭定时');
      return next;
    });
  };

  return (
    <div className="cron-page">
      <Space direction="vertical" size={16} className="cron-stack">
        <div className="cron-grid">
          <ConfigPanel
            form={form}
            mode={mode}
            enabled={enabled}
            paused={paused}
            onSave={handleSave}
            onRunNow={handleRunNow}
            onEnableToggle={handleEnableToggle}
            onPauseResume={handlePauseResume}
          />

          <StatusLogsCard
            status={status}
            enabled={enabled}
            paused={paused}
            lastRun={lastRun}
            nextRun={nextRun}
            logs={logs}
            mode={mode}
            onShowDetail={(content?: string) => setDetail({ open: true, content })}
          />
        </div>

        <ErrorDetailModal
          open={detail.open}
          content={detail.content}
          onClose={() => setDetail({ open: false })}
        />
      </Space>
    </div>
  );
};

export default CronPage;