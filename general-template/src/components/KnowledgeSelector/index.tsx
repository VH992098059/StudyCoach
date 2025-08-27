/**
 * @fileoverview 知识库选择组件
 * @description 用于选择知识库的下拉选择器组件
 * @author 开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Select, message } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '../../services/knowledgeBase';

const { Option } = Select;

/**
 * 组件属性接口
 */
interface KnowledgeSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
}

/**
 * 组件引用接口
 */
export interface KnowledgeSelectorRef {
  getSelectedKnowledgeId: () => string;
  setSelectedKnowledge: (id: string) => void;
}

/**
 * 知识库选择组件
 */
const KnowledgeSelector = forwardRef<KnowledgeSelectorRef, KnowledgeSelectorProps>(
  ({ value, onChange, placeholder = '选择知识库', style, size = 'middle', disabled = false }, ref) => {
    const [selectedKnowledge, setSelectedKnowledge] = useState<string>(value || 'none');
    const [knowledgeOptions, setKnowledgeOptions] = useState<Array<{id: string; name: string; description?: string}>>([]);
    const [loading, setLoading] = useState(false);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      getSelectedKnowledgeId: () => selectedKnowledge,
      setSelectedKnowledge: (id: string) => {
        setSelectedKnowledge(id);
        onChange?.(id);
      }
    }));

    /**
     * 获取知识库列表
     */
    const fetchKnowledgeList = async () => {
      setLoading(true);
      try {
        const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
        const knowledgeOptions = [
          { id: 'none', name: '无', description: '不使用知识库' },
          ...(response.list || []).map((kb: KnowledgeBase) => ({
            id: kb.name,
            name: kb.name,
            description: kb.description
          }))
        ];
        
        setKnowledgeOptions(knowledgeOptions);
      } catch (error) {
        console.error('获取知识库列表失败:', error);
        message.error('获取知识库列表失败');
      } finally {
        setLoading(false);
      }
    };

    /**
     * 处理知识库选择变化
     */
    const handleChange = (value: string) => {
      setSelectedKnowledge(value);
      onChange?.(value);
    };

    // 组件挂载时获取知识库列表
    useEffect(() => {
      fetchKnowledgeList();
    }, []);

    // 同步外部 value 变化
    useEffect(() => {
      if (value !== undefined && value !== selectedKnowledge) {
        setSelectedKnowledge(value);
      }
    }, [value]);

    return (
      <Select
        value={selectedKnowledge}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ minWidth: 150, ...style }}
        size={size}
        disabled={disabled}
        loading={loading}
        suffixIcon={<DatabaseOutlined />}
        showSearch
        filterOption={(input, option) =>
          (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
        }
      >
        {knowledgeOptions.map(option => (
          <Option key={option.id} value={option.id} title={option.description}>
            {option.name}
          </Option>
        ))}
      </Select>
    );
  }
);

KnowledgeSelector.displayName = 'KnowledgeSelector';

export default KnowledgeSelector;