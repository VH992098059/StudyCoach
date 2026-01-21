import React from 'react';
import { Table, Space, Tooltip, Tag, Button } from 'antd';
import { FileTextOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import { type DocumentData, DocumentStatus, DocumentsService } from '@/services/documents';
import { useTranslation } from 'react-i18next';

interface DocumentTableProps {
  loading: boolean;
  dataSource: DocumentData[];
  pagination: any;
  rowSelection: TableRowSelection<DocumentData>;
  onViewChunks: (document: DocumentData) => void;
  onDelete: (document: DocumentData) => void;
  formatDate: (date: string) => string;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  loading,
  dataSource,
  pagination,
  rowSelection,
  onViewChunks,
  onDelete,
  formatDate,
}) => {
  const { t } = useTranslation();

  const columns: ColumnsType<DocumentData> = [
    {
      title: t('kb.documents.fileName'),
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (fileName: string) => (
        <Tooltip title={fileName}>
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span>{fileName}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: t('kb.documents.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DocumentStatus) => (
        <Tag color={DocumentsService.getStatusType(status)}>
          {t(DocumentsService.getStatusTextKey(status))}
        </Tag>
      ),
    },
    {
      title: t('kb.documents.knowledgeBase'),
      dataIndex: 'knowledgeBaseName',
      key: 'knowledgeBaseName',
      width: 150,
      render: (name: string) => (
        <Tag color="blue">{name || '-'}</Tag>
      ),
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => formatDate(createdAt),
    },
    {
      title: t('common.updatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt: string) => formatDate(updatedAt),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title={t('kb.documents.viewChunks')}>
            <Button
              type="primary"
              size="small"
              icon={<AppstoreOutlined />}
              onClick={() => onViewChunks(record)}
            >
              {t('kb.documents.chunks')}
            </Button>
          </Tooltip>
          <Tooltip title={t('kb.documents.deleteDocument')}>
            <Button
              size="small"
              color="danger"
              variant="solid"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      loading={loading}
      dataSource={dataSource}
      columns={columns}
      rowKey="id"
      bordered
      size="small"
      pagination={pagination}
      rowSelection={rowSelection}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default DocumentTable;
