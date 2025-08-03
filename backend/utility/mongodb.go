package utility

import (
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoConfig mongodb结构体
type MongoConfig struct {
	Address  string // MongoDB server address in URI format
	Database string // Target database name
}

func ConnectMongo() (*mongo.Client, error) {
	var (
		err    error
		ctx    = gctx.GetInitCtx()
		config *MongoConfig
	)
	err = g.Cfg().MustGet(ctx, "mongo").Scan(&config)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, gerror.New("mongo config not found")
	}
	g.Log().Debugf(ctx, "Mongo Config: %s", config)
	clientOptions := options.Client().ApplyURI(config.Address)
	return mongo.Connect(ctx, clientOptions)
}
