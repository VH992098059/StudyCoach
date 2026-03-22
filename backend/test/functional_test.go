package integrationtest

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"
	"time"
)

func TestIntegration_Functional_HealthzReadyz(t *testing.T) {
	base := requireServer(t)
	c := &http.Client{Timeout: 5 * time.Second}

	for _, path := range []string{"/healthz", "/readyz"} {
		resp, err := c.Get(base + path)
		if err != nil {
			t.Fatalf("%s: %v", path, err)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s: HTTP %d %s", path, resp.StatusCode, string(body))
		}
		var m map[string]any
		if err := json.Unmarshal(body, &m); err != nil {
			t.Fatalf("%s: 非 JSON %s", path, string(body))
		}
	}
}
