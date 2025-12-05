module backend

go 1.24.0

toolchain go1.24.2

require (
	github.com/PuerkitoBio/goquery v1.10.3
	github.com/bytedance/sonic v1.14.1
	github.com/cenkalti/backoff/v4 v4.3.0
	github.com/cloudwego/eino v0.6.1
	github.com/cloudwego/eino-ext/components/document/loader/file v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/document/transformer/splitter/markdown v0.0.0-20250822083409-f8d432eea60f
	github.com/cloudwego/eino-ext/components/document/transformer/splitter/recursive v0.0.0-20250822083409-f8d432eea60f
	github.com/cloudwego/eino-ext/components/retriever/es8 v0.0.0-20251104133232-721ebd5ef820
	github.com/elastic/go-elasticsearch/v8 v8.18.1
	github.com/gogf/gf/contrib/drivers/mysql/v2 v2.9.0
	github.com/gogf/gf/contrib/nosql/redis/v2 v2.9.0
	github.com/gogf/gf/v2 v2.9.0
	github.com/golang-jwt/jwt/v5 v5.2.2
	github.com/google/uuid v1.6.0
	github.com/gorilla/websocket v1.5.3
	github.com/minio/minio-go/v7 v7.0.94
	github.com/wangle201210/chat-history v0.0.1
	go.mongodb.org/mongo-driver v1.17.4
	golang.org/x/crypto v0.40.0
)

require (
	github.com/cloudwego/eino-ext/components/document/parser/xlsx v0.0.0-20251121095553-9c4349cc3e46
	github.com/cloudwego/eino-ext/components/indexer/qdrant v0.0.0-20251121095553-9c4349cc3e46
	github.com/cloudwego/eino-ext/components/tool/mcp v0.0.4
	github.com/goccy/go-json v0.10.5
	github.com/qdrant/go-client v1.15.2
	github.com/robfig/cron/v3 v3.0.1
	github.com/sergi/go-diff v1.4.0
)

require (
	github.com/bahlo/generic-list-go v0.2.0 // indirect
	github.com/buger/jsonparser v1.1.1 // indirect
	github.com/bytedance/gopkg v0.1.3 // indirect
	github.com/corpix/uarand v0.2.0 // indirect
	github.com/eino-contrib/jsonschema v1.0.2 // indirect
	github.com/go-ini/ini v1.67.0 // indirect
	github.com/lib/pq v1.10.9 // indirect
	github.com/mattn/go-sqlite3 v1.14.22 // indirect
	github.com/minio/crc64nvme v1.0.1 // indirect
	github.com/minio/md5-simd v1.1.2 // indirect
	github.com/philhofer/fwd v1.1.3-0.20240916144458-20a13a1f6b7c // indirect
	github.com/richardlehane/mscfb v1.0.4 // indirect
	github.com/richardlehane/msoleps v1.0.4 // indirect
	github.com/rs/xid v1.6.0 // indirect
	github.com/tinylib/msgp v1.3.0 // indirect
	github.com/wk8/go-ordered-map/v2 v2.1.8 // indirect
	github.com/xuri/efp v0.0.0-20240408161823-9ad904a10d6d // indirect
	github.com/xuri/excelize/v2 v2.9.0 // indirect
	github.com/xuri/nfp v0.0.0-20240318013403-ab9948c2c4a7 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251111163417-95abcf5c77ba // indirect
	google.golang.org/grpc v1.66.0 // indirect
	google.golang.org/protobuf v1.36.10 // indirect
	gorm.io/driver/sqlite v1.6.0 // indirect
)

replace studyCoach => ../

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/BurntSushi/toml v1.4.0 // indirect
	github.com/andybalholm/cascadia v1.3.3 // indirect
	github.com/aymerick/douceur v0.2.0 // indirect
	github.com/bytedance/sonic/loader v0.3.0 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/clbanning/mxj/v2 v2.7.0 // indirect
	github.com/cloudwego/base64x v0.1.6 // indirect
	github.com/cloudwego/eino-ext/components/document/loader/url v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/document/parser/html v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/document/parser/pdf v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/embedding/openai v0.0.0-20250801075622-6721dae36fe9
	github.com/cloudwego/eino-ext/components/indexer/es8 v0.0.0-20250818090953-a59b1be0df04
	github.com/cloudwego/eino-ext/components/model/ark v0.1.51
	github.com/cloudwego/eino-ext/components/model/openai v0.1.5
	github.com/cloudwego/eino-ext/components/tool/duckduckgo v0.0.0-20251201051757-182503179fca
	github.com/cloudwego/eino-ext/components/tool/duckduckgo/v2 v2.0.0-20251114071555-14756a18ad37
	github.com/cloudwego/eino-ext/libs/acl/openai v0.1.2 // indirect
	github.com/dgraph-io/ristretto v0.2.0
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dslipak/pdf v0.0.2 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/elastic/elastic-transport-go/v8 v8.7.0 // indirect
	github.com/emirpasic/gods v1.18.1 // indirect
	github.com/evanphx/json-patch v4.12.0+incompatible // indirect
	github.com/fatih/color v1.18.0 // indirect
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-sql-driver/mysql v1.9.3 // indirect
	github.com/gogf/gf/contrib/drivers/pgsql/v2 v2.9.0
	github.com/golang/snappy v1.0.0 // indirect
	github.com/goph/emperror v0.17.2 // indirect
	github.com/gorilla/css v1.0.1 // indirect
	github.com/grokify/html-strip-tags-go v0.1.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/compress v1.18.0 // indirect
	github.com/klauspost/cpuid/v2 v2.2.11 // indirect
	github.com/magiconair/properties v1.8.9 // indirect
	github.com/mailru/easyjson v0.9.0 // indirect
	github.com/mark3labs/mcp-go v0.33.0
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.16 // indirect
	github.com/meguminnnnnnnnn/go-openai v0.1.0 // indirect
	github.com/microcosm-cc/bluemonday v1.0.27 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/mohae/deepcopy v0.0.0-20170929034955-c48cc78d4826 // indirect
	github.com/montanaflynn/stats v0.7.1 // indirect
	github.com/nikolalohinski/gonja v1.5.3 // indirect
	github.com/olekukonko/tablewriter v0.0.5 // indirect
	github.com/pelletier/go-toml/v2 v2.2.4 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/redis/go-redis/v9 v9.12.1 // indirect
	github.com/rivo/uniseg v0.4.7 // indirect
	github.com/sirupsen/logrus v1.9.3 // indirect
	github.com/slongfield/pyfmt v0.0.0-20220222012616-ea85ff4c361f // indirect
	github.com/spf13/cast v1.7.1 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/volcengine/volc-sdk-golang v1.0.23 // indirect
	github.com/volcengine/volcengine-go-sdk v1.1.49
	github.com/xdg-go/pbkdf2 v1.0.0 // indirect
	github.com/xdg-go/scram v1.1.2 // indirect
	github.com/xdg-go/stringprep v1.0.4 // indirect
	github.com/yargevad/filepathx v1.0.0 // indirect
	github.com/yosida95/uritemplate/v3 v3.0.2 // indirect
	github.com/youmark/pkcs8 v0.0.0-20240726163527-a2c0da244d78 // indirect
	go.opentelemetry.io/auto/sdk v1.1.0 // indirect
	go.opentelemetry.io/otel v1.37.0 // indirect
	go.opentelemetry.io/otel/metric v1.37.0 // indirect
	go.opentelemetry.io/otel/sdk v1.37.0 // indirect
	go.opentelemetry.io/otel/trace v1.37.0 // indirect
	golang.org/x/arch v0.19.0 // indirect
	golang.org/x/exp v0.0.0-20250711185948-6ae5c78190dc // indirect
	golang.org/x/net v0.42.0 // indirect
	golang.org/x/sync v0.16.0
	golang.org/x/sys v0.34.0 // indirect
	golang.org/x/text v0.27.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	gorm.io/driver/mysql v1.5.7 // indirect
	gorm.io/gorm v1.30.0
)
