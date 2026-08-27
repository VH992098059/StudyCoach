/**
 * @fileoverview 知识库详情页 /knowledgebase/:id（新增页面）
 * @description 面包屑 + 知识库头部（名称/描述/元信息 + 上传文档/删除操作）
 * + 文档表格（服务端分页 + 批量删除）+ 分块面板（表格下方展开）。
 * 数据层复用 KnowledgeBaseService / DocumentsService（设计文档 6.1）。
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { RowSelectionState } from '@tanstack/react-table';
import {
  ChevronRight,
  FolderOpen,
  Upload,
  Trash2,
  Loader2,
  ChevronLeft,
  FileText,
} from 'lucide-react';

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
import { DocumentsService, type DocumentData } from '@/services/documents';
import DocumentsTable from './DocumentsTable';
import ChunksPanel from './ChunksPanel';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const KbDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 知识库信息
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [kbLoading, setKbLoading] = useState(true);
  const [kbDeleting, setKbDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 文档列表
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  // 分块面板
  const [chunksDoc, setChunksDoc] = useState<{ id: string; fileName: string } | null>(null);

  /** 加载知识库信息 */
  useEffect(() => {
    if (!id) return;
    setKbLoading(true);
    KnowledgeBaseService.getOne(id)
      .then(setKb)
      .catch((error) => {
        console.error('获取知识库信息失败:', error);
        toast.error(t('kb.error.fetch'));
      })
      .finally(() => setKbLoading(false));
  }, [id, t]);

  /** 加载文档列表（服务端分页） */
  const fetchDocuments = useCallback(async () => {
    if (!kb) return;
    setDocsLoading(true);
    try {
      const response = await DocumentsService.getList({
        knowledge_name: kb.name,
        page,
        size: pageSize,
      });
      setDocuments(response.data ?? []);
      setTotal(response.total);
      setRowSelection({});
    } catch (error) {
      console.error('获取文档列表失败:', error);
      toast.error(t('kb.documents.fetchFailed'));
      setDocuments([]);
      setTotal(0);
    } finally {
      setDocsLoading(false);
    }
  }, [kb, page, pageSize, t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /** 删除知识库 → 返回列表页 */
  const handleDeleteKb = async () => {
    if (!kb) return;
    setKbDeleting(true);
    try {
      await KnowledgeBaseService.delete(kb.id);
      toast.success(t('kb.success.delete'));
      navigate('/knowledgebase');
    } catch (error) {
      console.error('删除失败:', error);
      toast.error(t('kb.error.delete'));
      setKbDeleting(false);
    }
  };

  /** 单条删除文档 */
  const handleDeleteDoc = async (doc: DocumentData) => {
    try {
      await DocumentsService.delete({ document_id: doc.id });
      toast.success(t('kb.documents.deleteSuccess', { fileName: doc.fileName }));
      await fetchDocuments();
    } catch (error) {
      console.error('Delete document error:', error);
      toast.error(t('kb.documents.deleteFailed'));
    }
  };

  /** 批量删除文档（与旧版一致：逐条并发调用） */
  const handleBatchDelete = async () => {
    const selectedDocs = documents.filter((doc) => rowSelection[doc.id]);
    if (selectedDocs.length === 0) return;
    setBatchDeleting(true);
    try {
      await Promise.all(
        selectedDocs.map((doc) => DocumentsService.delete({ document_id: doc.id })),
      );
      toast.success(t('kb.documents.batchDeleteSuccess', { count: selectedDocs.length }));
      setBatchConfirmOpen(false);
      await fetchDocuments();
    } catch (error) {
      console.error('Batch delete error:', error);
      toast.error(t('kb.documents.batchDeleteFailed'));
    } finally {
      setBatchDeleting(false);
    }
  };

  const selectedCount = Object.keys(rowSelection).length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /** 上传文档 → 跳转上传索引 Tab 并预选当前知识库 */
  const goUpload = () => {
    if (!kb) return;
    navigate(`/knowledgebase?tab=indexer&kb=${encodeURIComponent(kb.name)}`);
  };

  if (kbLoading) {
    return (
      <div className="mx-auto w-full max-w-[960px] flex-1 px-5 py-6 md:px-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 rounded-md" />
        <Skeleton className="mt-4 h-64 rounded-md" />
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="mx-auto w-full max-w-[960px] flex-1 px-5 py-6 md:px-8">
        <EmptyState
          icon={<FolderOpen />}
          title={t('kb.error.fetch')}
          action={
            <Button size="sm" variant="outline" onClick={() => navigate('/knowledgebase')}>
              {t('common.back')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[960px] flex-1 px-5 py-6 md:px-8">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-[12.5px] text-text-3">
        <Link to="/knowledgebase" className="transition-colors hover:text-primary">
          {t('kb.tabs.list')}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="max-w-60 truncate font-medium text-text-1">{kb.name}</span>
      </nav>

      {/* 知识库头部 */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-md border bg-card p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-bg text-primary">
            <FolderOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-semibold text-text-1">{kb.name}</h1>
              <StatusPill tone={kb.status === KBStatus.OK ? 'success' : 'neutral'}>
                {kb.status === KBStatus.OK ? t('kb.enabled') : t('kb.disabled')}
              </StatusPill>
              <StatusPill tone="neutral">{kb.category || t('kb.noCategory')}</StatusPill>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-3">{kb.description}</p>
            <p className="mt-1.5 font-mono text-[11px] text-text-4">ID: {kb.id}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={goUpload}>
            <Upload className="size-4" />
            {t('kb.detail.uploadDoc')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-danger/40 text-danger hover:bg-danger-bg hover:text-danger"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
            {t('kb.delete')}
          </Button>
        </div>
      </div>

      {/* 文档区 */}
      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h2 className="text-[13.5px] font-semibold text-text-1">
              {t('kb.detail.docsTitle')}
            </h2>
            {selectedCount > 0 && (
              <>
                <span className="text-[12px] text-text-3">
                  {t('common.selectedItems', { count: selectedCount })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setRowSelection({})}
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
        </div>

        <DocumentsTable
          data={documents}
          loading={docsLoading}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onViewChunks={(doc) =>
            setChunksDoc((prev) =>
              prev?.id === doc.id ? null : { id: doc.id, fileName: doc.fileName },
            )
          }
          onDelete={handleDeleteDoc}
        />

        {/* 分块面板（表格下方展开） */}
        {chunksDoc && (
          <div className="mt-4">
            <ChunksPanel
              documentId={chunksDoc.id}
              documentName={chunksDoc.fileName}
              onClose={() => setChunksDoc(null)}
            />
          </div>
        )}

        {/* 分页 */}
        {total > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
                aria-label={t('common.page')}
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
      </div>

      {/* 删除知识库确认 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('kb.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('kb.deleteDesc')}（{kb.name}）
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={kbDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={kbDeleting}
              className="bg-danger text-white hover:bg-danger/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteKb();
              }}
            >
              {kbDeleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除文档确认 */}
      <AlertDialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.batchDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('kb.documents.batchDeleteConfirmText', { count: selectedCount })}
              <span className="mt-2 block max-h-44 overflow-y-auto text-[12.5px] leading-relaxed">
                {documents
                  .filter((doc) => rowSelection[doc.id])
                  .map((doc, i) => (
                    <span key={doc.id} className="block py-0.5">
                      {i + 1}. {doc.fileName}
                    </span>
                  ))}
              </span>
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

export default KbDetailPage;
