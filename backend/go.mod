module backend

go 1.24

toolchain go1.24.2

require (
	github.com/cloudwego/eino v0.3.51
	github.com/cloudwego/eino-ext/components/retriever/es8 v0.0.0-20250710065240-482d48888f25
	github.com/cloudwego/eino-ext/components/tool/duckduckgo v0.0.0-20250710065240-482d48888f25
	github.com/gogf/gf/contrib/drivers/mysql/v2 v2.9.0
	github.com/gogf/gf/contrib/nosql/redis/v2 v2.9.0
	github.com/gogf/gf/v2 v2.9.0
	github.com/golang-jwt/jwt/v5 v5.2.2
	github.com/google/uuid v1.6.0
	github.com/wangle201210/chat-history v0.0.0-20250402104704-5eec15d5419e
	go.mongodb.org/mongo-driver v1.17.4
	golang.org/x/crypto v0.40.0
	studyCoach v0.0.0-00010101000000-000000000000
)

replace studyCoach => ../

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/BurntSushi/toml v1.4.0 // indirect
	github.com/PuerkitoBio/goquery v1.10.3 // indirect
	github.com/andybalholm/cascadia v1.3.3 // indirect
	github.com/aymerick/douceur v0.2.0 // indirect
	github.com/bytedance/sonic v1.13.3 // indirect
	github.com/bytedance/sonic/loader v0.3.0 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/clbanning/mxj/v2 v2.7.0 // indirect
	github.com/cloudwego/base64x v0.1.5 // indirect
	github.com/cloudwego/eino-ext/components/document/loader/file v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/components/document/loader/url v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/components/document/parser/html v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/components/document/parser/pdf v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/components/document/transformer/reranker/score v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/components/embedding/openai v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/components/indexer/es8 v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/components/model/openai v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/cloudwego/eino-ext/libs/acl/openai v0.0.0-20250710065240-482d48888f25 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dslipak/pdf v0.0.2 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/elastic/elastic-transport-go/v8 v8.7.0 // indirect
	github.com/elastic/go-elasticsearch/v8 v8.18.1 // indirect
	github.com/emirpasic/gods v1.18.1 // indirect
	github.com/evanphx/json-patch v0.5.2 // indirect
	github.com/fatih/color v1.18.0 // indirect
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/getkin/kin-openapi v0.118.0 // indirect
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-openapi/jsonpointer v0.21.1 // indirect
	github.com/go-openapi/swag v0.23.1 // indirect
	github.com/go-sql-driver/mysql v1.9.3 // indirect
	github.com/golang/snappy v0.0.4 // indirect
	github.com/goph/emperror v0.17.2 // indirect
	github.com/gorilla/css v1.0.1 // indirect
	github.com/gorilla/websocket v1.5.3 // indirect
	github.com/grokify/html-strip-tags-go v0.1.0 // indirect
	github.com/invopop/yaml v0.1.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/joho/godotenv v1.5.1 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/compress v1.16.7 // indirect
	github.com/klauspost/cpuid/v2 v2.2.11 // indirect
	github.com/magiconair/properties v1.8.9 // indirect
	github.com/mailru/easyjson v0.9.0 // indirect
	github.com/mark3labs/mcp-go v0.33.0 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.16 // indirect
	github.com/meguminnnnnnnnn/go-openai v0.0.0-20250620092828-0d508a1dcdde // indirect
	github.com/microcosm-cc/bluemonday v1.0.27 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/mohae/deepcopy v0.0.0-20170929034955-c48cc78d4826 // indirect
	github.com/montanaflynn/stats v0.7.1 // indirect
	github.com/nikolalohinski/gonja v1.5.3 // indirect
	github.com/olekukonko/tablewriter v0.0.5 // indirect
	github.com/pelletier/go-toml/v2 v2.2.4 // indirect
	github.com/perimeterx/marshmallow v1.1.5 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/redis/go-redis/v9 v9.7.0 // indirect
	github.com/rivo/uniseg v0.4.7 // indirect
	github.com/sirupsen/logrus v1.9.3 // indirect
	github.com/slongfield/pyfmt v0.0.0-20220222012616-ea85ff4c361f // indirect
	github.com/spf13/cast v1.7.1 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
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
	golang.org/x/sync v0.16.0 // indirect
	golang.org/x/sys v0.34.0 // indirect
	golang.org/x/text v0.27.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	gorm.io/driver/mysql v1.5.7 // indirect
	gorm.io/gorm v1.25.12 // indirect
)