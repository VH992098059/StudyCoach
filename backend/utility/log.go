package utility

import (
	"github.com/gogf/gf/v2/frame/g"
)

// LogInfo 记录信息级别的日志
func LogInfo(message string, data map[string]interface{}) {
	g.Log().Info(nil, message, data)
}

// LogError 记录错误级别的日志
func LogError(message string, err error) {
	g.Log().Error(nil, message, err)
}
