import React, { useState, useEffect } from 'react';
import {
  Card,
  Space,
  Button,
  message,
  Pagination,
  Alert,
  Modal,
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ChunksService, type KnowledgeChunk, ChunkStatus } from '@/services/chunks';
import ChunkTable from './ChunkTable';
import ChunkEditModal from './ChunkEditModal';

const { confirm } = Modal;

interface ChunkListProps {
  documentId: number;
  documentName?: string;
  knowledgeBaseName?: string;
}

const ChunkList: React.FC<ChunkListProps> = ({ documentId }) => {
  const { t } = useTranslation();
  const [chunksList, setChunksList] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Edit State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingChunk, setEditingChunk] = useState<KnowledgeChunk | null>(null);
  const [editContent, setEditContent] = useState('');

  // Selection State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<KnowledgeChunk[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  const fetchChunksList = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const response = await ChunksService.getList({
        knowledge_doc_id: documentId,
        page: currentPage,
        size: pageSize,
      });
      setChunksList(response.data);
      setTotal(response.total);
    } catch (error) {
      message.error(t('kb.chunks.fetchFailed'));
      console.error('Fetch chunks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChunksList();
  }, [documentId, currentPage, pageSize]);

  const handleEditChunk = (chunk: KnowledgeChunk) => {
    setEditingChunk(chunk);
    setEditContent(chunk.content);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingChunk) return;
    try {
      await ChunksService.updateContent({
        id: editingChunk.id,
        content: editContent,
      });
      message.success(t('kb.chunks.updateSuccess'));
      setEditModalVisible(false);
      setEditingChunk(null);
      setEditContent('');
      await fetchChunksList();
    } catch (error) {
      message.error(t('kb.chunks.updateFailed'));
      console.error('Update chunk content error:', error);
    }
  };

  const handleToggleStatus = async (chunk: KnowledgeChunk) => {
    try {
      const newStatus = chunk.status === ChunkStatus.ACTIVE ? ChunkStatus.DISABLED : ChunkStatus.ACTIVE;
      await ChunksService.updateStatus({
        ids: [chunk.id],
        status: newStatus,
      });
      const statusText = newStatus === ChunkStatus.ACTIVE ? t('kb.enabled') : t('kb.disabled');
      message.success(t('kb.chunks.statusChanged', { status: statusText }));
      await fetchChunksList();
    } catch (error) {
      message.error(t('kb.chunks.statusChangeFailed'));
      console.error('Update chunk status error:', error);
    }
  };

  const handleDeleteChunk = async (chunk: KnowledgeChunk) => {
    try {
      await ChunksService.delete({ id: chunk.id });
      message.success(t('kb.chunks.deleteSuccess', { id: chunk.chunkId }));
      await fetchChunksList();
    } catch (error) {
      message.error(t('kb.chunks.deleteFailed'));
      console.error('Delete chunk error:', error);
    }
  };

  const confirmDelete = (chunk: KnowledgeChunk) => {
    confirm({
      title: t('common.confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      content: t('kb.chunks.deleteConfirm', { id: chunk.chunkId }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => handleDeleteChunk(chunk),
    });
  };

  const handleBatchDelete = async () => {
    setBatchDeleteLoading(true);
    try {
      const deletePromises = selectedRows.map(chunk => 
        ChunksService.delete({ id: chunk.id })
      );
      await Promise.all(deletePromises);
      message.success(t('common.success'));
      setSelectedRowKeys([]);
      setSelectedRows([]);
      await fetchChunksList();
    } catch (error) {
      message.error(t('kb.chunks.deleteFailed'));
      console.error('Batch delete error:', error);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const confirmBatchDelete = () => {
    if (selectedRows.length === 0) return;
    confirm({
      title: t('common.batchDelete'),
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>{t('kb.chunks.batchDeleteConfirmText', { count: selectedRows.length })}</p>
        </div>
      ),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: handleBatchDelete,
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="chunks-container">
      <Card bordered={false}>
        <div className="card-header">
          <Space>
            <SearchOutlined className="header-icon" />
            <span className="header-title">{t('kb.chunks.list')}</span>
          </Space>
        </div>

        {selectedRowKeys.length > 0 && (
          <Alert
            title={
              <Space>
                <span>{t('common.selectedItems', { count: selectedRowKeys.length })}</span>
                <Button size="small" onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>
                  {t('common.deselect')}
                </Button>
                <Button
                  size="small"
                  color="danger"
                  variant="solid"
                  danger
                  icon={<DeleteOutlined />}
                  loading={batchDeleteLoading}
                  onClick={confirmBatchDelete}
                >
                  {t('common.batchDelete')}
                </Button>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <ChunkTable
          loading={loading}
          dataSource={chunksList}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys);
              setSelectedRows(rows);
            },
          }}
          onEdit={handleEditChunk}
          onDelete={confirmDelete}
          onToggleStatus={handleToggleStatus}
          formatDate={formatDate}
        />

        {total > 0 && (
          <div className="pagination-container">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => t('common.pagination', { current: range[0], end: range[1], total })}
              pageSizeOptions={['10', '20', '50', '100']}
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size) setPageSize(size);
                setSelectedRowKeys([]);
                setSelectedRows([]);
              }}
            />
          </div>
        )}
      </Card>

      <ChunkEditModal
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingChunk(null);
          setEditContent('');
        }}
        onSave={handleSaveEdit}
        chunk={editingChunk}
        content={editContent}
        onContentChange={setEditContent}
      />
    </div>
  );
};

export default ChunkList;
