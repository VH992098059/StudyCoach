/**
 * @fileoverview 知识库选择组件
 * @description 用于选择知识库的下拉选择器组件
 * @author 开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { Select, message } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '@/services/knowledgeBase';

function hasAccessToken(): boolean {
  return !!localStorage.getItem('access_token');
}

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
    /** 未登录时仅「无」；登录后再拉列表，避免未授权请求弹错 */
    const [knowledgeOptions, setKnowledgeOptions] = useState<Array<{ id: string; name: string; description?: string }>>(() => [
      { id: 'none', name: t('common.none'), description: t('kb.noKbDescription') },
    ]);
    const [loading, setLoading] = useState(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      getSelectedKnowledgeId: () => selectedKnowledge,
      setSelectedKnowledge: (id: string) => {
        setSelectedKnowledge(id);
        onChange?.(id);
      }
    }));

    const applyDefaultOptions = useCallback(() => {
      setKnowledgeOptions([
        { id: 'none', name: t('common.none'), description: t('kb.noKbDescription') },
      ]);
    }, [t]);

    /**
     * 获取知识库列表（需已登录；首页未登录时不请求接口）
     */
    const fetchKnowledgeList = useCallback(async () => {
      if (!hasAccessToken()) {
        applyDefaultOptions();
        return;
      }
      setLoading(true);
      try {
        const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
        const opts = [
          { id: 'none', name: t('common.none'), description: t('kb.noKbDescription') },
          ...(response.list || []).map((kb: KnowledgeBase) => ({
            id: kb.name,
            name: kb.name,
            description: kb.description,
          })),
        ];
        setKnowledgeOptions(opts);
      } catch (error) {
        console.error('获取知识库列表失败:', error);
        message.error(t('kb.error.fetch'));
      } finally {
        setLoading(false);
      }
    }, [t, applyDefaultOptions]);

    /**
     * 处理知识库选择变化
     */
    const handleChange = (value: string) => {
      setSelectedKnowledge(value);
      onChange?.(value);
    };

    // 已登录时拉取知识库；未登录仅保留默认「无」
    useEffect(() => {
      void fetchKnowledgeList();

      const onStorage = (e: StorageEvent) => {
        if (e.key !== 'access_token') return;
        if (e.newValue) {
          void fetchKnowledgeList();
        } else {
          applyDefaultOptions();
          setSelectedKnowledge('none');
          onChangeRef.current?.('none');
        }
      };

      const onLogout = () => {
        applyDefaultOptions();
        setSelectedKnowledge('none');
        onChangeRef.current?.('none');
      };

      window.addEventListener('storage', onStorage);
      window.addEventListener('auth:logout', onLogout);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('auth:logout', onLogout);
      };
    }, [fetchKnowledgeList, applyDefaultOptions]);

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