package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
)

type Client struct {
	token   string
	baseURL string
	fileURL string
	client  *http.Client
}

func NewClient(token string) *Client {
	return &Client{
		token:   token,
		baseURL: fmt.Sprintf("https://api.telegram.org/bot%s", token),
		fileURL: fmt.Sprintf("https://api.telegram.org/file/bot%s", token),
		client:  http.DefaultClient,
	}
}

func (c *Client) SendText(ctx context.Context, chatID string, text string) (messageID int, err error) {
	endpoint := fmt.Sprintf("%s/sendMessage", c.baseURL)
	form := url.Values{}
	form.Set("chat_id", chatID)
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

func (c *Client) SendFile(ctx context.Context, chatID string, localPath string, caption string) (messageID int, fileID string, err error) {
	f, err := os.Open(localPath)
	if err != nil {
		return 0, "", fmt.Errorf("open %q: %w", localPath, err)
	}
	defer f.Close()

	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	field, err := w.CreateFormFile("document", filepath.Base(localPath))
	if err != nil {
		return 0, "", fmt.Errorf("create form file: %w", err)
	}
	if _, err := io.Copy(field, f); err != nil {
		return 0, "", fmt.Errorf("copy file data: %w", err)
	}

	if err := w.WriteField("chat_id", chatID); err != nil {
		return 0, "", fmt.Errorf("write chat_id: %w", err)
	}
	if caption != "" {
		if err := w.WriteField("caption", caption); err != nil {
			return 0, "", fmt.Errorf("write caption: %w", err)
		}
	}
	w.Close()

	url := fmt.Sprintf("%s/sendDocument", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, &b)
	if err != nil {
		return 0, "", fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	resp, err := c.client.Do(req)
	if err != nil {
		return 0, "", fmt.Errorf("http do: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, "", fmt.Errorf("read resp body: %w", err)
	}

	var res struct {
		OK     bool `json:"ok"`
		Result struct {
			MessageID int `json:"message_id"`
			Document  struct {
				FileID string `json:"file_id"`
			} `json:"document"`
		} `json:"result"`
	}
	if err := json.Unmarshal(respBytes, &res); err != nil {
		return 0, "", fmt.Errorf("unmarshal response %q: %w", string(respBytes), err)
	}
	if !res.OK {
		return 0, "", fmt.Errorf("telegram error: %s", string(respBytes))
	}

	return res.Result.MessageID, res.Result.Document.FileID, nil
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

	downloadURL := fmt.Sprintf("%s/%s", c.fileURL, meta.Result.FilePath)
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

func (c *Client) DownloadChunks(ctx context.Context, fileIDs []string, dstPath string) error {
	if err := os.MkdirAll(filepath.Dir(dstPath), 0o700); err != nil {
		return fmt.Errorf("create parent dirs for %q: %w", dstPath, err)
	}

	tmpPath := dstPath + ".tmp"
	f, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o600)
	if err != nil {
		return fmt.Errorf("open temp file %q: %w", tmpPath, err)
	}
	defer f.Close()

	for _, fileID := range fileIDs {
		rc, err := c.DownloadFile(ctx, fileID)
		if err != nil {
			os.Remove(tmpPath)
			return fmt.Errorf("download chunk %q: %w", fileID, err)
		}
		_, err = io.Copy(f, rc)
		rc.Close()
		if err != nil {
			os.Remove(tmpPath)
			return fmt.Errorf("write chunk %q to %q: %w", fileID, tmpPath, err)
		}
	}

	if err := f.Sync(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("sync temp file %q: %w", tmpPath, err)
	}
	if err := f.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("close temp file %q: %w", tmpPath, err)
	}

	if err := os.Rename(tmpPath, dstPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("rename %q to %q: %w", tmpPath, dstPath, err)
	}

	return nil
}

func (c *Client) PinChatMessage(ctx context.Context, chatID string, messageID int, disableNotification bool) error {
	url := fmt.Sprintf("%s/pinChatMessage", c.baseURL)

	payload := map[string]any{
		"chat_id":              chatID,
		"message_id":           messageID,
		"disable_notification": disableNotification,
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal pinChatMessage payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("new pinChatMessage request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("pinChatMessage HTTP request: %w", err)
	}
	defer resp.Body.Close()

	var respData struct {
		OK          bool   `json:"ok"`
		Description string `json:"description,omitempty"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&respData); err != nil {
		return fmt.Errorf("decode pinChatMessage response: %w", err)
	}
	if !respData.OK {
		return fmt.Errorf("telegram API error pinning message: %s", respData.Description)
	}

	return nil
}

func (c *Client) UnpinChatMessage(ctx context.Context, chatID string, messageID int) error {
	url := fmt.Sprintf("%s/unpinChatMessage", c.baseURL)

	payload := map[string]any{
		"chat_id":    chatID,
		"message_id": messageID,
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal unpinChatMessage payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("new unpinChatMessage request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("unpinChatMessage HTTP request: %w", err)
	}
	defer resp.Body.Close()

	var respData struct {
		OK          bool   `json:"ok"`
		Description string `json:"description,omitempty"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&respData); err != nil {
		return fmt.Errorf("decode unpinChatMessage response: %w", err)
	}
	if !respData.OK {
		return fmt.Errorf("telegram API error unpinning message: %s", respData.Description)
	}
	return nil
}

func (c *Client) GetPinnedFileID(ctx context.Context, chatID string) (string, error) {
	url := fmt.Sprintf("%s/getChat?chat_id=%s", c.baseURL, chatID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("new getChat request: %w", err)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("getChat HTTP request: %w", err)
	}
	defer resp.Body.Close()

	var payload struct {
		OK     bool `json:"ok"`
		Result struct {
			PinnedMessage *struct {
				Document *struct {
					FileID string `json:"file_id"`
				} `json:"document"`
			} `json:"pinned_message"`
		} `json:"result"`
		Description string `json:"description,omitempty"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("decode getChat response: %w", err)
	}
	if !payload.OK {
		return "", fmt.Errorf("telegram API error in getChat: %s", payload.Description)
	}

	pm := payload.Result.PinnedMessage
	if pm == nil || pm.Document == nil {
		return "", errors.New("no pinned message with a document found")
	}

	return pm.Document.FileID, nil
}
