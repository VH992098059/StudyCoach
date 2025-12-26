package FilerMode

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

// FilerClient 封装 SeaweedFS Filer 的操作
type FilerClient struct {
	BaseURL    string       // Filer 地址，例如 http://localhost:8888
	HttpClient *http.Client // HTTP 客户端
}

// NewFilerClient 初始化客户端
// endpoint: Filer 的地址，如 "http://192.168.1.100:8888"
func NewFilerClient(endpoint string) *FilerClient {
	return &FilerClient{
		BaseURL: strings.TrimRight(endpoint, "/"),
		HttpClient: &http.Client{
			Timeout: 30 * time.Second, // 设置超时，防止请求卡死
		},
	}
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
