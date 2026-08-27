/**
 * @fileoverview 文档表格（TanStack Table v9 + shadcn Table）
 * @description 迁移自旧版 DocumentTable（antd Table）。
 * 保留逻辑：服务端分页、行选择（批量删除）、状态胶囊、查看分块/删除操作。
 * 状态列按设计文档 3.4：待处理 neutral / 索引中 warning / 已完成 success / 失败 danger。
 */

import {
  useTable,
  tableFeatures,
  rowSelectionFeature,
  createColumnHelper,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { FileText, Trash2, LayoutGrid } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/common/StatusPill';
import { type DocumentData, DocumentStatus, DocumentsService } from '@/services/documents';

const features = tableFeatures({ rowSelectionFeature });
const columnHelper = createColumnHelper<typeof features, DocumentData>();

interface DocumentsTableProps {
  data: DocumentData[];
  loading: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  onViewChunks: (doc: DocumentData) => void;
  onDelete: (doc: DocumentData) => void;
}

/** 文档状态 → 胶囊色调 */
const statusTone = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.ACTIVE:
      return 'success' as const;
    case DocumentStatus.INDEXING:
      return 'warning' as const;
    case DocumentStatus.FAILED:
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
};

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  data,
  loading,
  rowSelection,
  onRowSelectionChange,
  onViewChunks,
  onDelete,
}) => {
  const { t } = useTranslation();

  // helper.columns() 用可变元组保留各列 TValue，避免混合数组类型 widen 报错
  const columns = columnHelper.columns([
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() ? 'indeterminate' : false)
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label={t('common.selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`${t('common.select')} ${row.original.fileName}`}
        />
      ),
    }),
    columnHelper.accessor('fileName', {
      header: () => t('kb.documents.fileName'),
      cell: ({ getValue }) => (
        <div className="flex min-w-0 items-center gap-2" title={getValue()}>
          <FileText className="size-4 shrink-0 text-primary" />
          <span className="truncate">{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      header: () => t('kb.documents.status'),
      cell: ({ getValue }) => (
        <StatusPill tone={statusTone(getValue())}>
          {t(DocumentsService.getStatusTextKey(getValue()))}
        </StatusPill>
      ),
    }),
    columnHelper.accessor('updatedAt', {
      header: () => t('common.updatedAt'),
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] whitespace-nowrap text-text-2">
          {new Date(getValue()).toLocaleString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary hover:text-primary-hover"
            onClick={() => onViewChunks(row.original)}
          >
            <LayoutGrid className="size-3.5" />
            {t('kb.documents.chunks')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-text-3 hover:text-danger"
            title={t('kb.documents.deleteDocument')}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ]);

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      onRowSelectionChange(
        typeof updater === 'function' ? updater(rowSelection) : updater,
      );
    },
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-hover/50 hover:bg-hover/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-9 text-[12px] font-medium text-text-2">
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <TableCell key={col.id} className="py-3">
                    <div className="h-4 w-full max-w-32 animate-pulse rounded-sm bg-hover" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="py-12 text-center text-[13px] text-text-3">
                {t('retriever.noResult')}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className="border-row-border"
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2.5 text-[13px]">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsTable;
