/**
 * @fileoverview 知识库选择组件
 * @description 用于选择知识库的下拉选择器组件
 * @author 开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Select, message } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '@/services/knowledgeBase';

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
  ({ value, onChange, placeholder, style, size = 'middle', disabled = false }, ref) => {
    const { t } = useTranslation();
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
          { id: 'none', name: t('common.none'), description: t('kb.noKbDescription') },
          ...(response.list || []).map((kb: KnowledgeBase) => ({
            id: kb.name,
            name: kb.name,
            description: kb.description
          }))
        ];
        
        setKnowledgeOptions(knowledgeOptions);
      } catch (error) {
        console.error('获取知识库列表失败:', error);
        message.error(t('kb.error.fetch'));
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

    const selectOptions = knowledgeOptions.map(opt => ({ value: opt.id, label: opt.name }));
    return (
      <Select
        value={selectedKnowledge}
        onChange={handleChange}
        placeholder={placeholder || t('kb.documents.selectKbPlaceholder')}
        style={{ minWidth: 100, ...style }}
        size={size}
        disabled={disabled}
        loading={loading}
        suffixIcon={<DatabaseOutlined />}
        showSearch
        getPopupContainer={() => document.body}
        popupMatchSelectWidth
        optionFilterProp="label"
        options={selectOptions}
      />
    );
  }
);

KnowledgeSelector.displayName = 'KnowledgeSelector';

export default KnowledgeSelector;