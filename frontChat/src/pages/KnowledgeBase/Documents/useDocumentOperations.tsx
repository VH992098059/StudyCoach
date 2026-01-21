import { useState } from 'react';
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  const handleDeleteDocument = async (document: DocumentData) => {
    try {
      await DocumentsService.delete({ document_id: document.id });
      message.success(t('kb.documents.deleteSuccess', { fileName: document.fileName }));
      fetchDocumentsList();
    } catch (error) {
      message.error(t('kb.documents.deleteFailed'));
      console.error('Delete document error:', error);
    }
  };

  const confirmDelete = (document: DocumentData) => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: t('kb.documents.deleteConfirm', { fileName: document.fileName }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
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
      message.success(t('kb.documents.batchDeleteSuccess', { count: selectedRows.length }));
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchDocumentsList();
    } catch (error) {
      message.error(t('kb.documents.batchDeleteFailed'));
      console.error('Batch delete error:', error);
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const confirmBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning(t('kb.documents.selectFirst'));
      return;
    }

    Modal.confirm({
      title: t('common.batchDeleteConfirm'),
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>{t('kb.documents.batchDeleteConfirmText', { count: selectedRows.length })}</p>
          <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '10px' }}>
            {selectedRows.map((doc, index) => (
              <div key={doc.id} style={{ padding: '2px 0' }}>
                {index + 1}. {doc.fileName}
              </div>
            ))}
          </div>
        </div>
      ),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
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
