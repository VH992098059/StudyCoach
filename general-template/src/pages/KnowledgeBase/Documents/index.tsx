/**
 * @fileoverview 知识文档管理页面
 * @description 用于管理知识库中的文档，包括查看、删除等操作
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
  Alert,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '../../../services/knowledgeBase';
import { DocumentsService, type DocumentData, DocumentStatus } from '../../../services/documents';
import './index.scss';

const { Option } = Select;

/**
 * 知识文档管理页面组件
 */
const Documents: React.FC = () => {
  const [documentsList, setDocumentsList] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 知识库列表相关状态
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState<boolean>(false);

  // 多选相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<DocumentData[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  /**
   * 获取知识库列表
   */
  const fetchKnowledgeList = async () => {
    setKnowledgeLoading(true);
    try {
      const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
      setKnowledgeList(response.list || []);
      // 如果有知识库，自动选择第一个（因为移除了"全部知识库"选项）
      if (response.list && response.list.length > 0) {
        setSelectedKnowledge(response.list[0].name);
      } else {
        setSelectedKnowledge('');
      }
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      message.error('获取知识库列表失败');
    } finally {
      setKnowledgeLoading(false);
    }
  };

  // 页面加载时获取知识库列表
  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  /**
   * 获取知识库名称
   */
  const getKnowledgeBaseName = (id: string): string => {
    const knowledge = knowledgeList.find(k => k.name === id);
    return knowledge?.name || '未知知识库';
  };

  /**
   * 获取文档列表
   */
  const fetchDocumentsList = async () => {
    if (!selectedKnowledge) {
      setDocumentsList([]);
      setTotal(0);
      return;
    }

    try {
      setLoading(true);
      const response = await DocumentsService.getList({
        knowledge_name: selectedKnowledge,
        page: currentPage,
        size: pageSize
      });
      
      setDocumentsList(response.data);
      setTotal(response.total);
      
      // 清空选择状态
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error) {
      console.error('获取文档列表失败:', error);
      message.error('获取文档列表失败');
      setDocumentsList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 知识库变化处理
   */
  const handleKnowledgeChange = (value: string) => {
    setSelectedKnowledge(value);
    setCurrentPage(1);
    // 清空选择状态
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  /**
   * 查看文档详情
   */
  const handleViewDocument = (document: DocumentData) => {
    // TODO: 实现查看文档详情功能
    message.info(`查看文档: ${document.fileName}`);
  };

  /**
   * 确认删除文档
   */
  const confirmDelete = (document: DocumentData) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文档 "${document.fileName}" 吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => handleDeleteDocument(document),
    });
  };

  /**
   * 删除文档
   */
  const handleDeleteDocument = async (document: DocumentData) => {
    try {
      await DocumentsService.delete({ document_id: document.id });
      message.success(`文档 "${document.fileName}" 删除成功`);
      
      // 重新获取文档列表
      fetchDocumentsList();
    } catch (error) {
      message.error('删除文档失败');
      console.error('Delete document error:', error);
    }
  };

  /**
   * 批量删除确认
   */
  const confirmBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要删除的文档');
      return;
    }

    Modal.confirm({
      title: '批量删除确认',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除以下 {selectedRows.length} 个文档吗？此操作不可恢复。</p>
          <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '10px' }}>
            {selectedRows.map((doc, index) => (
              <div key={doc.id} style={{ padding: '2px 0' }}>
                {index + 1}. {doc.fileName}
              </div>
            ))}
          </div>
        </div>
      ),
      okText: '确定删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: handleBatchDelete,
    });
  };

  /**
   * 执行批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) return;

    setBatchDeleteLoading(true);
    try {
      // 并发删除所有选中的文档
      const deletePromises = selectedRows.map(doc => 
        DocumentsService.delete({ document_id: doc.id })
      );
      
      await Promise.all(deletePromises);
      
      message.success(`成功删除 ${selectedRows.length} 个文档`);
      
      // 清空选择状态并重新获取列表
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchDocumentsList();
    } catch (error) {
      message.error('批量删除失败，请重试');
      console.error('Batch delete error:', error);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  /**
   * 分页变化处理
   */
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
    // 清空选择状态
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  /**
   * 行选择配置
   */
  const rowSelection: TableRowSelection<DocumentData> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: DocumentData[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
    onSelectAll: (selected: boolean, selectedRows: DocumentData[], changeRows: DocumentData[]) => {
      // 可以在这里添加全选/取消全选的自定义逻辑
    },
    onSelect: (record: DocumentData, selected: boolean, selectedRows: DocumentData[]) => {
      // 可以在这里添加单行选择的自定义逻辑
    },
    getCheckboxProps: (record: DocumentData) => ({
      disabled: false, // 可以根据文档状态来禁用某些行的选择
      name: record.fileName,
    }),
  };

  /**
   * 表格列配置
   */
  const columns: ColumnsType<DocumentData> = [
    {
      title: '文件名',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DocumentStatus) => (
        <Tag color={DocumentsService.getStatusType(status)}>
          {DocumentsService.getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '知识库',
      dataIndex: 'knowledgeBaseName',
      key: 'knowledgeBaseName',
      width: 150,
      render: (name: string) => (
        <Tag color="blue">{name || '-'}</Tag>
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
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt: string) => formatDate(updatedAt),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDocument(record)}
            />
          </Tooltip>
          <Tooltip title="删除文档">
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

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDocumentsList();
  }, [selectedKnowledge, currentPage, pageSize]);

  return (
    <div className="documents-container">
      <Card>
        <div className="card-header">
          <Space>
            <SearchOutlined className="header-icon" />
            <span className="header-title">知识文档管理</span>
          </Space>
          <div className="header-actions">
            <Space>
              <span>选择知识库:</span>
              <Select
                value={selectedKnowledge}
                onChange={handleKnowledgeChange}
                style={{ width: 200 }}
                placeholder={knowledgeLoading ? "加载中..." : "请选择知识库"}
                loading={knowledgeLoading}
                disabled={knowledgeList.length === 0}
                allowClear
                notFoundContent={
                  knowledgeList.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span>
                          暂无可用知识库<br/>
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => {
                              message.info('请先到知识库管理页面创建知识库');
                              // 可以在这里添加路由跳转逻辑
                              // navigate('/knowledge-base');
                            }}
                          >
                            创建知识库
                          </Button>
                        </span>
                      }
                    />
                  ) : null
                }
              >
                {knowledgeList.map(kb => (
                  <Option key={kb.id} value={kb.name}>
                    {kb.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
        </div>

        {/* 批量操作工具栏 */}
        {selectedRowKeys.length > 0 && (
          <div style={{ 
            marginBottom: 16, 
            padding: '8px 16px', 
            background: '#f0f2f5', 
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </span>
            <Space>
              <Button 
                onClick={() => {
                  setSelectedRowKeys([]);
                  setSelectedRows([]);
                }}
              >
                取消选择
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                loading={batchDeleteLoading}
                onClick={confirmBatchDelete}
              >
                批量删除
              </Button>
            </Space>
          </div>
        )}

        {knowledgeList.length === 0 && !knowledgeLoading && (
          <Alert
            message="暂无可用知识库"
            description={
              <span>
                请先到知识库管理页面创建知识库，然后再查看文档。
                <Button 
                  type="link" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    message.info('请先到知识库管理页面创建知识库');
                    // 可以在这里添加路由跳转逻辑
                    // navigate('/knowledge-base');
                  }}
                >
                  前往创建
                </Button>
              </span>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={documentsList}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={false}
          locale={{
            emptyText: selectedKnowledge ? (
              <Empty description="该知识库暂无文档" />
            ) : (
              <Empty description="请先选择知识库" />
            )
          }}
          scroll={{ x: 800 }}
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
    </div>
  );
};

export default Documents;