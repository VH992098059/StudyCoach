package utility

import (
	"github.com/gogf/gf/v2/errors/gerror"
)

// WrapError 包装错误信息，添加上下文描述
func WrapError(err error, description string) error {
	if err == nil {
		return nil
	}
	return gerror.Wrap(err, description)
}
