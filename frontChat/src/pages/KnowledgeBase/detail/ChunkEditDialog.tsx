/**
 * @fileoverview 分块内容编辑 Dialog
 * @description 迁移自旧版 ChunkEditModal（antd Modal），
 * 逻辑保持一致：maxLength 5000、显示字数、保存调用 chunks_content 接口
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChunksService, type KnowledgeChunk } from '@/services/chunks';

interface ChunkEditDialogProps {
  chunk: KnowledgeChunk | null;
  onClose: () => void;
  onSaved: () => void;
}

const ChunkEditDialog: React.FC<ChunkEditDialogProps> = ({ chunk, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(chunk?.content ?? '');
  }, [chunk]);

  const handleSave = async () => {
    if (!chunk) return;
    setSaving(true);
    try {
      await ChunksService.updateContent({ id: chunk.id, content });
      toast.success(t('kb.chunks.updateSuccess'));
      onClose();
      onSaved();
    } catch (error) {
      console.error('Update chunk content error:', error);
      toast.error(t('kb.chunks.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!chunk}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('kb.chunks.editContent')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-text-3">
            {t('kb.chunks.chunkId')}: <span className="font-mono">{chunk?.chunkId}</span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('kb.chunks.placeholder')}
            rows={10}
            maxLength={5000}
          />
          <div className="text-right font-mono text-[11.5px] text-text-4">
            {content.length} / 5000
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || content === chunk?.content}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChunkEditDialog;
