package v1

// PauseTaskPomodoroReq 暂停任务番茄钟请求
type PauseTaskPomodoroReq struct {
	CronId string `json:"cronId" v:"required#cronId不能为空"` // UUID
}

// PauseTaskPomodoroRes 暂停任务番茄钟响应
type PauseTaskPomodoroRes struct {
	Success bool `json:"success"`
}

// StopTaskPomodoroReq 停止任务番茄钟请求
type StopTaskPomodoroReq struct {
	CronId string `json:"cronId" v:"required#cronId不能为空"` // UUID
}

// StopTaskPomodoroRes 停止任务番茄钟响应
type StopTaskPomodoroRes struct {
	Success bool `json:"success"`
}
