import React from 'react';
import { Card, Form, Input, Select, Radio, TimePicker, Button, Space, Tag, Tooltip } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';
import { useBreakpoints } from '@/hooks/useMediaQuery';

type Mode = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface ConfigPanelProps {
  form: FormInstance<any>;
  mode?: Mode;
  enabled: boolean;
  paused: boolean;
  onSave: () => void;
  onRunNow: () => void;
  onEnableToggle: () => void;
  onPauseResume: () => void;
  isTablet: boolean;
  selectedKnowledge: string;
  knowledgeSelectorRef: React.Ref<KnowledgeSelectorRef>;
  onKnowledgeChange: (id: string) => void;
  status?: 'idle' | 'running' | 'success' | 'failed';
  lastRun?: number | null;
  nextRun?: number | null;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  form, mode, enabled, paused, onSave, onRunNow, onEnableToggle, onPauseResume, 
  isTablet, selectedKnowledge, knowledgeSelectorRef, onKnowledgeChange,
  status = 'idle', lastRun, nextRun
}) => {
  const { isMobile } = useBreakpoints();
  const { t } = useTranslation();

  const WEEK_OPTIONS = [
    { label: t('cron.weekdays.sun'), value: 0 },
    { label: t('cron.weekdays.mon'), value: 1 },
    { label: t('cron.weekdays.tue'), value: 2 },
    { label: t('cron.weekdays.wed'), value: 3 },
    { label: t('cron.weekdays.thu'), value: 4 },
    { label: t('cron.weekdays.fri'), value: 5 },
    { label: t('cron.weekdays.sat'), value: 6 },
  ];
  
  const statusBadge = (status?: 'idle' | 'running' | 'success' | 'failed') => {
    switch (status) {
      case 'running':
        return <Tag color="processing">{t('cron.status.running')}</Tag>;
      case 'success':
        return <Tag color="success">{t('cron.status.success')}</Tag>;
      case 'failed':
        return <Tag color="error">{t('cron.status.failed')}</Tag>;
      default:
        return <Tag color="default">{t('cron.status.idle')}</Tag>;
    }
  };
  
  return (
    <Card 
      title={t('cron.config.title')} 
      className="section-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflowY: 'auto' } }}
      extra={
        <Space>
          {statusBadge(status)}
          {!enabled && <Tag>{t('cron.config.disabled')}</Tag>}
          {paused && <Tag color="orange">{t('cron.config.paused')}</Tag>}
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ mode: 'daily', updateType: 'incremental', minuteOfHour: 0, secondOfMinute: 0 }}>
        <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 24 }}>
           <Space size={isMobile ? 12 : 24} wrap align={isMobile ? 'start' : 'center'} direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
             <Form.Item name="cronName" rules={[{ required: true, message: t('cron.validation.nameRequired') }, { max: 20, message: t('cron.validation.nameMax') }]} noStyle>
               <Input placeholder={t('cron.validation.nameRequired')} style={{ width: isMobile ? '100%' : 200 }} maxLength={20} />
             </Form.Item>
             <div>
               <span className="status-label">{t('cron.config.lastRun')}: </span>
               <span className="status-value">{lastRun ? dayjs(lastRun).format('YYYY-MM-DD HH:mm:ss') : '—'}</span>
             </div>
             <div>
               <span className="status-label">{t('cron.config.nextRun')}: </span>
               <span className="status-value">{nextRun ? dayjs(nextRun).format('YYYY-MM-DD HH:mm:ss') : (!enabled ? t('cron.config.disabled') : (mode === 'custom' ? t('cron.config.skipCustom') : (paused ? t('cron.config.paused') : '—')))}</span>
             </div>
           </Space>
        </Space>

        <Space 
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ width: '100%', display: 'flex' }} 
          align={isMobile ? undefined : 'start'} 
          size={isMobile ? 0 : 24}
        >
          <Form.Item label={t('cron.config.kb')} name="kbId" rules={[{ required: true, message: t('cron.validation.kbRequired') }]} style={{ flex: 1 }}> 
            <KnowledgeSelector
              ref={knowledgeSelectorRef}
              value={selectedKnowledge}
              onChange={onKnowledgeChange}
              style={{ width: isMobile ? '100%' : 200 }}
              size={isTablet ? 'small' : 'middle'}
            />
          </Form.Item>

          <Form.Item label={t('cron.config.updateType')} name="updateType" rules={[{ required: true, message: t('cron.validation.typeRequired') }]} style={{ flex: 1 }}> 
            <Radio.Group>
              <Radio value="full">{t('cron.config.full')}</Radio>
              <Radio value="incremental">{t('cron.config.incremental')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Space>

        <Form.Item label={t('cron.config.mode')} name="mode" rules={[{ required: true, message: t('cron.validation.modeRequired') }]}> 
          {isMobile ? (
             <Select options={[
               { label: t('cron.config.modes.hourly'), value: 'hourly' },
               { label: t('cron.config.modes.daily'), value: 'daily' },
               { label: t('cron.config.modes.weekly'), value: 'weekly' },
               { label: t('cron.config.modes.monthly'), value: 'monthly' },
               { label: t('cron.config.modes.custom'), value: 'custom' },
             ]} />
          ) : (
            <Radio.Group>
              <Radio.Button value="hourly">{t('cron.config.modes.hourly')}</Radio.Button>
              <Radio.Button value="daily">{t('cron.config.modes.daily')}</Radio.Button>
              <Radio.Button value="weekly">{t('cron.config.modes.weekly')}</Radio.Button>
              <Radio.Button value="monthly">{t('cron.config.modes.monthly')}</Radio.Button>
              <Radio.Button value="custom">{t('cron.config.modes.custom')}</Radio.Button>
            </Radio.Group>
          )}
        </Form.Item>

        {mode === 'hourly' && (
          <>
            <Form.Item label={t('cron.config.minute')} name="minuteOfHour" rules={[{ required: true }]}> 
              <Select style={{ width: '100%' }} options={Array.from({ length: 60 }, (_, i) => ({ label: `${i} ${t('cron.config.minute')}`, value: i }))} />
            </Form.Item>
            <Form.Item label={t('cron.config.second')} name="secondOfMinute" rules={[{ required: true }]}> 
              <Select style={{ width: '100%' }} options={Array.from({ length: 60 }, (_, i) => ({ label: `${i} ${t('cron.config.second')}`, value: i }))} />
            </Form.Item>
          </>
        )}

        {(mode === 'daily' || mode === 'weekly' || mode === 'monthly') && (
          <Form.Item label={t('cron.config.time')} name="time" rules={[{ required: true, message: t('cron.validation.timeRequired') }]}> 
            <TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
        )}

        {mode === 'weekly' && (
          <Form.Item label={t('cron.config.weekday')} name="weekday" rules={[{ required: true }]}> 
            <Select style={{ width: '100%' }} options={WEEK_OPTIONS} />
          </Form.Item>
        )}

        {mode === 'monthly' && (
          <Form.Item label={t('cron.config.day')} name="dayOfMonth" rules={[{ required: true, type: 'number', min: 1, max: 31 }]}> 
            <Select style={{ width: '100%' }} options={Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1} ${t('cron.config.day')}`, value: i + 1 }))} />
          </Form.Item>
        )}

        <Form.Item label={
          <Space>
            <span>{t('cron.config.cronExpr')}</span>
            <Tooltip 
              title={
                <div style={{ maxWidth: 320 }}>
                  <div>{t('cron.help.desc')}</div>
                  <div>{t('cron.help.example')}</div>
                  <div>{t('cron.help.ex1')}</div>
                  <div>{t('cron.help.ex2')}</div>
                  <div>{t('cron.help.ex3')}</div>
                  <div>{t('cron.help.note')}</div>
                </div>
              }
            >
              <Tag color="blue">{t('cron.config.help')}</Tag>
            </Tooltip>
          </Space>
        } name="cronExpr" rules={[{ required: true, message: t('cron.validation.exprRequired') }]} extra={t('cron.help.order')}> 
          <Input placeholder={t('cron.help.ex1')} disabled={mode !== 'custom'} />
        </Form.Item>

        <Space size={12} className="actions" wrap>
          <Button type="primary" onClick={onSave}>{t('cron.actions.save')}</Button>
          <Button onClick={onRunNow}>{t('cron.actions.runNow')}</Button>
          <Button onClick={onEnableToggle}>{enabled ? t('cron.actions.disable') : t('cron.actions.enable')}</Button>
          <Button onClick={onPauseResume} disabled={!enabled}>{paused ? t('cron.actions.resume') : t('cron.actions.pause')}</Button>
        </Space>
      </Form>
    </Card>
  );
};

export default ConfigPanel;

