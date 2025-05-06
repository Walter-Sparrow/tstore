package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
)

type Client struct {
	token   string
	baseURL string
	client  *http.Client
}

func NewClient(token string) *Client {
	return &Client{
		token:   token,
		baseURL: fmt.Sprintf("https://api.telegram.org/bot%s", token),
		client:  http.DefaultClient,
	}
}

func (c *Client) SendText(ctx context.Context, chatID int64, text string) (messageID int, err error) {
	endpoint := fmt.Sprintf("%s/sendMessage", c.baseURL)
	form := url.Values{}
	form.Set("chat_id", fmt.Sprintf("%d", chatID))
	form.Set("text", text)

	resp, err := c.client.PostForm(endpoint, form)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	var res struct {
		OK     bool `json:"ok"`
		Result struct {
			MessageID int `json:"message_id"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return 0, err
	}
	if !res.OK {
		return 0, fmt.Errorf("telegram API error sending text")
	}
	return res.Result.MessageID, nil
}

func (c *Client) SendChunk(ctx context.Context, chatID string, chunk io.Reader, chunkIndex int) (fileID string, err error) {
	url := fmt.Sprintf("%s/sendDocument", c.baseURL)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("document", fmt.Sprintf("chunk_%d", chunkIndex))
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, chunk); err != nil {
		return "", err
	}
	writer.WriteField("chat_id", chatID)
	writer.Close()

	req, err := http.NewRequestWithContext(ctx, "POST", url, body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var res struct {
		OK     bool `json:"ok"`
		Result struct {
			Document struct {
				FileID string `json:"file_id"`
			}
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}
	if !res.OK {
		return "", fmt.Errorf("telegram API error sending chunk")
	}
	return res.Result.Document.FileID, nil
}

func (c *Client) DownloadFile(ctx context.Context, fileID string) (io.ReadCloser, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/getFile", c.baseURL), nil)
	if err != nil {
		return nil, err
	}
	q := req.URL.Query()
	q.Set("file_id", fileID)
	req.URL.RawQuery = q.Encode()

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var meta struct {
		OK     bool `json:"ok"`
		Result struct {
			FilePath string `json:"file_path"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&meta); err != nil {
		return nil, err
	}
	if !meta.OK {
		return nil, fmt.Errorf("telegram API error getting file path")
	}

	downloadURL := fmt.Sprintf("%s/file/%s", c.baseURL, meta.Result.FilePath)
	req2, err := http.NewRequestWithContext(ctx, "GET", downloadURL, nil)
	if err != nil {
		return nil, err
	}
	resp2, err := c.client.Do(req2)
	if err != nil {
		return nil, err
	}
	if resp2.StatusCode != http.StatusOK {
		resp2.Body.Close()
		return nil, fmt.Errorf("unexpected status: %s", resp2.Status)
	}
	return resp2.Body, nil
}
