/**
 * @fileoverview 知识库 Tab（卡片网格 + CRUD）
 * @description 迁移自旧版 antd Table 列表；卡片化展示，
 * 点击卡片进入 /knowledgebase/:id 详情页（设计文档 4.2）
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FolderOpen, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { EmptyState } from '@/components/common/EmptyState';
import { StatusPill } from '@/components/common/StatusPill';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '@/services/knowledgeBase';
import KbFormDialog from './KbFormDialog';

const KbListTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [list, setList] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);

  // 表单 Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<KnowledgeBase | null>(null);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await KnowledgeBaseService.getList();
      setList(response.list || []);
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      toast.error(t('kb.error.fetch'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const showCreate = () => {
    setIsEdit(false);
    setEditingRecord(null);
    setFormOpen(true);
  };

  const showEdit = (record: KnowledgeBase) => {
    setIsEdit(true);
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await KnowledgeBaseService.delete(deleteTarget.id);
      toast.success(t('kb.success.delete'));
      setDeleteTarget(null);
      await fetchList();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error(t('kb.error.delete'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* 卡片网格 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-md" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<FolderOpen />}
          title={t('kb.empty')}
          action={
            <Button size="sm" onClick={showCreate}>
              <Plus className="size-4" />
              {t('kb.create')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((kb) => (
            <div
              key={kb.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/knowledgebase/${kb.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/knowledgebase/${kb.id}`);
              }}
              className="group flex min-h-[132px] cursor-pointer flex-col rounded-md border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary-bg/30 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 truncate text-[14px] font-semibold text-text-1">
                  {kb.name}
                </h3>
                <StatusPill tone={kb.status === KBStatus.OK ? 'success' : 'neutral'}>
                  {kb.status === KBStatus.OK ? t('kb.enabled') : t('kb.disabled')}
                </StatusPill>
              </div>

              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-3">
                {kb.description}
              </p>

              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="truncate text-[11.5px] text-text-4">
                  {kb.category || t('kb.noCategory')}
                </span>
                <div
                  className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    title={t('common.edit')}
                    onClick={() => showEdit(kb)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-text-3 hover:text-danger"
                    title={t('common.delete')}
                    onClick={() => setDeleteTarget(kb)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* 虚线新建卡 */}
          <button
            type="button"
            onClick={showCreate}
            className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong text-text-3 transition-colors hover:border-primary/50 hover:bg-primary-bg/30 hover:text-primary"
          >
            <Plus className="size-5" />
            <span className="text-[13px] font-medium">{t('kb.card.newCard')}</span>
            <span className="text-[11px]">{t('kb.card.newCardDesc')}</span>
          </button>
        </div>
      )}

      {/* 新建/编辑 Dialog */}
      <KbFormDialog
        open={formOpen}
        isEdit={isEdit}
        record={editingRecord}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchList}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('kb.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('kb.deleteDesc')}
              {deleteTarget ? `（${deleteTarget.name}）` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-danger text-white hover:bg-danger/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KbListTab;
