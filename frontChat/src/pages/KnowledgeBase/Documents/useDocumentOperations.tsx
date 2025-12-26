import { useState } from 'react';
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { DocumentsService, type DocumentData } from '@/services/documents';
import React from 'react';

interface UseDocumentOperationsProps {
  fetchDocumentsList: () => void;
  selectedRows: DocumentData[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setSelectedRows: (rows: DocumentData[]) => void;
}

export const useDocumentOperations = ({
  fetchDocumentsList,
  selectedRows,
  setSelectedRowKeys,
  setSelectedRows,
}: UseDocumentOperationsProps) => {
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  const handleDeleteDocument = async (document: DocumentData) => {
    try {
      await DocumentsService.delete({ document_id: document.id });
      message.success(`文档 "${document.fileName}" 删除成功`);
      fetchDocumentsList();
    } catch (error) {
      message.error('删除文档失败');
      console.error('Delete document error:', error);
    }
  };

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

  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) return;

    setBatchDeleteLoading(true);
    try {
      const deletePromises = selectedRows.map((doc) =>
        DocumentsService.delete({ document_id: doc.id })
      );

      await Promise.all(deletePromises);
      message.success(`成功删除 ${selectedRows.length} 个文档`);
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

  return {
    batchDeleteLoading,
    confirmDelete,
    confirmBatchDelete,
  };
};
