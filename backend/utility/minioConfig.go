package utility

import (
	"backend/studyCoach/minioFunc/config_minio"
	"context"

	"github.com/gogf/gf/v2/frame/g"
)

func MinioConfig(ctx context.Context) config_minio.MinIOConfig {
	return config_minio.MinIOConfig{
		EndpointAddr:    g.Cfg().MustGet(ctx, "minio.endpoint").String(),
		AccessKeyID:     g.Cfg().MustGet(ctx, "minio.accessKey").String(),
		SecretAccessKey: g.Cfg().MustGet(ctx, "minio.secretKey").String(),
		BucketName:      g.Cfg().MustGet(ctx, "minio.bucketFile").String(),
	}
}
