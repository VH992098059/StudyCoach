/**
 * @fileoverview 分块面板（文档表格下方展开）
 * @description 迁移自旧版 ChunkList/ChunkTable（antd Table + Drawer），
 * 改为文档表格下方内嵌展开面板（设计文档 4.3）。
 * 逻辑保留：分页、启停切换、删除/批量删除、内容编辑（Dialog）。
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ChunksService, type KnowledgeChunk, ChunkStatus } from '@/services/chunks';
import ChunkEditDialog from './ChunkEditDialog';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface ChunksPanelProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

const ChunksPanel: React.FC<ChunksPanelProps> = ({ documentId, documentName, onClose }) => {
  const { t } = useTranslation();

  const [list, setList] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  // 删除确认（单条）
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeChunk | null>(null);
  // 批量删除确认
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  // 编辑
  const [editingChunk, setEditingChunk] = useState<KnowledgeChunk | null>(null);

  const fetchList = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const response = await ChunksService.getList({
        knowledge_doc_id: documentId,
        page,
        size: pageSize,
      });
      setList(response.data ?? []);
      setTotal(response.total);
    } catch (error) {
      console.error('Fetch chunks error:', error);
      toast.error(t('kb.chunks.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [documentId, page, pageSize, t]);

  // 切换文档时重置分页与选择
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [documentId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allSelected = list.length > 0 && list.every((chunk) => selectedIds.has(chunk.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (list.every((chunk) => prev.has(chunk.id))) {
        return new Set();
      }
      return new Set(list.map((chunk) => chunk.id));
    });
  };

  /** 启停切换（保留旧版语义：ACTIVE ↔ DISABLED） */
  const handleToggleStatus = async (chunk: KnowledgeChunk) => {
    try {
      const newStatus =
        chunk.status === ChunkStatus.ACTIVE ? ChunkStatus.DISABLED : ChunkStatus.ACTIVE;
      await ChunksService.updateStatus({ ids: [chunk.id], status: newStatus });
      const statusText = newStatus === ChunkStatus.ACTIVE ? t('kb.enabled') : t('kb.disabled');
      toast.success(t('kb.chunks.statusChanged', { chunkId: chunk.chunkId, status: statusText }));
      await fetchList();
    } catch (error) {
      console.error('Update chunk status error:', error);
      toast.error(t('kb.chunks.statusChangeFailed'));
    }
  };

  /** 单条删除 */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await ChunksService.delete({ id: deleteTarget.id });
      toast.success(t('kb.chunks.deleteSuccess', { id: deleteTarget.chunkId }));
      setDeleteTarget(null);
      await fetchList();
    } catch (error) {
      console.error('Delete chunk error:', error);
      toast.error(t('kb.chunks.deleteFailed'));
    }
  };

  /** 批量删除（与旧版一致：逐条并发调用） */
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchDeleting(true);
    try {
      const rows = list.filter((chunk) => selectedIds.has(chunk.id));
      await Promise.all(rows.map((chunk) => ChunksService.delete({ id: chunk.id })));
      toast.success(t('common.success'));
      setSelectedIds(new Set());
      setBatchConfirmOpen(false);
      await fetchList();
    } catch (error) {
      console.error('Batch delete error:', error);
      toast.error(t('kb.chunks.deleteFailed'));
    } finally {
      setBatchDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-md border border-primary/30 bg-primary-bg/20">
      {/* 面板头 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[13px] font-semibold text-text-1">
            {t('kb.chunks.listTitle', { name: documentName })}
          </span>
          {selectedIds.size > 0 && (
            <>
              <span className="text-[12px] text-text-3">
                {t('common.selectedItems', { count: selectedIds.size })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setSelectedIds(new Set())}
              >
                {t('common.deselect')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 border-danger/40 px-2 text-xs text-danger hover:bg-danger-bg hover:text-danger"
                disabled={batchDeleting}
                onClick={() => setBatchConfirmOpen(true)}
              >
                {batchDeleting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
                {t('common.batchDelete')}
              </Button>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} title={t('common.cancel')}>
          <X className="size-4" />
        </Button>
      </div>

      {/* 分块列表 */}
      <div className="flex flex-col">
        {/* 全选行 */}
        {!loading && list.length > 0 && (
          <div className="flex items-center gap-2 border-b border-row-border px-4 py-2">
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} id="chunks-select-all" />
            <label htmlFor="chunks-select-all" className="cursor-pointer text-[12px] text-text-3">
              {t('common.selectAll')}
            </label>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title={t('kb.chunks.list')} description={t('retriever.noResult')} />
        ) : (
          list.map((chunk) => (
            <div
              key={chunk.id}
              className="flex items-start gap-3 border-b border-row-border px-4 py-3 last:border-b-0 hover:bg-hover/40"
            >
              <Checkbox
                className="mt-1"
                checked={selectedIds.has(chunk.id)}
                onCheckedChange={() => toggleSelect(chunk.id)}
                aria-label={`${t('common.select')} ${chunk.chunkId}`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11.5px] text-text-3">{chunk.chunkId}</span>
                  <StatusPill tone={chunk.status === ChunkStatus.ACTIVE ? 'success' : 'neutral'}>
                    {chunk.status === ChunkStatus.ACTIVE ? t('kb.enabled') : t('kb.disabled')}
                  </StatusPill>
                </div>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed whitespace-pre-wrap text-text-body">
                  {chunk.content}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={chunk.status === ChunkStatus.ACTIVE}
                  onCheckedChange={() => handleToggleStatus(chunk)}
                  aria-label={t('kb.status')}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  title={t('kb.chunks.editContent')}
                  onClick={() => setEditingChunk(chunk)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-text-3 hover:text-danger"
                  title={t('common.delete')}
                  onClick={() => setDeleteTarget(chunk)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          )))}
      </div>

      {/* 分页 */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
          <span className="text-[12px] text-text-3">
            {t('common.pagination', {
              current: (page - 1) * pageSize + 1,
              end: Math.min(page * pageSize, total),
              total,
            })}
          </span>
          <div className="flex items-center gap-1.5">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 cursor-pointer rounded-sm border border-border-strong bg-transparent px-1.5 text-[12px] text-text-2 focus:border-primary focus:outline-none"
              aria-label={t('common.pagination', { current: 1, end: 1, total })}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / {t('common.page')}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label={t('common.prevPage')}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="px-1 font-mono text-[12px] text-text-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label={t('common.nextPage')}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 编辑 Dialog */}
      <ChunkEditDialog
        chunk={editingChunk}
        onClose={() => setEditingChunk(null)}
        onSaved={fetchList}
      />

      {/* 单条删除确认 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('kb.chunks.deleteConfirm', { id: deleteTarget?.chunkId ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认 */}
      <AlertDialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.batchDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('kb.chunks.batchDeleteConfirmText', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={batchDeleting}
              className="bg-danger text-white hover:bg-danger/90"
              onClick={(e) => {
                e.preventDefault();
                handleBatchDelete();
              }}
            >
              {batchDeleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChunksPanel;
