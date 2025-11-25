/**
 * @fileoverview 知识块管理页面
 * @description 用于管理知识库中的文档分块，包括查看、编辑、删除等操作
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Select,
  Modal,
  message,
  Pagination,
  Empty,
  Tooltip,
  Input,
  Switch,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import { ChunksService,type KnowledgeChunk, ChunkStatus } from '../../../services/chunks';
import { DocumentsService, type DocumentData } from '../../../services/documents';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '../../../services/knowledgeBase';
import './index.scss';

const { Option } = Select;
const { confirm } = Modal;
const { TextArea } = Input;

/**
 * 知识块管理页面组件
 */
const Chunks: React.FC = () => {
  const [chunksList, setChunksList] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingChunk, setEditingChunk] = useState<KnowledgeChunk | null>(null);
  const [editContent, setEditContent] = useState('');
  const [documentOptions, setDocumentOptions] = useState<Array<{id: number; fileName: string}>>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>('');

  // 多选删除相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<KnowledgeChunk[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  /**
   * 获取知识库列表
   */
  const fetchKnowledgeList = async () => {
    setKnowledgeLoading(true);
    try {
      const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
      setKnowledgeList(response.list || []);
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      message.error('获取知识库列表失败');
    } finally {
      setKnowledgeLoading(false);
    }
  };

  /**
   * 获取文档列表
   */
  const fetchDocumentsList = async () => {
    if (!selectedKnowledge) {
      setDocumentOptions([]);
      return;
    }

    setDocumentsLoading(true);
    try {
      const response = await DocumentsService.getList({ 
        knowledge_name: selectedKnowledge,
        page: 1, 
        size: 100
      });
      const options = (response.data || []).map((doc: DocumentData) => ({
        id: doc.id,
        fileName: doc.fileName
      }));
      setDocumentOptions(options);
    } catch (error) {
      console.error('获取文档列表失败:', error);
      message.error('获取文档列表失败');
    } finally {
      setDocumentsLoading(false);
    }
  };

  /**
   * 知识库变化处理
   */
  const handleKnowledgeChange = (value: string) => {
    setSelectedKnowledge(value);
    setSelectedDocument(undefined);
    setCurrentPage(1);
    // 清空选择状态
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  // 组件挂载时获取知识库列表
  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  // 知识库变化时获取文档列表
  useEffect(() => {
    fetchDocumentsList();
  }, [selectedKnowledge]);

  /**
   * 获取状态文本
   */
  const getStatusText = (status: ChunkStatus): string => {
    return status === ChunkStatus.ACTIVE ? '启用' : '禁用';
  };

  /**
   * 获取状态标签类型
   */
  const getStatusType = (status: ChunkStatus): 'success' | 'default' => {
    return status === ChunkStatus.ACTIVE ? 'success' : 'default';
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  /**
   * 获取文档名称
   */
  const getDocumentName = (id: number): string => {
    const document = documentOptions.find(d => d.id === id);
    return document?.fileName || '未知文档';
  };

  /**
   * 获取知识块列表
   */
  const fetchChunksList = async () => {
    if (!selectedDocument) {
      setChunksList([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    
    try {
      const response = await ChunksService.getList({
        knowledge_doc_id: selectedDocument,
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

  /**
   * 文档变化处理
   */
  const handleDocumentChange = (value: number) => {
    setSelectedDocument(value);
    setCurrentPage(1);
    // 清空选择状态
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  /**
   * 编辑知识块内容
   */
  const handleEditChunk = (chunk: KnowledgeChunk) => {
    setEditingChunk(chunk);
    setEditContent(chunk.content);
    setEditModalVisible(true);
  };

  /**
   * 保存编辑内容
   */
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
      
      // 重新获取列表
      await fetchChunksList();
      
    } catch (error) {
      message.error('更新知识块内容失败');
      console.error('Update chunk content error:', error);
    }
  };

  /**
   * 切换知识块状态
   */
  const handleToggleStatus = async (chunk: KnowledgeChunk) => {
    try {
      const newStatus = chunk.status === ChunkStatus.ACTIVE ? ChunkStatus.DISABLED : ChunkStatus.ACTIVE;
      
      await ChunksService.updateStatus({
        ids: [chunk.id],
        status: newStatus,
      });
      
      message.success(`知识块已${newStatus === ChunkStatus.ACTIVE ? '启用' : '禁用'}`);
      
      // 重新获取列表
      await fetchChunksList();
      
    } catch (error) {
      message.error('更新知识块状态失败');
      console.error('Update chunk status error:', error);
    }
  };

  /**
   * 删除知识块确认
   */
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

  /**
   * 删除知识块
   */
  const handleDeleteChunk = async (chunk: KnowledgeChunk) => {
    try {
      await ChunksService.delete({ id: chunk.id });
      
      message.success(`知识块 "${chunk.chunkId}" 删除成功`);
      
      // 重新获取列表
      await fetchChunksList();
      
    } catch (error) {
      message.error('删除知识块失败');
      console.error('Delete chunk error:', error);
    }
  };

  /**
   * 批量删除确认
   */
  const confirmBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要删除的知识块');
      return;
    }

    confirm({
      title: '批量删除确认',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除以下 {selectedRows.length} 个知识块吗？此操作不可恢复。</p>
          <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '10px' }}>
            {selectedRows.map((chunk, index) => (
              <div key={chunk.id} style={{ padding: '2px 0' }}>
                {index + 1}. {chunk.chunkId}
              </div>
            ))}
          </div>
        </div>
      ),
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      width: 500,
      onOk: handleBatchDelete,
    });
  };

  /**
   * 批量删除处理
   */
  const handleBatchDelete = async () => {
    setBatchDeleteLoading(true);
    try {
      // 并发删除所有选中的知识块
      const deletePromises = selectedRows.map(chunk => 
        ChunksService.delete({ id: chunk.id })
      );
      
      await Promise.all(deletePromises);
      
      message.success(`成功删除 ${selectedRows.length} 个知识块`);
      
      // 清空选择状态
      setSelectedRowKeys([]);
      setSelectedRows([]);
      
      // 重新获取列表
      await fetchChunksList();
      
    } catch (error) {
      message.error('批量删除失败');
      console.error('Batch delete error:', error);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  /**
   * 清空选择
   */
  const handleClearSelection = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  /**
   * 分页变化处理
   */
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
    // 分页时清空选择状态
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  /**
   * 行选择配置
   */
  const rowSelection: TableRowSelection<KnowledgeChunk> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys, newSelectedRows) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
    // onSelect: (record, selected, selectedRows) => {
    //   // 可以在这里添加单行选择的逻辑
    // },
    // onSelectAll: (selected, selectedRows, changeRows) => {
    //   // 可以在这里添加全选的逻辑
    // },
  };

  /**
   * 表格列配置
   */
  const columns: ColumnsType<KnowledgeChunk> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '块ID',
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
      title: '内容预览',
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
      title: '状态',
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
            onChange={() => handleToggleStatus(record)}
          />
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => formatDate(createdAt),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑内容">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditChunk(record)}
            />
          </Tooltip>
          <Tooltip title="删除知识块">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => confirmDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 组件挂载时和依赖变化时获取数据
  useEffect(() => {
    fetchChunksList();
  }, [selectedDocument, currentPage, pageSize]);

  return (
    <div className="chunks-container">
      <Card>
        <div className="card-header">
          <Space>
            <SearchOutlined className="header-icon" />
            <span className="header-title">知识块管理</span>
          </Space>
          <div className="header-actions">
            <Space>
              <span>选择知识库:</span>
              <Select
                value={selectedKnowledge}
                onChange={handleKnowledgeChange}
                style={{ width: 200 }}
                placeholder="请选择知识库"
                loading={knowledgeLoading}
                allowClear
              >
                {knowledgeList.map(kb => (
                  <Option key={kb.name} value={kb.name}>
                    {kb.name}
                  </Option>
                ))}
              </Select>
              <span>选择文档:</span>
              <Select
                value={selectedDocument}
                onChange={handleDocumentChange}
                style={{ width: 300 }}
                placeholder="请选择文档"
                loading={documentsLoading}
                disabled={!selectedKnowledge}
              >
                {documentOptions.map(option => (
                  <Option key={option.id} value={option.id}>
                    {option.fileName}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
        </div>

        {/* 批量操作工具栏 */}
        {selectedRowKeys.length > 0 && (
          <Alert
            message={
              <Space>
                <span>已选择 {selectedRowKeys.length} 个知识块</span>
                <Button size="small" onClick={handleClearSelection}>
                  取消选择
                </Button>
                <Button
                  type="primary"
                  danger
                  size="small"
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

        <Table
          columns={columns}
          dataSource={chunksList}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={false}
          locale={{
            emptyText: !selectedKnowledge ? (
              <Empty description="请先选择知识库" />
            ) : !selectedDocument ? (
              <Empty description="请先选择文档" />
            ) : (
              <Empty description="该文档暂无知识块" />
            )
          }}
          scroll={{ x: 1000 }}
        />

        {total > 0 && (
          <div className="pagination-container">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }
              pageSizeOptions={['10', '20', '50', '100']}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      {/* 编辑内容模态框 */}
      <Modal
        title="编辑知识块内容"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingChunk(null);
          setEditContent('');
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <strong>块ID:</strong> {editingChunk?.chunkId}
        </div>
        <TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="请输入知识块内容"
          rows={10}
          maxLength={5000}
          showCount
        />
      </Modal>
    </div>
  );
};

export default Chunks;