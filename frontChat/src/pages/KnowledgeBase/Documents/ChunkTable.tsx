import React from 'react';
import { Table, Space, Tooltip, Tag, Switch, Button } from 'antd';
import { FileTextOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import { useTranslation } from 'react-i18next';
import { type KnowledgeChunk, ChunkStatus } from '@/services/chunks';

interface ChunkTableProps {
  loading: boolean;
  dataSource: KnowledgeChunk[];
  rowSelection: TableRowSelection<KnowledgeChunk>;
  onEdit: (chunk: KnowledgeChunk) => void;
  onDelete: (chunk: KnowledgeChunk) => void;
  onToggleStatus: (chunk: KnowledgeChunk) => void;
  formatDate: (date: string) => string;
}

const ChunkTable: React.FC<ChunkTableProps> = ({
  loading,
  dataSource,
  rowSelection,
  onEdit,
  onDelete,
  onToggleStatus,
  formatDate,
}) => {
  const { t } = useTranslation();

  const getStatusText = (status: ChunkStatus): string => {
    return status === ChunkStatus.ACTIVE ? t('kb.enabled') : t('kb.disabled');
  };

  const getStatusType = (status: ChunkStatus): 'success' | 'default' => {
    return status === ChunkStatus.ACTIVE ? 'success' : 'default';
  };

  const columns: ColumnsType<KnowledgeChunk> = [
    {
      title: t('kb.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('kb.chunks.chunkId'),
      dataIndex: 'chunkId',
      key: 'chunkId',
      width: 120,
      render: (chunkId: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>{chunkId}</span>
        </Space>
      ),
    },
    {
      title: t('kb.chunks.contentPreview'),
      dataIndex: 'content',
      key: 'content',
      ellipsis: {
        showTitle: false,
      },
      render: (content: string) => (
        <Tooltip placement="topLeft" title={content}>
          {content.length > 100 ? `${content.substring(0, 100)}...` : content}
        </Tooltip>
      ),
    },
    {
      title: t('kb.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ChunkStatus, record) => (
        <Space>
          <Tag color={getStatusType(status)}>
            {getStatusText(status)}
          </Tag>
          <Switch
            size="small"
            checked={status === ChunkStatus.ACTIVE}
            onChange={() => onToggleStatus(record)}
          />
        </Space>
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
      title: t('common.actions'),
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title={t('kb.chunks.editContent')}>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <Button
              type="primary"
              danger
              size="small"
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
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1000 }}
      size="small"
      bordered
    />
  );
};

export default ChunkTable;
