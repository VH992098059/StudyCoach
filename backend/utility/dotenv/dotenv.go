// Package dotenv 提供极简 .env 加载与配置模板渲染能力。
//
// 典型用法（main.go 启动阶段，在 gcfg 读取配置前调用）：
//
//	res, err := dotenv.Generate(
//	    "manifest/config/config.template.yaml",
//	    "manifest/config/config.yaml",
//	    ".env", "../.env",
//	)
//
// 规则：
//   - envFiles 中第一个存在的 .env 生效；
//   - 进程已有环境变量优先于 .env 中的同名值；
//   - 模板占位符语法：${VAR} 与 ${VAR:-默认值}；
//   - 找不到 .env 或模板时为 no-op，保持直接手写 config.yaml 的部署方式不变。
package dotenv

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// placeholderPattern 匹配 ${VAR} 与 ${VAR:-default} 两种占位符。
var placeholderPattern = regexp.MustCompile(`\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?\}`)

// GenerateResult Generate 的执行结果。
type GenerateResult struct {
	EnvFile    string   // 实际使用的 .env 文件路径，空表示未找到（未执行生成）
	Generated  bool     // 是否生成了配置文件
	OutputPath string   // 生成的配置文件路径
	Missing    []string // 渲染时既无值又无默认值的变量名（用于启动警告）
}

// Parse 解析 .env 文本内容为键值对。
// 支持 KEY=VALUE、成对单双引号、# 整行注释、空行、export 前缀与 CRLF；
// 无效行（缺少 key）被忽略。不支持行内注释，值含 # 时请加引号。
func Parse(content string) map[string]string {
	env := make(map[string]string)
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(strings.TrimSuffix(line, "\r"))
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		value = strings.TrimSpace(value)
		if len(value) >= 2 {
			if (value[0] == '"' && value[len(value)-1] == '"') ||
				(value[0] == '\'' && value[len(value)-1] == '\'') {
				value = value[1 : len(value)-1]
			}
		}
		env[key] = value
	}
	return env
}

// Load 依次查找 paths，解析第一个存在的文件；均不存在时返回 (nil, nil)。
func Load(paths ...string) (map[string]string, error) {
	for _, path := range paths {
		if _, err := os.Stat(path); err != nil {
			continue
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}
		return Parse(string(content)), nil
	}
	return nil, nil
}

// Render 将 content 中 ${VAR} 与 ${VAR:-default} 占位符替换为 env 中的值，
// 返回渲染结果与"无值且无默认值"的变量名列表（未提供值的 ${VAR} 渲染为空串）。
func Render(content string, env map[string]string) (string, []string) {
	var missing []string
	out := placeholderPattern.ReplaceAllStringFunc(content, func(match string) string {
		groups := placeholderPattern.FindStringSubmatch(match)
		name := groups[1]
		if value, ok := env[name]; ok {
			return value
		}
		if groups[2] != "" || groups[3] != "" {
			return groups[3] // ${VAR:-default} 的默认值
		}
		missing = append(missing, name)
		return ""
	})
	return out, missing
}

// SetEnv 将 env 写入进程环境变量，已存在的环境变量不覆盖。
// 返回实际写入的变量名列表。
func SetEnv(env map[string]string) []string {
	var applied []string
	for k, v := range env {
		if _, exists := os.LookupEnv(k); exists {
			continue
		}
		if err := os.Setenv(k, v); err == nil {
			applied = append(applied, k)
		}
	}
	return applied
}

// Generate 加载 envFiles 中第一个存在的 .env，用其渲染 templatePath 指向的
// 配置模板，并将结果写入 outputPath；同时把变量注入进程环境（供直接读环境
// 变量的代码使用，如 MINERU_TOKEN）。
//
// 未找到 .env 或模板不存在时为 no-op，返回零值结果。
func Generate(templatePath, outputPath string, envFiles ...string) (GenerateResult, error) {
	var res GenerateResult

	fileEnv, err := Load(envFiles...)
	if err != nil {
		return res, err
	}
	if fileEnv == nil {
		return res, nil
	}
	// 记录实际使用的 .env 路径（Load 返回非 nil 即表示找到）。
	for _, path := range envFiles {
		if _, statErr := os.Stat(path); statErr == nil {
			res.EnvFile = path
			break
		}
	}

	// 进程已有环境变量优先于 .env 同名值。
	env := make(map[string]string, len(fileEnv))
	for k, v := range fileEnv {
		if real, exists := os.LookupEnv(k); exists {
			env[k] = real
		} else {
			env[k] = v
		}
	}
	SetEnv(env)

	tplContent, err := os.ReadFile(templatePath)
	if err != nil {
		if os.IsNotExist(err) {
			return res, nil
		}
		return res, err
	}

	out, missing := Render(string(tplContent), env)
	res.Missing = missing

	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		return res, err
	}
	if err := os.WriteFile(outputPath, []byte(out), 0o644); err != nil {
		return res, err
	}
	res.Generated = true
	res.OutputPath = outputPath
	return res, nil
}
