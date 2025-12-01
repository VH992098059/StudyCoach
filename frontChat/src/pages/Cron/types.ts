import { Dayjs } from 'dayjs';

export type Mode = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type UpdateType = 'full' | 'incremental';

export interface CronConfig {
  mode: Mode;
  cronName: string;
  cronExpr?: string;
  kbId?: string;
  updateType: UpdateType;
  time?: Dayjs;
  weekday?: number;
  dayOfMonth?: number;
  minuteOfHour?: number;
  secondOfMinute?: number;
}

export interface LogEntry {
  id: number;
  time: number;
  status: 'success' | 'failed' | 'running';
  detail?: string;
  durationMs?: number;
}
