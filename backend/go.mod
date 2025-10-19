module backend

go 1.24.0

toolchain go1.24.2

require (
	github.com/PuerkitoBio/goquery v1.10.3
	github.com/bytedance/sonic v1.14.0
	github.com/cenkalti/backoff/v4 v4.3.0
	github.com/cloudwego/eino v0.4.7
	github.com/cloudwego/eino-ext/components/document/loader/file v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/document/transformer/splitter/markdown v0.0.0-20250822083409-f8d432eea60f
	github.com/cloudwego/eino-ext/components/document/transformer/splitter/recursive v0.0.0-20250822083409-f8d432eea60f
	github.com/cloudwego/eino-ext/components/retriever/es8 v0.0.0-20250801075622-6721dae36fe9
	github.com/elastic/go-elasticsearch/v8 v8.18.1
	github.com/gogf/gf/contrib/drivers/mysql/v2 v2.9.0
	github.com/gogf/gf/contrib/nosql/redis/v2 v2.9.0
	github.com/gogf/gf/v2 v2.9.0
	github.com/golang-jwt/jwt/v5 v5.2.2
	github.com/google/uuid v1.6.0
	github.com/gorilla/websocket v1.5.3
	github.com/minio/minio-go/v7 v7.0.94
	github.com/wangle201210/chat-history v0.0.0-20250402104704-5eec15d5419e
	go.mongodb.org/mongo-driver v1.17.4
	golang.org/x/crypto v0.41.0
	gorm.io/driver/postgres v1.5.9 // indirect
)

require (
	github.com/VH992098059/chat-history v0.0.0-20250822090229-bff17e0a58c2
	github.com/cloudwego/eino-ext/components/model/ollama v0.1.3
	github.com/cloudwego/eino-ext/components/tool/mcp v0.0.4
	github.com/goccy/go-json v0.10.5
	github.com/robfig/cron/v3 v3.0.1
	github.com/sergi/go-diff v1.4.0
)

require (
	cloud.google.com/go v0.121.6 // indirect
	cloud.google.com/go/auth v0.16.4 // indirect
	cloud.google.com/go/auth/oauth2adapt v0.2.8 // indirect
	cloud.google.com/go/compute/metadata v0.8.0 // indirect
	cloud.google.com/go/firestore v1.19.0 // indirect
	cloud.google.com/go/longrunning v0.6.7 // indirect
	github.com/bahlo/generic-list-go v0.2.0 // indirect
	github.com/buger/jsonparser v1.1.1 // indirect
	github.com/eino-contrib/jsonschema v1.0.0 // indirect
	github.com/felixge/httpsnoop v1.0.4 // indirect
	github.com/go-ini/ini v1.67.0 // indirect
	github.com/google/jsonschema-go v0.3.0 // indirect
	github.com/google/s2a-go v0.1.9 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.3.6 // indirect
	github.com/googleapis/gax-go/v2 v2.15.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.5.5 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	github.com/lib/pq v1.10.9 // indirect
	github.com/minio/crc64nvme v1.0.1 // indirect
	github.com/minio/md5-simd v1.1.2 // indirect
	github.com/modelcontextprotocol/go-sdk v1.0.0 // indirect
	github.com/ollama/ollama v0.12.3 // indirect
	github.com/philhofer/fwd v1.1.3-0.20240916144458-20a13a1f6b7c // indirect
	github.com/pion/datachannel v1.5.10 // indirect
	github.com/pion/dtls/v3 v3.0.7 // indirect
	github.com/pion/ice/v4 v4.0.10 // indirect
	github.com/pion/interceptor v0.1.41 // indirect
	github.com/pion/logging v0.2.4 // indirect
	github.com/pion/mdns/v2 v2.0.7 // indirect
	github.com/pion/randutil v0.1.0 // indirect
	github.com/pion/rtcp v1.2.15 // indirect
	github.com/pion/rtp v1.8.23 // indirect
	github.com/pion/sctp v1.8.40 // indirect
	github.com/pion/sdp/v3 v3.0.16 // indirect
	github.com/pion/srtp/v3 v3.0.8 // indirect
	github.com/pion/stun/v3 v3.0.0 // indirect
	github.com/pion/transport/v3 v3.0.8 // indirect
	github.com/pion/turn/v4 v4.1.1 // indirect
	github.com/pion/webrtc/v4 v4.1.6 // indirect
	github.com/rs/xid v1.6.0 // indirect
	github.com/tinylib/msgp v1.3.0 // indirect
	github.com/wk8/go-ordered-map/v2 v2.1.8 // indirect
	github.com/wlynxg/anet v0.0.5 // indirect
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.61.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.61.0 // indirect
	golang.org/x/oauth2 v0.30.0 // indirect
	golang.org/x/time v0.12.0 // indirect
	google.golang.org/api v0.247.0 // indirect
	google.golang.org/genproto v0.0.0-20250603155806-513f23925822 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20250818200422-3122310a409c // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250818200422-3122310a409c // indirect
	google.golang.org/grpc v1.74.2 // indirect
	google.golang.org/protobuf v1.36.7 // indirect
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
	github.com/cloudwego/base64x v0.1.5 // indirect
	github.com/cloudwego/eino-ext/components/document/loader/url v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/document/parser/html v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/document/parser/pdf v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/embedding/openai v0.0.0-20250801075622-6721dae36fe9
	github.com/cloudwego/eino-ext/components/indexer/es8 v0.0.0-20250818090953-a59b1be0df04
	github.com/cloudwego/eino-ext/components/model/ark v0.1.27
	github.com/cloudwego/eino-ext/components/model/openai v0.0.0-20250905035413-86dbae6351d5
	github.com/cloudwego/eino-ext/components/tool/duckduckgo v0.0.0-20250905035413-86dbae6351d5
	github.com/cloudwego/eino-ext/libs/acl/openai v0.0.0-20250826113018-8c6f6358d4bb // indirect
	github.com/dgraph-io/ristretto v0.2.0
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dslipak/pdf v0.0.2 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/elastic/elastic-transport-go/v8 v8.7.0 // indirect
	github.com/emirpasic/gods v1.18.1 // indirect
	github.com/evanphx/json-patch v4.12.0+incompatible // indirect
	github.com/fatih/color v1.18.0 // indirect
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/getkin/kin-openapi v0.118.0 // indirect
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-openapi/jsonpointer v0.21.1 // indirect
	github.com/go-openapi/swag v0.23.1 // indirect
	github.com/go-sql-driver/mysql v1.9.3 // indirect
	github.com/gogf/gf/contrib/drivers/pgsql/v2 v2.9.0
	github.com/golang/snappy v1.0.0 // indirect
	github.com/goph/emperror v0.17.2 // indirect
	github.com/gorilla/css v1.0.1 // indirect
	github.com/grokify/html-strip-tags-go v0.1.0 // indirect
	github.com/invopop/yaml v0.1.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/joho/godotenv v1.5.1
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/compress v1.18.0 // indirect
	github.com/klauspost/cpuid/v2 v2.2.11 // indirect
	github.com/magiconair/properties v1.8.9 // indirect
	github.com/mailru/easyjson v0.9.0 // indirect
	github.com/mark3labs/mcp-go v0.33.0
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.16 // indirect
	github.com/meguminnnnnnnnn/go-openai v0.0.0-20250821095446-07791bea23a0 // indirect
	github.com/microcosm-cc/bluemonday v1.0.27 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/mohae/deepcopy v0.0.0-20170929034955-c48cc78d4826 // indirect
	github.com/montanaflynn/stats v0.7.1 // indirect
	github.com/nikolalohinski/gonja v1.5.3 // indirect
	github.com/olekukonko/tablewriter v0.0.5 // indirect
	github.com/openai/openai-go v1.10.1 // indirect
	github.com/pelletier/go-toml/v2 v2.2.4 // indirect
	github.com/perimeterx/marshmallow v1.1.5 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/redis/go-redis/v9 v9.12.1 // indirect
	github.com/rivo/uniseg v0.4.7 // indirect
	github.com/sirupsen/logrus v1.9.3 // indirect
	github.com/slongfield/pyfmt v0.0.0-20220222012616-ea85ff4c361f // indirect
	github.com/spf13/cast v1.7.1 // indirect
	github.com/tidwall/gjson v1.14.4 // indirect
	github.com/tidwall/match v1.1.1 // indirect
	github.com/tidwall/pretty v1.2.1 // indirect
	github.com/tidwall/sjson v1.2.5 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/volcengine/volc-sdk-golang v1.0.23 // indirect
	github.com/volcengine/volcengine-go-sdk v1.1.21 // indirect
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
	golang.org/x/net v0.43.0 // indirect
	golang.org/x/sync v0.16.0
	golang.org/x/sys v0.35.0 // indirect
	golang.org/x/text v0.28.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	gorm.io/driver/mysql v1.5.7 // indirect
	gorm.io/gorm v1.25.12
)
