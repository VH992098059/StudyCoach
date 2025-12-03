import React, { useState } from 'react';
import { Row, Col, Empty, Drawer,theme } from 'antd';
import './index.scss';
import ConfigPanel from './components/ConfigPanel';
import StatusLogsCard from './components/StatusLogsCard';
import ErrorDetailModal from './components/ErrorDetailModal';
import TaskListCard from './components/TaskListCard';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { useCronState } from './hooks/useCronState';

const CronPage: React.FC = () => {
  const { isTablet, isMobile } = useBreakpoints();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { token } = theme.useToken();
  
  const {
    form,
    tasks,
    selectedTaskId,
    execStatus,
    lastRun,
    logs,
    detail,
    setDetail,
    knowledgeSelectorRef,
    mode,
    selectedKnowledge,
    enabled,
    paused,
    nextRun,
    handleStartCreate,
    isCreating,
    handleDeleteTask,
    handleSave,
    handleRunNow,
    handleEnableToggle,
    handlePauseResume,
    handleKnowledgeChange,
    setSelectedTaskId,
    handleSelectTask,
    refreshTasks,
  } = useCronState();

  // When a task is selected on mobile, show the drawer
  const onSelectTask = (id: string) => {
    handleSelectTask(id);
    if (isMobile) {
      setDrawerVisible(true);
    }
  };

  const rightContentNode = selectedTaskId || isCreating ? (
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, height: '100%', alignItems: 'stretch' }}>
        <div style={{ flex: 1, height: isMobile ? 'auto' : '100%', minHeight: isMobile ? 500 : 0 }}>
          <ConfigPanel
            form={form}
            mode={mode}
            enabled={enabled}
            paused={paused}
            status={execStatus}
            lastRun={lastRun}
            nextRun={nextRun}
            onSave={handleSave}
            onRunNow={handleRunNow}
            onEnableToggle={handleEnableToggle}
            onPauseResume={handlePauseResume}
            isTablet={isTablet}
            selectedKnowledge={selectedKnowledge}
            knowledgeSelectorRef={knowledgeSelectorRef}
            onKnowledgeChange={handleKnowledgeChange}
          />
        </div>
        
        {!isCreating && (
        <div style={{ width: isMobile ? '100%' : 450, flexShrink: 0, height: isMobile ? 400 : '100%' }}>
          <StatusLogsCard
            status={execStatus}
            enabled={enabled}
            paused={paused}
            lastRun={lastRun}
            nextRun={nextRun}
            logs={logs}
            mode={mode}
            onShowDetail={(content?: string) => setDetail({ open: true, content })}
          />
        </div>
        )}
      </div>
    ) : (
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Empty description="暂无定时任务，请先新建" />
      </div>
    );

  return (
    <div className="cron-page" style={{ height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      <Row gutter={[16, 16]} style={{ height: '100%' }}>
        {/* Left Column: Task List */}
        <Col xs={24} md={8} lg={6} style={{ height: '100%' }}>
          <TaskListCard
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onAddTask={handleStartCreate}
            onDeleteTask={handleDeleteTask}
            onRefresh={refreshTasks}
          />
        </Col>
        
        {/* Right Column: Config and Logs (Hidden on mobile, shown in drawer) */}
        {!isMobile && (
          <Col xs={0} md={16} lg={18} style={{ height: '100%' }}>
            {rightContentNode}
          </Col>
        )}
      </Row>

      {/* Mobile Drawer */}
      <Drawer
        title="任务配置与日志"
        placement="right"
        width="100%"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{ body: { padding: 16, background: token.colorBgContainer } }}
      >
        {rightContentNode}
      </Drawer>

      <ErrorDetailModal
        open={detail.open}
        content={detail.content}
        onClose={() => setDetail({ open: false })}
      />
    </div>
  );
};

export default CronPage;
