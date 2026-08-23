package utility

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/util/gconv"
)

// UserIdentity 当前请求用户身份（由鉴权中间件解析 JWT 后注入 ctx，避免下游重复解析 JWT + 校验 Redis）。
type UserIdentity struct {
	ID       string // users.id（UUID，主键即用户唯一标识）
	Username string // 登录名（仅日志/展示用途；数据库用户关联一律使用 ID）
}

type userIdentityKey struct{}

// WithUserIdentity 将用户身份注入 ctx（typed key，避免魔法字符串）。
func WithUserIdentity(ctx context.Context, u *UserIdentity) context.Context {
	return context.WithValue(ctx, userIdentityKey{}, u)
}

// UserIdentityFrom 从 ctx 读取注入的用户身份；未注入返回 (nil, false)。
func UserIdentityFrom(ctx context.Context) (*UserIdentity, bool) {
	u, ok := ctx.Value(userIdentityKey{}).(*UserIdentity)
	return u, ok
}

// CurrentUsername 返回当前用户登录名：优先取中间件注入的 UserIdentity，回退解析 JWT（兼容无中间件的调用路径）。
func CurrentUsername(ctx context.Context) (string, error) {
	if u, ok := UserIdentityFrom(ctx); ok && u.Username != "" {
		return u.Username, nil
	}
	claims, err := JWTMap(ctx)
	if err != nil {
		return "", err
	}
	username := gconv.String(claims["Username"])
	if username == "" {
		return "", gerror.NewCode(gcode.New(401, "token中缺少用户名", nil))
	}
	return username, nil
}

// WorkspacePrefix 返回当前用户的工作空间前缀（users.id，即用户 UUID），用于文件/对象存储按用户隔离；
// 无法解析用户时返回空字符串（调用方回退无前缀路径，兼容非 HTTP 调用）。
func WorkspacePrefix(ctx context.Context) string {
	if u, ok := UserIdentityFrom(ctx); ok && strings.TrimSpace(u.ID) != "" {
		return strings.TrimSpace(u.ID)
	}
	if uuid, err := CurrentUserUUID(ctx); err == nil && strings.TrimSpace(uuid) != "" {
		return strings.TrimSpace(uuid)
	}
	return ""
}
