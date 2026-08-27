/**
 * 定时任务页类型定义
 * - Mode：五种调度模式（每小时/每天/每周/每月/自定义）
 * - CronFormValues：配置表单值（RHF）；time 为 'HH:mm:ss' 字符串
 * - CronTask：任务实体（后端字段 + 表单快照 config）
 * - LogEntry：执行记录（status/duration/errorMessage 取自 cron_execute 真实字段）
 */

export type Mode = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type UpdateType = 'full' | 'incremental';
/** 0=执行中，1=成功，2=失败 */
export type ExecStatusNum = 0 | 1 | 2;

export interface CronFormValues {
  cronName: string;
  kbId: string;
  updateType: UpdateType;
  mode: Mode;
  time: string;
  weekday: number;
  dayOfMonth: number;
  minuteOfHour: number;
  secondOfMinute: number;
  cronExpr: string;
}

export interface CronTask {
  id: string;
  cronName: string;
  knowledgeBasename: string;
  cronExpression: string;
  /** 0: 停止，1: 启用，2: 暂停 */
  status: 0 | 1 | 2;
  /** 1: 全量更新，2: 增量更新 */
  contentType: 1 | 2;
  /** 表单快照，用于编辑回填 */
  config?: Partial<CronFormValues>;
}

export interface LogEntry {
  id: string;
  time: number;
  status: 'success' | 'failed' | 'running';
  detail?: string;
  durationMs?: number;
  /** 执行记录归属任务名（日志行 [任务名] 标签） */
  cronName?: string;
}
