/**
 * @fileoverview 上传索引 Tab（原独立 Indexer 页整体迁移）
 * @description 双栏布局（≥900px）：左列纵向表单流（目标知识库 → 来源切换 →
 * 拖拽上传区/URL 输入 → 文件列表 → 开始索引），右列 340px 处理进度面板。
 *
 * 数据层原样保留（设计文档 6.1）：
 * - /gateway/v1/indexer 同步长任务，超时 INDEXER_REQUEST_TIMEOUT_MS = 15min
 * - 文件校验：类型白名单（MIME + 后缀兜底）+ 10MB 上限
 * - FormData 字段：file/url + knowledge_name
 *
 * 进度面板说明：接口为同步单请求，无法区分服务器内部阶段，
 * 故请求期间 1-4 步统一以"处理中"脉冲展示，成功后全部点亮（诚实展示，不伪造进度）。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  CloudUpload,
  Link2,
  Upload,
  FileText,
  X,
  Loader2,
  Check,
  CircleAlert,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusPill } from '@/components/common/StatusPill';
import ApiClient from '@/utils/axios/index';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '@/services/knowledgeBase';
import { cn } from '@/lib/utils';

/** /gateway/v1/indexer 为同步长任务（解析、切分、Embedding 等），需长于全局 axios 默认超时 */
const INDEXER_REQUEST_TIMEOUT_MS = 15 * 60 * 1000;

interface IndexResult {
  chunks: number;
  status: 'success' | 'error';
  fileName?: string;
}

type ProgressPhase = 'idle' | 'processing' | 'success' | 'error';

interface IndexerTabProps {
  /** 从详情页"上传文档"跳转带入的知识库名（?kb= 参数） */
  initialKb?: string;
}

const IndexerTab: React.FC<IndexerTabProps> = ({ initialKb }) => {
  const { t } = useTranslation();

  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>(initialKb ?? '');

  const [source, setSource] = useState<'file' | 'url'>('file');

  // 文件上传
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL 索引
  const [urlValue, setUrlValue] = useState('');

  // 提交与进度
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<ProgressPhase>('idle');
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  /** 获取知识库列表（仅启用状态） */
  const fetchKnowledgeList = useCallback(async () => {
    setKnowledgeLoading(true);
    try {
      const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
      const list = response.list || [];
      setKnowledgeList(list);
      // 详情页跳转指定的库不存在时回退到第一个
      if (initialKb && list.some((kb) => kb.name === initialKb)) {
        setSelectedKnowledge(initialKb);
      } else if (list.length > 0 && !initialKb) {
        setSelectedKnowledge(list[0].name);
      }
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      toast.error(t('kb.error.fetch'));
    } finally {
      setKnowledgeLoading(false);
    }
  }, [t, initialKb]);

  useEffect(() => {
    fetchKnowledgeList();
  }, [fetchKnowledgeList]);

  /** 文件校验（类型白名单 + 后缀兜底 + 10MB），通过则加入待传列表 */
  const acceptFile = (file: File): boolean => {
    const allowedTypes = [
      'text/markdown',
      'text/html',
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const lower = file.name.toLowerCase();
    const allowedByExt =
      lower.endsWith('.md') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.html') ||
      lower.endsWith('.pdf') ||
      lower.endsWith('.doc') ||
      lower.endsWith('.docx') ||
      lower.endsWith('.xlsx');

    if (!(allowedTypes.includes(file.type) || allowedByExt)) {
      toast.error(t('indexer.validation.fileType'));
      return false;
    }
    if (file.size / 1024 / 1024 >= 10) {
      toast.error(t('indexer.validation.fileSize'));
      return false;
    }
    return true;
  };

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(acceptFile);
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
      setPhase('idle');
      setIndexResult(null);
      setErrorMessage('');
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /** 统一提交入口：校验 → FormData → 长超时 POST */
  const startIndex = async () => {
    const isFile = source === 'file';

    if (isFile && files.length === 0) {
      toast.warning(t('indexer.validation.selectFile'));
      return;
    }
    if (!isFile) {
      const trimmed = urlValue.trim();
      if (!trimmed) {
        toast.warning(t('indexer.validation.enterUrl'));
        return;
      }
      try {
        const u = new URL(trimmed);
        if (!['http:', 'https:'].includes(u.protocol)) {
          toast.warning(t('indexer.validation.urlProtocol'));
          return;
        }
      } catch {
        toast.warning(t('indexer.validation.invalidUrl'));
        return;
      }
    }
    if (!selectedKnowledge) {
      toast.warning(t('indexer.validation.selectKb'));
      return;
    }

    const fileName = isFile ? files[0].name : urlValue.trim();

    setUploading(true);
    setPhase('processing');
    setIndexResult(null);
    setErrorMessage('');

    try {
      const formData = new FormData();
      if (isFile) {
        formData.append('file', files[0]);
      } else {
        formData.append('url', urlValue.trim());
      }
      formData.append('knowledge_name', selectedKnowledge);

      const result = await ApiClient.post('/gateway/v1/indexer', formData, {
        timeout: INDEXER_REQUEST_TIMEOUT_MS,
      });

      setPhase('success');
      setIndexResult({
        chunks: result.doc_ids?.length || 0,
        status: 'success',
        fileName,
      });
      toast.success(
        isFile ? t('indexer.validation.indexSuccess') : t('indexer.validation.urlSuccess'),
      );
      if (isFile) {
        setFiles([]);
      } else {
        setUrlValue('');
      }
    } catch (error) {
      console.error('Index error:', error);
      let msg = isFile
        ? t('indexer.validation.indexError')
        : t('indexer.validation.urlError');
      if (error && typeof error === 'object') {
        if ('message' in error) {
          msg = `${t('common.error')}: ${(error as { message?: string }).message}`;
        } else if ('code' in error) {
          msg = `${t('common.error')}: ${(error as { code?: string }).code}`;
        }
      }
      setPhase('error');
      setErrorMessage(msg);
      setIndexResult({ chunks: 0, status: 'error', fileName });
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    t('indexer.progress.upload'),
    t('indexer.progress.parse'),
    t('indexer.progress.split'),
    t('indexer.progress.embed'),
    t('indexer.progress.write'),
  ];

  /** 各步骤状态：upload 在请求发起即完成；其余取决于整体 phase */
  const getStepState = (index: number): 'pending' | 'active' | 'done' | 'failed' => {
    if (phase === 'idle') return 'pending';
    if (phase === 'success') return 'done';
    if (phase === 'error') return index === 0 ? 'done' : 'failed';
    // processing：上传已完成，其余处理中
    return index === 0 ? 'done' : 'active';
  };

  const noKb = knowledgeList.length === 0 && !knowledgeLoading;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ============ 左列：纵向表单流 ============ */}
      <div className="flex min-w-0 flex-col gap-5">
        {/* 目标知识库 */}
        <div className="flex flex-col gap-1.5">
          <Label>{t('indexer.selectKb')}</Label>
          <Select value={selectedKnowledge} onValueChange={setSelectedKnowledge}>
            <SelectTrigger className="w-full sm:w-72" disabled={knowledgeLoading || noKb}>
              <SelectValue
                placeholder={
                  knowledgeLoading ? t('common.loading') : t('indexer.selectKbPlaceholder')
                }
              />
            </SelectTrigger>
            <SelectContent>
              {knowledgeList.map((kb) => (
                <SelectItem key={kb.id} value={kb.name}>
                  {kb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {noKb && (
            <p className="text-xs leading-relaxed text-warning">{t('indexer.validation.noKb')}</p>
          )}
        </div>

        {/* 来源切换 */}
        <div className="flex flex-col gap-1.5">
          <Label>{t('indexer.sourceLabel')}</Label>
          <div className="flex w-fit gap-1 rounded-md border border-border-strong p-1">
            <button
              type="button"
              onClick={() => setSource('file')}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[13px] transition-colors',
                source === 'file'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-3 hover:text-text-1',
              )}
            >
              <CloudUpload className="size-4" />
              {t('indexer.fileUpload')}
            </button>
            <button
              type="button"
              onClick={() => setSource('url')}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[13px] transition-colors',
                source === 'url'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-3 hover:text-text-1',
              )}
            >
              <Link2 className="size-4" />
              {t('indexer.urlIndex')}
            </button>
          </div>
        </div>

        {/* 本地文件来源 */}
        {source === 'file' && (
          <div className="flex flex-col gap-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files.length > 0) {
                  addFiles(e.dataTransfer.files);
                }
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors',
                dragActive
                  ? 'border-primary bg-primary-bg/40'
                  : 'border-border-strong hover:border-primary/50 hover:bg-primary-bg/20',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.txt,.html,.pdf,.doc,.docx,.xlsx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    addFiles(e.target.files);
                  }
                  e.target.value = '';
                }}
              />
              <CloudUpload className="size-8 text-text-3" />
              <p className="text-[13px] text-text-2">
                {t('indexer.dragTip')}
                <em className="ml-1 cursor-pointer font-medium not-italic text-primary underline-offset-2 hover:underline">
                  {t('indexer.clickSelect')}
                </em>
              </p>
              <p className="text-[11.5px] text-text-4">{t('indexer.uploadHint')}</p>
            </div>

            {/* 文件列表 */}
            {files.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-text-body">
                      {file.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11.5px] text-text-4">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="shrink-0 cursor-pointer rounded-sm p-1 text-text-3 transition-colors hover:bg-hover hover:text-danger"
                      aria-label={`${t('common.delete')} ${file.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 网页链接来源 */}
        {source === 'url' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="indexer-url">{t('indexer.urlLabel')}</Label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-3" />
                <Input
                  id="indexer-url"
                  className="pl-9"
                  placeholder={t('indexer.urlPlaceholder')}
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !uploading) startIndex();
                  }}
                />
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-md border border-primary/25 bg-primary-bg/40 px-3 py-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-[12.5px] font-medium text-text-1">{t('indexer.urlTipTitle')}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-3">
                  {t('indexer.urlTipDesc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 开始索引按钮 */}
        <div>
          <Button
            onClick={startIndex}
            disabled={uploading || noKb || !selectedKnowledge}
            className="w-full sm:w-auto sm:min-w-36"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('indexer.indexing')}
              </>
            ) : (
              <>
                <Upload className="size-4" />
                {t('indexer.startIndex')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ============ 右列：处理进度面板（sticky 跟随滚动） ============ */}
      <aside className="lg:sticky lg:top-[76px] lg:self-start">
        <div className="flex flex-col gap-4 rounded-md border bg-card p-4">
          <h3 className="text-[13px] font-semibold text-text-1">{t('indexer.progress.title')}</h3>

          {/* 五步流程 */}
          <ol className="flex flex-col">
            {steps.map((label, i) => {
              const state = getStepState(i);
              return (
                <li key={label} className="flex items-center gap-3 py-1.5">
                  {/* 状态图标 */}
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                      state === 'pending' && 'border-border-strong text-text-4',
                      state === 'active' &&
                        'animate-pulse border-primary bg-primary-bg text-primary',
                      state === 'done' && 'border-success bg-success-bg text-success',
                      state === 'failed' && 'border-danger bg-danger-bg text-danger',
                    )}
                  >
                    {state === 'done' ? (
                      <Check className="size-3" />
                    ) : state === 'failed' ? (
                      <X className="size-3" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-[12.5px]',
                      state === 'pending' && 'text-text-3',
                      state === 'active' && 'font-medium text-text-1',
                      state === 'done' && 'text-text-2',
                      state === 'failed' && 'text-danger',
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* 状态说明 */}
          <div className="border-t pt-3">
            {phase === 'idle' && (
              <p className="flex items-center gap-2 text-xs text-text-3">
                <CircleAlert className="size-3.5 shrink-0" />
                {t('indexer.progress.idle')}
              </p>
            )}
            {phase === 'processing' && (
              <p className="flex items-center gap-2 text-xs text-text-2">
                <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                {t('indexer.progress.processing')}
              </p>
            )}
            {phase === 'success' && indexResult && (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-xs font-medium text-success">
                  <Check className="size-3.5 shrink-0" />
                  {t('indexer.progress.success')}
                </p>
                <div className="flex flex-col gap-1.5 rounded-md bg-hover/60 px-3 py-2.5 text-[12px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-3">{t('indexer.result.fileName')}</span>
                    <span className="max-w-[55%] truncate text-right text-text-1">
                      {indexResult.fileName || t('indexer.result.unknownFile')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-3">{t('indexer.result.chunks')}</span>
                    <span className="font-mono text-text-1">{indexResult.chunks}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-3">{t('indexer.result.kb')}</span>
                    <span className="max-w-[55%] truncate text-right text-text-1">
                      {selectedKnowledge || t('indexer.result.unknown')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-3">{t('indexer.result.status')}</span>
                    <StatusPill tone="success">{t('indexer.result.success')}</StatusPill>
                  </div>
                </div>
              </div>
            )}
            {phase === 'error' && (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-danger">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                {errorMessage || t('indexer.progress.failed')}
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default IndexerTab;
