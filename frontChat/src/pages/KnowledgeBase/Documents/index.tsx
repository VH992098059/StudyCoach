/**
 * @fileoverview 知识文档管理页面
 * @description 用于管理知识库中的文档，包括查看、删除等操作
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Select, message, Empty, Drawer } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '@/services/knowledgeBase';
import { DocumentsService, type DocumentData } from '@/services/documents';
import './index.scss';
import ChunkList from './ChunkList';
import DocumentTable from './DocumentTable';
import { useDocumentOperations } from './useDocumentOperations';

const { Option } = Select;

interface DocumentsProps {
  knowledgeBaseName?: string;
}

const Documents: React.FC<DocumentsProps> = (props) => {
  const [documentsList, setDocumentsList] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>(props.knowledgeBaseName || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 知识库列表相关状态
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState<boolean>(false);

  // 多选相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<DocumentData[]>([]);

  // 知识块 Drawer 状态
  const [chunksDrawerVisible, setChunksDrawerVisible] = useState(false);
  const [selectedDocumentForChunks, setSelectedDocumentForChunks] = useState<{id: number, fileName: string} | null>(null);

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

  const { batchDeleteLoading, confirmDelete, confirmBatchDelete } = useDocumentOperations({
    fetchDocumentsList,
    selectedRows,
    setSelectedRowKeys,
    setSelectedRows,
  });

  const fetchKnowledgeList = async () => {
    if (props.knowledgeBaseName) return;

    setKnowledgeLoading(true);
    try {
      const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
      setKnowledgeList(response.list || []);
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

  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  useEffect(() => {
    if (props.knowledgeBaseName) {
      setSelectedKnowledge(props.knowledgeBaseName);
    }
  }, [props.knowledgeBaseName]);

  useEffect(() => {
    fetchDocumentsList();
  }, [selectedKnowledge, currentPage, pageSize]);

  const handleKnowledgeChange = (value: string) => {
    setSelectedKnowledge(value);
    setCurrentPage(1);
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const handleViewDocument = (document: DocumentData) => {
    setSelectedDocumentForChunks({ id: document.id, fileName: document.fileName });
    setChunksDrawerVisible(true);
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="documents-container">
      {!props.knowledgeBaseName && (
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
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用知识库" />
                    ) : null
                  }
                >
                  {knowledgeList.map(kb => (
                    <Option key={kb.id} value={kb.name}>{kb.name}</Option>
                  ))}
                </Select>
              </Space>
            </div>
          </div>
        </Card>
      )}

      {(selectedKnowledge || props.knowledgeBaseName) && (
        <Card style={{ marginTop: props.knowledgeBaseName ? 0 : '20px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Button 
                color="danger"
                variant="solid"
                danger
                icon={<DeleteOutlined />} 
                loading={batchDeleteLoading}
                onClick={confirmBatchDelete}
                disabled={selectedRows.length === 0}
              >
                批量删除
              </Button>
              <span style={{ marginLeft: 8 }}>
                {selectedRows.length > 0 ? `已选择 ${selectedRows.length} 项` : ''}
              </span>
            </Space>
          </div>
          
          <DocumentTable
            loading={loading}
            dataSource={documentsList}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number) => `共 ${total} 条`,
              onChange: handlePageChange,
            }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys, rows) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              },
              getCheckboxProps: (record) => ({
                name: record.fileName,
              }),
            }}
            onViewChunks={handleViewDocument}
            onDelete={confirmDelete}
            formatDate={formatDate}
          />
        </Card>
      )}

      <Drawer
        title={`知识块列表 - ${selectedDocumentForChunks?.fileName || ''}`}
        placement="right"
        width={900}
        onClose={() => setChunksDrawerVisible(false)}
        open={chunksDrawerVisible}
        destroyOnClose
      >
        {selectedDocumentForChunks && (
          <ChunkList 
            documentId={selectedDocumentForChunks.id} 
            documentName={selectedDocumentForChunks.fileName}
            knowledgeBaseName={selectedKnowledge}
          />
        )}
      </Drawer>
    </div>
  );
};

export default Documents;
