import React from 'react';
import { Card, Form, Input, Select, Radio, TimePicker, Button, Space, Tag, Tooltip } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';
import { useBreakpoints } from '@/hooks/useMediaQuery';

type Mode = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

const KB_OPTIONS = [
  { label: '默认知识库', value: 'default' },
  { label: '技术文档库', value: 'docs' },
  { label: '产品知识库', value: 'product' },
];

const WEEK_OPTIONS = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
];

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

const statusBadge = (status?: 'idle' | 'running' | 'success' | 'failed') => {
  switch (status) {
    case 'running':
      return <Tag color="processing">进行中</Tag>;
    case 'success':
      return <Tag color="success">成功</Tag>;
    case 'failed':
      return <Tag color="error">失败</Tag>;
    default:
      return <Tag color="default">空闲</Tag>;
  }
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  form, mode, enabled, paused, onSave, onRunNow, onEnableToggle, onPauseResume, 
  isTablet, selectedKnowledge, knowledgeSelectorRef, onKnowledgeChange,
  status = 'idle', lastRun, nextRun
}) => {
  const { isMobile } = useBreakpoints();
  
  return (
    <Card 
      title="任务配置与状态" 
      className="section-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, overflowY: 'auto' }}
      extra={
        <Space>
          {statusBadge(status)}
          {!enabled && <Tag>未启用</Tag>}
          {paused && <Tag color="orange">已暂停</Tag>}
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ mode: 'daily', updateType: 'incremental', minuteOfHour: 0, secondOfMinute: 0 }}>
        <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 24 }}>
           <Space size={isMobile ? 12 : 24} wrap align={isMobile ? 'start' : 'center'} direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
             <Form.Item name="cronName" rules={[{ required: true, message: '请输入任务名称' }, { max: 20, message: '任务名称不能超过20个字符' }]} noStyle>
               <Input placeholder="请输入任务名称" style={{ width: isMobile ? '100%' : 200 }} maxLength={20} />
             </Form.Item>
             <div>
               <span className="status-label">最近执行: </span>
               <span className="status-value">{lastRun ? dayjs(lastRun).format('YYYY-MM-DD HH:mm:ss') : '—'}</span>
             </div>
             <div>
               <span className="status-label">下次执行: </span>
               <span className="status-value">{nextRun ? dayjs(nextRun).format('YYYY-MM-DD HH:mm:ss') : (!enabled ? '未启用' : (mode === 'custom' ? '基于自定义表达式暂不计算' : (paused ? '已暂停' : '—')))}</span>
             </div>
           </Space>
        </Space>

        <Space 
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ width: '100%', display: 'flex' }} 
          align={isMobile ? undefined : 'start'} 
          size={isMobile ? 0 : 24}
        >
          <Form.Item label="知识库" name="kbId" rules={[{ required: true }]} style={{ flex: 1 }}> 
            <KnowledgeSelector
              ref={knowledgeSelectorRef}
              value={selectedKnowledge}
              onChange={onKnowledgeChange}
              style={{ width: isMobile ? '100%' : 200 }}
              size={isTablet ? 'small' : 'middle'}
            />
          </Form.Item>

          <Form.Item label="更新内容类型" name="updateType" rules={[{ required: true }]} style={{ flex: 1 }}> 
            <Radio.Group>
              <Radio value="full">全量更新</Radio>
              <Radio value="incremental">增量更新</Radio>
            </Radio.Group>
          </Form.Item>
        </Space>

        <Form.Item label="调度方式" name="mode" rules={[{ required: true }]}> 
          {isMobile ? (
             <Select options={[
               { label: '每小时', value: 'hourly' },
               { label: '每日', value: 'daily' },
               { label: '每周', value: 'weekly' },
               { label: '每月', value: 'monthly' },
               { label: '自定义表达式', value: 'custom' },
             ]} />
          ) : (
            <Radio.Group>
              <Radio.Button value="hourly">每小时</Radio.Button>
              <Radio.Button value="daily">每日</Radio.Button>
              <Radio.Button value="weekly">每周</Radio.Button>
              <Radio.Button value="monthly">每月</Radio.Button>
              <Radio.Button value="custom">自定义表达式</Radio.Button>
            </Radio.Group>
          )}
        </Form.Item>

        {mode === 'hourly' && (
          <>
            <Form.Item label="分钟" name="minuteOfHour" rules={[{ required: true }]}> 
              <Select style={{ width: '100%' }} options={Array.from({ length: 60 }, (_, i) => ({ label: `${i} 分`, value: i }))} />
            </Form.Item>
            <Form.Item label="秒" name="secondOfMinute" rules={[{ required: true }]}> 
              <Select style={{ width: '100%' }} options={Array.from({ length: 60 }, (_, i) => ({ label: `${i} 秒`, value: i }))} />
            </Form.Item>
          </>
        )}

        {(mode === 'daily' || mode === 'weekly' || mode === 'monthly') && (
          <Form.Item label="时间" name="time" rules={[{ required: true }]}> 
            <TimePicker format="HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
        )}

        {mode === 'weekly' && (
          <Form.Item label="周几" name="weekday" rules={[{ required: true }]}> 
            <Select style={{ width: '100%' }} options={WEEK_OPTIONS} />
          </Form.Item>
        )}

        {mode === 'monthly' && (
          <Form.Item label="日期" name="dayOfMonth" rules={[{ required: true, type: 'number', min: 1, max: 31 }]}> 
            <Select style={{ width: '100%' }} options={Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1} 日`, value: i + 1 }))} />
          </Form.Item>
        )}

        <Form.Item label={
          <Space>
            <span>cron 表达式</span>
            <Tooltip 
              title={
                <div style={{ maxWidth: 320 }}>
                  <div>采用 6 段：秒 分 时 日 月 周</div>
                  <div>示例：</div>
                  <div>• 每周一 09:00:00：0 0 9 * * 1</div>
                  <div>• 每日 09:00:00：0 0 9 * * *</div>
                  <div>• 每小时第 5 分第 10 秒：10 5 * * * *</div>
                  <div>可视化选择自动生成；自定义模式可手动输入。</div>
                </div>
              }
            >
              <Tag color="blue">帮助</Tag>
            </Tooltip>
          </Space>
        } name="cronExpr" rules={[{ required: true }]} extra="字段顺序：秒 分 时 日 月 周；秒/分(0-59)、时(0-23)、日(1-31)、月(1-12)、周(0-6，0代表周日)"> 
          <Input placeholder="示例（6段）：0 0 9 * * 1" disabled={mode !== 'custom'} />
        </Form.Item>

        <Space size={12} className="actions" wrap>
          <Button type="primary" onClick={onSave}>保存配置</Button>
          <Button onClick={onRunNow}>立即执行</Button>
          <Button onClick={onEnableToggle}>{enabled ? '关闭定时' : '开启定时'}</Button>
          <Button onClick={onPauseResume} disabled={!enabled}>{paused ? '恢复定时' : '暂停定时'}</Button>
        </Space>
      </Form>
    </Card>
  );
};

export default ConfigPanel;

