package v1

// PauseTaskPomodoroReq 暂停任务番茄钟请求
type PauseTaskPomodoroReq struct {
	CronId int64 `json:"cronId" v:"required#cronId不能为空"`
}

// PauseTaskPomodoroRes 暂停任务番茄钟响应
type PauseTaskPomodoroRes struct {
	Success bool `json:"success"`
}

// StopTaskPomodoroReq 停止任务番茄钟请求
type StopTaskPomodoroReq struct {
	CronId int64 `json:"cronId" v:"required#cronId不能为空"`
}

// StopTaskPomodoroRes 停止任务番茄钟响应
type StopTaskPomodoroRes struct {
	Success bool `json:"success"`
}
