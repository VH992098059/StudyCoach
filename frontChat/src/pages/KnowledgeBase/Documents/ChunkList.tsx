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
      message.error('获取知识块列表失败');
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
      message.success('知识块内容更新成功');
      setEditModalVisible(false);
      setEditingChunk(null);
      setEditContent('');
      await fetchChunksList();
    } catch (error) {
      message.error('更新知识块内容失败');
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
      message.success(`知识块已${newStatus === ChunkStatus.ACTIVE ? '启用' : '禁用'}`);
      await fetchChunksList();
    } catch (error) {
      message.error('更新知识块状态失败');
      console.error('Update chunk status error:', error);
    }
  };

  const handleDeleteChunk = async (chunk: KnowledgeChunk) => {
    try {
      await ChunksService.delete({ id: chunk.id });
      message.success(`知识块 "${chunk.chunkId}" 删除成功`);
      await fetchChunksList();
    } catch (error) {
      message.error('删除知识块失败');
      console.error('Delete chunk error:', error);
    }
  };

  const confirmDelete = (chunk: KnowledgeChunk) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除知识块 "${chunk.chunkId}" 吗？此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
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
      message.success(`成功删除 ${selectedRows.length} 个知识块`);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      await fetchChunksList();
    } catch (error) {
      message.error('批量删除失败');
      console.error('Batch delete error:', error);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const confirmBatchDelete = () => {
    if (selectedRows.length === 0) return;
    confirm({
      title: '批量删除确认',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除以下 {selectedRows.length} 个知识块吗？此操作不可恢复。</p>
        </div>
      ),
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: handleBatchDelete,
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="chunks-container">
      <Card bordered={false}>
        <div className="card-header">
          <Space>
            <SearchOutlined className="header-icon" />
            <span className="header-title">知识块列表</span>
          </Space>
        </div>

        {selectedRowKeys.length > 0 && (
          <Alert
            title={
              <Space>
                <span>已选择 {selectedRowKeys.length} 个知识块</span>
                <Button size="small" onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>
                  取消选择
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
                  批量删除
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
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
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
