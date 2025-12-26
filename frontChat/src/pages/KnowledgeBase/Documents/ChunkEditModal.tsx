import React, { useEffect } from 'react';
import { Modal, Input } from 'antd';
import type { KnowledgeChunk } from '@/services/chunks';

const { TextArea } = Input;

interface ChunkEditModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: () => void;
  chunk: KnowledgeChunk | null;
  content: string;
  onContentChange: (content: string) => void;
}

const ChunkEditModal: React.FC<ChunkEditModalProps> = ({
  open,
  onCancel,
  onSave,
  chunk,
  content,
  onContentChange,
}) => {
  return (
    <Modal
      title="编辑知识块内容"
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      width={800}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <strong>块ID:</strong> {chunk?.chunkId}
      </div>
      <TextArea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="请输入知识块内容"
        rows={10}
        maxLength={5000}
        showCount
      />
    </Modal>
  );
};

export default ChunkEditModal;
