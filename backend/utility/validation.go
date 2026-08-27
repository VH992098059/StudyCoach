package utility

import (
	"context"
	"errors"

	"github.com/gogf/gf/v2/util/gvalid"
	"github.com/google/uuid"
)

// init 注册全局自定义校验规则。
// 说明：gf v2.10 未内置 uuid 规则，此处在 utility 包（已被 main 依赖链引入）
// 注册，供 api 定义层使用 v:"required|uuid" 快速拦截非法 UUID 入参，
// 避免其透传到 pgsql uuid 列引发 "无效的类型 uuid 输入语法" 数据库错误。
func init() {
	gvalid.RegisterRule("uuid", func(ctx context.Context, in gvalid.RuleFuncInput) error {
		if in.Value == nil || in.Value.IsNil() {
			return nil // 空值交给 required 规则处理
		}
		if _, err := uuid.Parse(in.Value.String()); err != nil {
			if in.Message != "" {
				return errors.New(in.Message)
			}
			return errors.New(in.Field + "必须是合法的 UUID 格式")
		}
		return nil
	})
}
