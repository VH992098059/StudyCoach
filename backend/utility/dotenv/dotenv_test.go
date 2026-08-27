package dotenv

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParse(t *testing.T) {
	content := `
# 整行注释
DB_HOST=localhost
DB_PASS="pass # 123"
DB_NAME='study coach'

export TOKEN=abc123
EMPTY=
  SPACED  =  trimmed
NOT_A_PAIR
=x
`
	got := Parse(content)
	want := map[string]string{
		"DB_HOST": "localhost",
		"DB_PASS": "pass # 123",
		"DB_NAME": "study coach",
		"TOKEN":   "abc123",
		"EMPTY":   "",
		"SPACED":  "trimmed",
	}
	if len(got) != len(want) {
		t.Fatalf("Parse() got %d items, want %d: %v", len(got), len(want), got)
	}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("Parse()[%q] = %q, want %q", k, got[k], v)
		}
	}
}

func TestParseCRLF(t *testing.T) {
	got := Parse("A=1\r\nB=2\r\n")
	if got["A"] != "1" || got["B"] != "2" {
		t.Errorf("Parse() CRLF handling failed: %v", got)
	}
}

func TestLoad(t *testing.T) {
	dir := t.TempDir()
	a := filepath.Join(dir, "a.env")
	b := filepath.Join(dir, "b.env")
	if err := os.WriteFile(a, []byte("KEY=from_a\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(b, []byte("KEY=from_b\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	env, err := Load(a, b)
	if err != nil {
		t.Fatal(err)
	}
	if env["KEY"] != "from_a" {
		t.Errorf("Load() = %q, want first file value %q", env["KEY"], "from_a")
	}

	env, err = Load(filepath.Join(dir, "missing.env"), b)
	if err != nil {
		t.Fatal(err)
	}
	if env["KEY"] != "from_b" {
		t.Errorf("Load() fallback = %q, want %q", env["KEY"], "from_b")
	}

	env, err = Load(filepath.Join(dir, "none1"), filepath.Join(dir, "none2"))
	if err != nil {
		t.Fatal(err)
	}
	if env != nil {
		t.Errorf("Load() with no existing file = %v, want nil", env)
	}
}

func TestRender(t *testing.T) {
	env := map[string]string{"H": "db", "A": "set"}
	out, missing := Render("host=${H} port=${P:-5432} key=${A}", env)
	if out != "host=db port=5432 key=set" {
		t.Errorf("Render() = %q", out)
	}
	if len(missing) != 0 {
		t.Errorf("Render() missing = %v, want empty", missing)
	}
}

func TestRenderDefaultNotUsedWhenSet(t *testing.T) {
	out, _ := Render("${A:-def}", map[string]string{"A": "value"})
	if out != "value" {
		t.Errorf("Render() = %q, want %q", out, "value")
	}
}

func TestRenderMissingWithoutDefault(t *testing.T) {
	out, missing := Render("k=${SECRET}", map[string]string{})
	if out != "k=" {
		t.Errorf("Render() = %q, want %q", out, "k=")
	}
	if len(missing) != 1 || missing[0] != "SECRET" {
		t.Errorf("Render() missing = %v, want [SECRET]", missing)
	}
}

func TestRenderKeepsPlainDollar(t *testing.T) {
	out, missing := Render("a=$5 b=$HOME c=${a-b}", map[string]string{})
	if out != "a=$5 b=$HOME c=${a-b}" {
		t.Errorf("Render() = %q, plain $ should stay untouched", out)
	}
	if len(missing) != 0 {
		t.Errorf("Render() missing = %v, want empty", missing)
	}
}

func TestSetEnvDoesNotOverride(t *testing.T) {
	t.Setenv("DOTENV_SET_ENV_TEST", "real")
	applied := SetEnv(map[string]string{
		"DOTENV_SET_ENV_TEST":     "file",
		"DOTENV_SET_ENV_TEST_NEW": "file2",
	})
	if os.Getenv("DOTENV_SET_ENV_TEST") != "real" {
		t.Errorf("SetEnv() overrode existing env var")
	}
	if os.Getenv("DOTENV_SET_ENV_TEST_NEW") != "file2" {
		t.Errorf("SetEnv() did not apply new var")
	}
	if len(applied) != 1 || applied[0] != "DOTENV_SET_ENV_TEST_NEW" {
		t.Errorf("SetEnv() applied = %v, want only new var", applied)
	}
}

func TestGenerateWithoutEnvFile(t *testing.T) {
	dir := t.TempDir()
	tpl := filepath.Join(dir, "config.template.yaml")
	out := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(tpl, []byte("k: ${V:-d}\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	res, err := Generate(tpl, out, filepath.Join(dir, ".env"))
	if err != nil {
		t.Fatal(err)
	}
	if res.EnvFile != "" || res.Generated {
		t.Errorf("Generate() = %+v, want no-op result", res)
	}
	if _, err := os.Stat(out); !os.IsNotExist(err) {
		t.Errorf("Generate() should not write output without .env")
	}
}

func TestGenerate(t *testing.T) {
	dir := t.TempDir()
	tpl := filepath.Join(dir, "config.template.yaml")
	envFile := filepath.Join(dir, ".env")
	out := filepath.Join(dir, "nested", "config.yaml")

	tplContent := "apiKey: \"${TOKEN}\"\nmodel: \"${MODEL:-default-m}\"\n"
	if err := os.WriteFile(tpl, []byte(tplContent), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(envFile, []byte("TOKEN=abc\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	res, err := Generate(tpl, out, envFile)
	if err != nil {
		t.Fatal(err)
	}
	if !res.Generated || res.EnvFile != envFile {
		t.Errorf("Generate() result = %+v", res)
	}
	if len(res.Missing) != 0 {
		t.Errorf("Generate() missing = %v, want empty", res.Missing)
	}
	got, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	want := "apiKey: \"abc\"\nmodel: \"default-m\"\n"
	if string(got) != want {
		t.Errorf("generated file = %q, want %q", got, want)
	}
	if os.Getenv("TOKEN") != "abc" {
		t.Errorf("Generate() did not inject TOKEN into process env")
	}
}

func TestGenerateEnvOverridesFile(t *testing.T) {
	dir := t.TempDir()
	tpl := filepath.Join(dir, "tpl")
	envFile := filepath.Join(dir, ".env")
	out := filepath.Join(dir, "out.yaml")
	if err := os.WriteFile(tpl, []byte("k: \"${K}\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(envFile, []byte("K=from_file\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Setenv("K", "from_env")

	if _, err := Generate(tpl, out, envFile); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "k: \"from_env\"\n" {
		t.Errorf("generated = %q, process env should take priority", got)
	}
}

func TestGenerateReportsMissing(t *testing.T) {
	dir := t.TempDir()
	tpl := filepath.Join(dir, "tpl")
	envFile := filepath.Join(dir, ".env")
	out := filepath.Join(dir, "out.yaml")
	if err := os.WriteFile(tpl, []byte("a: \"${SECRET1}\"\nb: \"${SECRET2}\"\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(envFile, []byte("SECRET1=x\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	res, err := Generate(tpl, out, envFile)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Missing) != 1 || res.Missing[0] != "SECRET2" {
		t.Errorf("Generate() missing = %v, want [SECRET2]", res.Missing)
	}
}

func TestGenerateWithoutTemplate(t *testing.T) {
	dir := t.TempDir()
	envFile := filepath.Join(dir, ".env")
	out := filepath.Join(dir, "out.yaml")
	if err := os.WriteFile(envFile, []byte("TOKEN=abc\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	res, err := Generate(filepath.Join(dir, "no.tpl"), out, envFile)
	if err != nil {
		t.Fatal(err)
	}
	if res.Generated {
		t.Errorf("Generate() should not generate without template")
	}
	if os.Getenv("TOKEN") != "abc" {
		t.Errorf("Generate() should still inject env vars without template")
	}
}
