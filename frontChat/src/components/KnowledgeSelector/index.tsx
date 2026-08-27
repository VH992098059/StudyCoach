/**
 * @fileoverview 知识库选择组件（shadcn Select 版）
 * @description 保持旧版 antd Select 的 props/ref 接口不变，
 * 供 AI 聊天页与定时任务配置面板共用；未登录时仅「无」选项
 */

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Database } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  KnowledgeBaseService,
  type KnowledgeBase,
  KBStatus,
} from '@/services/knowledgeBase';

function hasAccessToken(): boolean {
  return !!localStorage.getItem('access_token');
}

interface KnowledgeSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  /** 兼容旧 antd 签名保留，shadcn 版不区分尺寸 */
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  className?: string;
  /** 透传给 SelectTrigger（如聊天输入行内嵌时去边框） */
  triggerClassName?: string;
}

export interface KnowledgeSelectorRef {
  getSelectedKnowledgeId: () => string;
  setSelectedKnowledge: (id: string) => void;
}

interface KbOption {
  id: string;
  name: string;
}

const KnowledgeSelector = forwardRef<KnowledgeSelectorRef, KnowledgeSelectorProps>(
  ({ value, onChange, placeholder, style, disabled = false, className, triggerClassName }, ref) => {
    const { t } = useTranslation();
    const [selectedKnowledge, setSelectedKnowledge] = useState<string>(value || 'none');
    const [knowledgeOptions, setKnowledgeOptions] = useState<KbOption[]>([
      { id: 'none', name: t('common.none') },
    ]);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useImperativeHandle(ref, () => ({
      getSelectedKnowledgeId: () => selectedKnowledge,
      setSelectedKnowledge: (id: string) => {
        setSelectedKnowledge(id);
        onChange?.(id);
      },
    }));

    const applyDefaultOptions = useCallback(() => {
      setKnowledgeOptions([{ id: 'none', name: t('common.none') }]);
    }, [t]);

    const fetchKnowledgeList = useCallback(async () => {
      if (!hasAccessToken()) {
        applyDefaultOptions();
        return;
      }
      try {
        const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
        setKnowledgeOptions([
          { id: 'none', name: t('common.none') },
          ...(response.list || []).map((kb: KnowledgeBase) => ({
            id: kb.name,
            name: kb.name,
          })),
        ]);
      } catch (error) {
        console.error('获取知识库列表失败:', error);
        toast.error(t('kb.error.fetch'));
      }
    }, [t, applyDefaultOptions]);

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <div className={className} style={style}>
        <Select
          value={selectedKnowledge}
          onValueChange={(v) => {
            setSelectedKnowledge(v);
            onChange?.(v);
          }}
          disabled={disabled}
        >
          <SelectTrigger className={cn('w-full', triggerClassName)} aria-label={t('kb.documents.selectKbPlaceholder')}>
            <span className="flex min-w-0 items-center gap-2">
              <Database className="size-3.5 shrink-0 text-text-2" />
              <SelectValue
                placeholder={placeholder || t('kb.documents.selectKbPlaceholder')}
                className="truncate"
              />
            </span>
          </SelectTrigger>
          <SelectContent>
            {knowledgeOptions.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  },
);

KnowledgeSelector.displayName = 'KnowledgeSelector';

export default KnowledgeSelector;
