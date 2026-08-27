/**
 * 定时任务页（设计文档 4.4）
 * 宽屏（≥1100px）双栏：左列 = 任务列表 + 运行日志同列上下排布（日志紧贴列表，
 * 填满列内空间）；右列 400px = 任务配置。窄屏纵向堆叠：任务列表 → 任务配置 →
 * 运行日志（配置紧跟列表便于编辑）。
 * WS onCronComplete → 刷新列表 + toast；删除走确认 AlertDialog；错误详情走 Dialog。
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormProvider } from 'react-hook-form';
import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHead } from '@/components/common/PageHead';
import { EmptyState } from '@/components/common/EmptyState';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';

import { useCronState } from './hooks/useCronState';
import TaskRow from './components/TaskRow';
import ConfigPanel from './components/ConfigPanel';
import RunLogsCard from './components/RunLogsCard';
import { Clock } from 'lucide-react';

const CronPage: React.FC = () => {
  const { t } = useTranslation();
  const [deleteTargetId, setDeleteTargetId] = useState<string | undefined>();

  const {
    form,
    tasks,
    selectedTaskId,
    execStatus,
    lastRun,
    logs,
    detail,
    setDetail,
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
    refreshTasks,
    applyCronRunFinished,
  } = useCronState();

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  const handleCronComplete = useCallback(
    (payload: { cron_id: string; cron_name: string; success: boolean }) => {
      applyCronRunFinished(payload.cron_id, payload.success);
      void refreshTasks();
      if (payload.success) {
        toast.success(`${t('cron.messages.execSuccess')}: ${payload.cron_name}`);
      } else {
        toast.error(`${t('cron.messages.execFailed')}: ${payload.cron_name}`);
      }
    },
    [applyCronRunFinished, refreshTasks, t],
  );

  useWebSocket({
    enabled: true,
    onCronComplete: handleCronComplete,
    maxReconnectAttempts: 5,
  });

  const showConfig = isCreating || !!selectedTaskId;

  return (
    <div className="mx-auto w-full max-w-[1080px] flex-1 px-5 py-6 md:px-8">
      <PageHead
        title={t('cron.pageTitle')}
        description={t('cron.pageDesc')}
        actions={
          <Button variant="outline" size="sm" onClick={() => void refreshTasks()}>
            <RefreshCw className="size-3.5" />
            {t('cron.actions.refresh')}
          </Button>
        }
      />

      {/* 双栏：左列（任务列表 + 运行日志）/ 右列（任务配置）；窄屏堆叠 tasks → config → logs */}
      <div className="mt-5 min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,1fr)_400px] min-[1100px]:items-start min-[1100px]:gap-x-6">
        {/* 任务列表 */}
        <section className="min-w-0">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-text-2">{t('cron.taskList')}</div>
            <Button size="sm" onClick={handleStartCreate}>
              <Plus className="size-3.5" />
              {t('cron.newTask')}
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-surface">
              <EmptyState
                icon={<Clock className="size-9" />}
                title={t('cron.messages.empty')}
                action={
                  <Button size="sm" variant="outline" onClick={handleStartCreate}>
                    <Plus className="size-3.5" />
                    {t('cron.newTask')}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  selected={selectedTaskId === task.id}
                  onToggleStatus={handleToggleStatus}
                  onSelect={handleSelectTask}
                  onEdit={handleSelectTask}
                  onDelete={setDeleteTargetId}
                />
              ))}
            </div>
          )}
        </section>

        {/* 任务配置：宽屏右列（占两行），窄屏紧跟任务列表 */}
        <section className="mt-5 min-w-0 min-[1100px]:col-start-2 min-[1100px]:row-start-1 min-[1100px]:mt-0">
          {showConfig ? (
            <FormProvider {...form}>
              <ConfigPanel
                isCreating={isCreating}
                taskName={selectedTask?.cronName}
                enabled={enabled}
                paused={paused}
                status={execStatus}
                lastRun={lastRun}
                nextRun={nextRun}
                onSave={() => void handleSave()}
                onRunNow={() => void handleRunNow()}
                onEnableToggle={() => void handleToggleStatus()}
                onPauseResume={() => void handlePauseResume()}
              />
            </FormProvider>
          ) : (
            <div className="rounded-lg border border-dashed border-border-strong bg-surface">
              <EmptyState
                icon={<Clock className="size-9" />}
                title={t('cron.messages.noSelection')}
                description={t('cron.messages.noSelectionDesc')}
              />
            </div>
          )}
        </section>

        {/* 运行日志：宽屏左列下方（第二行），窄屏最后 */}
        <section className="mt-5 min-w-0 min-[1100px]:col-start-1 min-[1100px]:row-start-2">
          <div className="mb-2.5 text-[13px] font-semibold text-text-2">
            {t('cron.logs.title')}
          </div>
          {showConfig && !isCreating ? (
            <RunLogsCard
              logs={logs}
              onShowDetail={(content) => setDetail({ open: true, content })}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border-strong bg-surface">
              <EmptyState
                title={t('cron.logs.empty')}
                className="px-4 py-6"
              />
            </div>
          )}
        </section>
      </div>

      {/* 删除确认 */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cron.messages.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cron.messages.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTargetId) void handleDeleteTask(deleteTargetId);
                setDeleteTargetId(undefined);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 错误详情 / 执行记录 */}
      <Dialog open={detail.open} onOpenChange={(open) => !open && setDetail({ open: false })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('cron.logs.details')}</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[50vh] overflow-auto rounded-md bg-hover p-3 font-mono text-xs whitespace-pre-wrap text-text-2">
            {detail.content || t('cron.logs.noDetails')}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail({ open: false })}>
              {t('cron.actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CronPage;
