package utility

import (
	"backend/utility/consts"
	"context"
	"fmt"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/util/gconv"
	"github.com/golang-jwt/jwt/v5"

	"strings"
)

// JwtClaims 定义自定义 JWT 载荷结构
type JwtClaims struct {
	Id       uint64
	Uuid     string `json:"uuid"` // users.uuid，知识库等按用户隔离时使用
	Username string
	jwt.RegisteredClaims
}

// Decryption 身份验证解密
func Decryption(token string, claims jwt.Claims) (*jwt.Token, error) {
	withClaims, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			msg := fmt.Errorf("unexpected signing method: %v", token.Header["alg"]).Error()
			return nil, gerror.NewCode(gcode.New(500, msg, nil))
		}
		return []byte(consts.JwtKey), nil
	})
	if err != nil {
		return nil, err
	}
	if !withClaims.Valid {
		return nil, gerror.NewCode(gcode.New(500, "验证无效", nil))
	}
	return withClaims, nil
}

// GetJWT 获取身份验证
func GetJWT(ctx context.Context) (token string) {
	// 使用从 Header 绑定的 req.Token，并移除 "Bearer " 前缀
	token = g.RequestFromCtx(ctx).Request.Header.Get("Authorization")
	if strings.HasPrefix(token, "Bearer ") {
		token = strings.TrimPrefix(token, "Bearer ")
	}
	return
}

func JWTMap(ctx context.Context) (claims jwt.MapClaims, err error) {
	getJwt := GetJWT(ctx)
	if getJwt == "" {
		err = gerror.NewCode(gcode.CodeInvalidParameter, "token is empty")
		return nil, err
	}
	//解密JWT
	token, err := jwt.Parse(getJwt, func(token *jwt.Token) (interface{}, error) {
		//验证
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(consts.JwtKey), nil
	})
	if err != nil || !token.Valid {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "token is invalid")
	}
	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "token claims invalid")
	}
	return mapClaims, nil
}

// CurrentUserID 从 JWT 解析当前用户 ID（对应 users.id，登录时写入 claims["Id"]）。
func CurrentUserID(ctx context.Context) (int64, error) {
	claims, err := JWTMap(ctx)
	if err != nil {
		return 0, err
	}
	id := gconv.Int64(claims["Id"])
	if id <= 0 {
		return 0, gerror.NewCode(gcode.CodeInvalidParameter, "token 中缺少有效用户 Id")
	}
	return id, nil
}

// CurrentUserUUID 返回当前用户的 users.uuid：优先 JWT 的 uuid；旧 token 无 uuid 时按 Id 查库（兼容未重登用户）。
func CurrentUserUUID(ctx context.Context) (string, error) {
	claims, err := JWTMap(ctx)
	if err != nil {
		return "", err
	}
	if u := strings.TrimSpace(gconv.String(claims["uuid"])); u != "" {
		return u, nil
	}
	id := gconv.Int64(claims["Id"])
	if id <= 0 {
		return "", gerror.NewCode(gcode.CodeInvalidParameter, "token 中缺少用户信息")
	}
	var uuid string
	err = g.DB().Ctx(ctx).Model("users").Where("id", id).Fields("uuid").Scan(&uuid)
	if err != nil || strings.TrimSpace(uuid) == "" {
		return "", gerror.NewCode(gcode.CodeInvalidParameter, "无法解析用户 UUID，请重新登录")
	}
	return uuid, nil
}
