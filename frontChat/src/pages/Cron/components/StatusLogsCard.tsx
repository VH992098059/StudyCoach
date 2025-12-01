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
    <Card 
      title="执行日志" 
      className="section-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, overflowY: 'auto', padding: 0 }}
    >
      <List
        itemLayout="horizontal"
        dataSource={[...logs].sort((a, b) => b.time - a.time)}
        pagination={{ pageSize: 5 }}
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
    </Card>
  );
};

export default StatusLogsCard;