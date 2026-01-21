import React from 'react';
import { Card, List, Button, Tag, Space, Typography, theme } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export interface CronTask {
  id: string;
  cronName: string; // 对应数据库的 cron_name
  knowledgeBasename: string;
  cronExpression: string;
  status: 0 | 1 | 2; // 0: Stopped, 1: Running/Enabled, 2: Paused
  contentType: 1 | 2; // 1: Full Update, 2: Incremental Update
  
  // Frontend helper fields
  kbName?: string;
  lastRunTime?: number;
  execStatus?: 'idle' | 'running' | 'success' | 'failed';
  // Config storage for UI state (not in DB directly but needed for editing)
  config?: any;
}

interface TaskListCardProps {
  tasks: CronTask[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onRefresh?: () => void;
}

const TaskListCard: React.FC<TaskListCardProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
  onDeleteTask,
  onRefresh,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const getStatusTag = (status: number) => {
    switch (status) {
      case 1: return <Tag color="success">{t('cron.status.enabled')}</Tag>;
      case 2: return <Tag color="warning">{t('cron.status.paused')}</Tag>;
      default: return <Tag color="default">{t('cron.status.stopped')}</Tag>;
    }
  };

  return (
    <Card
      title={t('cron.title')}
      className="section-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      extra={
        <Space>
            <Button icon={<ReloadOutlined />} size="small" onClick={onRefresh} />
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={onAddTask}>
            {t('cron.create')}
            </Button>
        </Space>
      }
      styles={{ body: { padding: 0, flex: 1, overflowY: 'auto' } }}
    >
      <List
        rowKey="id"
        itemLayout="horizontal"
        dataSource={tasks}
        renderItem={(item) => (
          <List.Item
            className={`task-list-item ${selectedTaskId === item.id ? 'selected' : ''}`}
            onClick={() => onSelectTask(item.id)}
            actions={[
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(item.id);
                }}
              />
            ]}
            style={{
                cursor: 'pointer',
                padding: '12px 16px',
                backgroundColor: selectedTaskId === item.id ? token.colorPrimaryBg : 'transparent',
                borderLeft: selectedTaskId === item.id ? `3px solid ${token.colorPrimary}` : '3px solid transparent'
            }}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Typography.Text strong>{item.cronName || `${t('cron.task')} ${item.id}`}</Typography.Text>
                  {getStatusTag(item.status)}
                </Space>
              }
              description={
                <Space direction="vertical" size={0}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {item.cronExpression}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t('cron.kb')}: {item.kbName || item.knowledgeBasename || t('cron.notSelected')}
                  </Typography.Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default TaskListCard;
