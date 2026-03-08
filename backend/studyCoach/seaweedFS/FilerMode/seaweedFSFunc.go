package FilerMode

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

// defaultClient 默认 Filer 客户端，由 init 或首次调用时初始化
var defaultClient *FilerClient

// GetDefaultClient 获取默认 Filer 客户端
func GetDefaultClient() *FilerClient {
	return defaultClient
}

// FilerClient 封装 SeaweedFS Filer 的操作
type FilerClient struct {
	BaseURL    string       // Filer 地址，例如 http://localhost:8888
	HttpClient *http.Client // HTTP 客户端
}

// NewFilerClient 初始化客户端并设为默认客户端
// endpoint: Filer 的地址，如 "http://192.168.1.100:8888"
func NewFilerClient(endpoint string) *FilerClient {
	c := &FilerClient{
		BaseURL: strings.TrimRight(endpoint, "/"),
		HttpClient: &http.Client{
			Timeout: 30 * time.Second, // 设置超时，防止请求卡死
		},
	}
	defaultClient = c
	return c
}

// SeaweedFSUpload 上传文件
func (c *FilerClient) SeaweedFSUpload(ctx context.Context, remotePath string, fileReader io.Reader) error {

	log.Println("上传文件：", remotePath)

	// 构造完整的上传 URL
	// 格式: http://localhost:8888/user/avatars/1001.jpg
	fullUrl := c.BaseURL + "/" + strings.TrimLeft(remotePath, "/")

	// 构造 Multipart 表单
	// 虽然 Filer 支持直接 PUT 二进制，但使用 Multipart 兼容性更好
	bodyBuffer := &bytes.Buffer{}
	writer := multipart.NewWriter(bodyBuffer)

	// fileName 主要是为了提取后缀名，具体存什么路径由 URL 决定
	_, fileName := filepath.Split(remotePath)
	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return err
	}

	// 将数据写入表单
	if _, err := io.Copy(part, fileReader); err != nil {
		return err
	}

	// 必须关闭 writer 以写入结尾 boundary
	writer.Close()

	// 发送 POST 请求
	req, err := http.NewRequest("POST", fullUrl, bodyBuffer)
	if err != nil {
		return err
	}
	// 设置 Content-Type (包含 boundary)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return fmt.Errorf("Filer连接失败: %v", err)
	}
	defer resp.Body.Close()

	// 200 OK 或 201 Created 都算成功
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("上传失败，状态码: %d", resp.StatusCode)
	}

	return nil
}

// SeaweedFSExists 检查远程文件是否存在（HEAD 不支持时回退 GET）
func (c *FilerClient) SeaweedFSExists(ctx context.Context, remotePath string) (bool, error) {
	fullUrl := c.BaseURL + "/" + strings.TrimLeft(remotePath, "/")
	req, err := http.NewRequestWithContext(ctx, "HEAD", fullUrl, nil)
	if err != nil {
		return false, err
	}
	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return false, err
	}
	_ = resp.Body.Close()
	if resp.StatusCode == http.StatusOK {
		return true, nil
	}
	if resp.StatusCode == http.StatusMethodNotAllowed {
		req, _ = http.NewRequestWithContext(ctx, "GET", fullUrl, nil)
		resp2, err := c.HttpClient.Do(req)
		if err != nil {
			return false, err
		}
		_ = resp2.Body.Close()
		return resp2.StatusCode == http.StatusOK, nil
	}
	return false, nil
}

// SeaweedFSDownload 下载文件
func (c *FilerClient) SeaweedFSDownload(ctx context.Context, remotePath string) (io.ReadCloser, error) {

	fullUrl := c.BaseURL + "/" + strings.TrimLeft(remotePath, "/")

	req, err := http.NewRequest("GET", fullUrl, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusNotFound {
		resp.Body.Close()
		return nil, fmt.Errorf("文件不存在 (404)")
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("下载失败，状态码: %d", resp.StatusCode)
	}

	return resp.Body, nil
}

// SeaweedFSDelete 删除文件
// remotePath: 文件路径
// recursive: 如果是目录，是否递归删除
func (c *FilerClient) SeaweedFSDelete(remotePath string, recursive bool) error {
	fullUrl := c.BaseURL + "/" + strings.TrimLeft(remotePath, "/")

	if recursive {
		fullUrl += "?recursive=true"
	}

	req, err := http.NewRequest("DELETE", fullUrl, nil)
	if err != nil {
		return err
	}

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Filer 删除成功通常返回 204 No Content 或 200 OK
	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		// 如果文件本身不存在，有时也无需报错，看业务需求
		if resp.StatusCode == http.StatusNotFound {
			return nil
		}
		return fmt.Errorf("删除失败，状态码: %d", resp.StatusCode)
	}

	return nil
}

// listResponse SeaweedFS 目录列表 JSON 响应
type listResponse struct {
	Path    string `json:"Path"`
	Entries []struct {
		FullPath string `json:"FullPath"`
		Mtime    string `json:"Mtime"`
		Mode     int    `json:"Mode"`
	} `json:"Entries"`
	Limit                 int    `json:"Limit"`
	LastFileName          string `json:"LastFileName"`
	ShouldDisplayLoadMore bool   `json:"ShouldDisplayLoadMore"`
}

// SeaweedFSList 列出目录下的子项（文件/子目录）
// remotePath: 目录路径，如 "study_plans/session123"
// 返回子项名称列表（不含路径前缀）
func (c *FilerClient) SeaweedFSList(ctx context.Context, remotePath string) ([]string, error) {
	fullUrl := c.BaseURL + "/" + strings.TrimLeft(remotePath, "/")
	if !strings.HasSuffix(fullUrl, "/") {
		fullUrl += "/"
	}

	req, err := http.NewRequestWithContext(ctx, "GET", fullUrl, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Filer连接失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return []string{}, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("列表失败，状态码: %d", resp.StatusCode)
	}

	var data listResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("解析列表响应失败: %v", err)
	}

	names := make([]string, 0, len(data.Entries))
	basePath := "/" + strings.Trim(strings.TrimSuffix(remotePath, "/"), "/")
	prefix := basePath
	if !strings.HasSuffix(prefix, "/") {
		prefix += "/"
	}
	for _, e := range data.Entries {
		rel := strings.TrimPrefix(e.FullPath, prefix)
		rel = strings.TrimSuffix(rel, "/")
		if idx := strings.Index(rel, "/"); idx >= 0 {
			rel = rel[:idx]
		}
		if rel != "" {
			names = append(names, rel)
		}
	}
	return names, nil
}
