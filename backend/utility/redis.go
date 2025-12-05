package utility

import (
	"context"
	"log"
	"time"

	"github.com/gogf/gf/contrib/nosql/redis/v2"
	"github.com/gogf/gf/v2/database/gredis"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
)

var (
	config = gredis.Config{
		Address: "127.0.0.1:6379",
		Db:      1,
		Pass:    "123456",
	}
	ctxRedis = gctx.New()
	group    = "cache"
)

func init() {

	adapter := redis.New(&config)         // 从配置加载客户端
	operation := adapter.AdapterOperation // 全局注册适配器
	_, err := operation.Conn(ctxRedis)
	if err != nil {
		return
	}
}

// SetJWT 将 token 存入 Redis 白名单，expiration 与 JWT 自身过期时间保持一致
func SetJWT(ctx context.Context, key, token string, expiration time.Duration) error {
	err := g.Redis().SetEX(ctx, "user:"+key, token, int64(expiration))
	if err != nil {
		log.Println("创建jwt报错")
	}
	err = DeleteBlackJWT(ctx, key)
	if err != nil {
		log.Println("删除jwt黑名单报错")
	}

	return err
}

// CheckJWT 检查 token 是否在白名单中
func CheckJWT(ctx context.Context, key, token string) (bool, error) {
	value, err := g.Redis().Get(ctx, key)
	if err != nil {
		// key 不存在或其他错误
		return false, err
	}
	return value.String() == token, nil
}

// AddBlackTokens 将token标记为黑名单
func AddBlackTokens(ctx context.Context, userKey, token string) error {
	err := g.Redis().SetEX(ctx, "jwt_blacklist:"+userKey, token, 3600*24)
	if err != nil {
		return err
	}
	return nil
}

// CheckBlackTokens 检查JWT是否在黑名单
func CheckBlackTokens(ctx context.Context, userKey, token string) (bool, error) {
	value, err := g.Redis().Get(ctx, "jwt_blacklist:"+userKey)
	if err != nil {
		return false, err
	}
	return value.String() == token, nil
}

// DeleteJWT 从白名单移除 token
func DeleteJWT(ctx context.Context, userKey string) error {
	del, err := g.Redis().Del(ctx, "user:"+userKey)
	if err != nil {
		return err
	}
	log.Println("redis白名单已删除：", del)
	return nil
}

// DeleteBlackJWT 从黑名单删除JWT
func DeleteBlackJWT(ctx context.Context, userKey string) error {
	_, err := g.Redis().Del(ctx, "jwt_blacklist:"+userKey)
	if err != nil {
		return err
	}
	return nil
}

// StoreFileToRedis 文件存储到redis
func StoreFileToRedis(ctx context.Context, fileKey string, fileData []byte) error {
	return g.Redis().SetEX(ctx, fileKey, fileData, 3600*24)
}

func GetFileFromRedis(ctx context.Context, fileKey string) ([]byte, error) {
	value, err := g.Redis().Get(ctx, fileKey)
	if err != nil {
		return nil, err
	}
	return value.Bytes(), nil
}
