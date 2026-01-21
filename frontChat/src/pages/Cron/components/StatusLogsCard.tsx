import React from 'react';
import { Card, Space, Badge, Tag, List, Button } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

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

const StatusLogsCard: React.FC<StatusLogsCardProps> = ({ status, enabled, paused, lastRun, nextRun, logs, onShowDetail, mode }) => {
  const { t } = useTranslation();

  return (
    <Card 
      title={t('cron.logs.title')} 
      className="section-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflowY: 'auto', padding: 0 } }}
    >
      <List
        itemLayout="horizontal"
        dataSource={[...logs].sort((a, b) => b.time - a.time)}
        pagination={{ pageSize: 5 }}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.status === 'failed' ? (
                <Button type="link" onClick={() => onShowDetail(item.detail)}>{t('cron.logs.details')}</Button>
              ) : null,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <span>{dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')}</span>
                  {item.status === 'running' && <Badge status="processing" text={t('cron.status.running')} />}
                  {item.status === 'success' && <Badge status="success" text={t('cron.status.success')} />}
                  {item.status === 'failed' && <Badge status="error" text={t('cron.status.failed')} />}
                </Space>
              }
              description={item.detail || '—'}
            />
            {item.durationMs ? <Tag color="blue">{t('cron.logs.duration')} {Math.round(item.durationMs)} ms</Tag> : null}
          </List.Item>
        )}
      />
    </Card>
  );
};

export default StatusLogsCard;