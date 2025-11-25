import React from 'react';
import { Card, Space, Badge, Statistic, Tag, Collapse, List, Button } from 'antd';
import dayjs from 'dayjs';

type Mode = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface LogEntry {
  id: number;
  time: number;
  status: 'success' | 'failed' | 'running';
  detail?: string;
  durationMs?: number;
}

interface StatusLogsCardProps {
  status: 'idle' | 'running' | 'success' | 'failed';
  enabled: boolean;
  paused: boolean;
  lastRun: number | null;
  nextRun: number | null;
  logs: LogEntry[];
  onShowDetail: (content?: string) => void;
  mode?: Mode;
}

const statusBadge = (status: 'idle' | 'running' | 'success' | 'failed') => {
  switch (status) {
    case 'running':
      return <Badge status="processing" text="进行中" />;
    case 'success':
      return <Badge status="success" text="成功" />;
    case 'failed':
      return <Badge status="error" text="失败" />;
    default:
      return <Badge status="default" text="空闲" />;
  }
};

const StatusLogsCard: React.FC<StatusLogsCardProps> = ({ status, enabled, paused, lastRun, nextRun, logs, onShowDetail, mode }) => {
  return (
    <Card title="任务状态与历史" className="section-card">
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space size={12} align="center" wrap>
          {statusBadge(status)}
          {!enabled && <Tag>未启用</Tag>}
          {paused && <Tag color="orange">已暂停</Tag>}
        </Space>
        <Space size={16} wrap>
          <div>
            <div className="status-label">最近执行</div>
            <div className="status-value">{lastRun ? dayjs(lastRun).format('YYYY-MM-DD HH:mm:ss') : '—'}</div>
          </div>
          <div>
            <div className="status-label">下次执行</div>
            <div className="status-value">{nextRun ? dayjs(nextRun).format('YYYY-MM-DD HH:mm:ss') : (!enabled ? '未启用' : (mode === 'custom' ? '基于自定义表达式暂不计算' : (paused ? '已暂停' : '—')))}</div>
          </div>
        </Space>
          {nextRun && enabled && !paused ? (
            <Statistic.Timer title="倒计时" value={nextRun} valueStyle={{ fontSize: 16 }} type="countdown" format="HH:mm:ss" />
          ) : (
            <Tag>无倒计时</Tag>
          )}
        <Collapse defaultActiveKey={["logs"]}>
          <Collapse.Panel header="执行日志" key="logs">
            <List
              itemLayout="horizontal"
              dataSource={[...logs].sort((a, b) => b.time - a.time)}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.status === 'failed' ? (
                      <Button type="link" onClick={() => onShowDetail(item.detail)}>错误详情</Button>
                    ) : null,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')}</span>
                        {item.status === 'running' && <Badge status="processing" text="进行中" />}
                        {item.status === 'success' && <Badge status="success" text="成功" />}
                        {item.status === 'failed' && <Badge status="error" text="失败" />}
                      </Space>
                    }
                    description={item.detail || '—'}
                  />
                  {item.durationMs ? <Tag color="blue">耗时 {Math.round(item.durationMs)} ms</Tag> : null}
                </List.Item>
              )}
            />
          </Collapse.Panel>
        </Collapse>
      </Space>
    </Card>
  );
};

export default StatusLogsCard;