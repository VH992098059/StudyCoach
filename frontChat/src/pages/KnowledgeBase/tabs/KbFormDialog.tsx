/**
 * @fileoverview 知识库新建/编辑表单 Dialog（react-hook-form + zod）
 * @description 迁移自旧版 antd Modal 表单，校验规则保持一致
 * （名称 3-20 / 描述 3-200 / 分类 3-10 可选；编辑时含状态切换）
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  KnowledgeBaseService,
  KBStatus,
  type KnowledgeBase,
} from '@/services/knowledgeBase';

const kbSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'kb.validation.nameRequired')
    .max(20, 'kb.validation.nameLength'),
  description: z
    .string()
    .trim()
    .min(3, 'kb.validation.descRequired')
    .max(200, 'kb.validation.descLength'),
  category: z
    .string()
    .trim()
    .refine((v) => v === '' || (v.length >= 3 && v.length <= 10), 'kb.validation.categoryLength'),
  status: z.nativeEnum(KBStatus),
});

type KbFormValues = z.infer<typeof kbSchema>;

interface KbFormDialogProps {
  open: boolean;
  isEdit: boolean;
  record: KnowledgeBase | null;
  onClose: () => void;
  onSuccess: () => void;
}

const KbFormDialog: React.FC<KbFormDialogProps> = ({
  open,
  isEdit,
  record,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<KbFormValues>({
    resolver: zodResolver(kbSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      status: KBStatus.OK,
    },
  });

  // 打开时回填（编辑）或重置（新建）
  useEffect(() => {
    if (open) {
      reset({
        name: record?.name ?? '',
        description: record?.description ?? '',
        category: record?.category ?? '',
        status: record?.status ?? KBStatus.OK,
      });
    }
  }, [open, record, reset]);

  const onSubmit = async (values: KbFormValues) => {
    try {
      if (isEdit && record) {
        await KnowledgeBaseService.update({
          id: record.id,
          name: values.name,
          description: values.description,
          // 空分类默认"无分类"（保持旧版行为）
          category: values.category || t('kb.noCategory'),
          status: values.status,
        });
        toast.success(t('kb.success.update'));
      } else {
        await KnowledgeBaseService.create({
          name: values.name,
          description: values.description,
          category: values.category || t('kb.noCategory'),
        });
        toast.success(t('kb.success.create'));
      }
      onClose();
      onSuccess();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error(t('kb.error.operate'));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('kb.edit') : t('kb.create')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-name">{t('kb.name')}</Label>
            <Input
              id="kb-name"
              placeholder={t('kb.placeholder.name')}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-danger">{t(errors.name.message ?? '')}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-desc">{t('kb.description')}</Label>
            <Textarea
              id="kb-desc"
              rows={3}
              placeholder={t('kb.placeholder.desc')}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-danger">{t(errors.description.message ?? '')}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kb-category">{t('kb.category')}</Label>
            <Input
              id="kb-category"
              placeholder={t('kb.placeholder.category')}
              {...register('category')}
            />
            {errors.category && (
              <p className="text-xs text-danger">{t(errors.category.message ?? '')}</p>
            )}
          </div>

          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('kb.status')}</Label>
              <RadioGroup
                value={String(watch('status'))}
                onValueChange={(v) => setValue('status', Number(v) as KBStatus)}
                className="flex gap-4"
              >
                <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-text-body">
                  <RadioGroupItem value={String(KBStatus.OK)} />
                  {t('kb.enabled')}
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-text-body">
                  <RadioGroupItem value={String(KBStatus.DISABLED)} />
                  {t('kb.disabled')}
                </label>
              </RadioGroup>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default KbFormDialog;
