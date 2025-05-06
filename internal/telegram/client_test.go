package telegram

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSendChunkDownloadAndSendText(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/botTOKEN/sendMessage", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := r.ParseForm(); err != nil {
			t.Fatalf("ParseForm failed: %v", err)
		}
		if r.FormValue("text") != "hello" {
			t.Errorf("expected text 'hello', got '%s'", r.FormValue("text"))
		}
		io.WriteString(w, `{"ok":true,"result":{"message_id":99}}`)
	})
	server := httptest.NewServer(mux)
	defer server.Close()

	client := &Client{
		token:   "TOKEN",
		baseURL: server.URL + "/botTOKEN",
		client:  server.Client(),
	}

	txtMsgID, err := client.SendText(context.Background(), 123, "hello")
	if err != nil {
		t.Fatalf("SendText failed: %v", err)
	}
	if txtMsgID != 99 {
		t.Errorf("expected text message ID 99, got %d", txtMsgID)
	}
}

func TestSendChunk(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.URL.Path != "/sendDocument" {
			t.Errorf("expected path /sendDocument, got %s", r.URL.Path)
		}

		if err := r.ParseMultipartForm(10 << 20); err != nil {
			t.Fatalf("failed to parse multipart form: %v", err)
		}

		if got := r.FormValue("chat_id"); got != "12345" {
			t.Errorf("expected chat_id=12345, got %q", got)
		}

		file, header, err := r.FormFile("document")
		if err != nil {
			t.Fatalf("expected form file 'document', got error: %v", err)
		}
		defer file.Close()

		data, err := io.ReadAll(file)
		if err != nil {
			t.Fatalf("failed to read uploaded chunk: %v", err)
		}
		if string(data) != "chunk data" {
			t.Errorf("expected chunk data to be %q, got %q", "chunk data", string(data))
		}
		if header.Filename != "chunk_7" {
			t.Errorf("expected filename chunk_7, got %q", header.Filename)
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"ok":true,"result":{"document":{"file_id":"FILE_ID_7"}}}`)
	}))
	defer srv.Close()

	c := &Client{
		baseURL: srv.URL,
		client:  srv.Client(),
	}

	fileID, err := c.SendChunk(context.Background(), "12345", bytes.NewBufferString("chunk data"), 7)
	if err != nil {
		t.Fatalf("SendChunk returned error: %v", err)
	}
	if fileID != "FILE_ID_7" {
		t.Errorf("expected file ID FILE_ID_7, got %q", fileID)
	}
}

func TestDownloadFile(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/getFile":
			if got := r.URL.Query().Get("file_id"); got != "FILE_ID_7" {
				t.Errorf("expected file_id=FILE_ID_7, got %q", got)
			}
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprint(w, `{"ok":true,"result":{"file_path":"files/testfile.txt"}}`)

		case "/file/files/testfile.txt":
			w.Header().Set("Content-Type", "application/octet-stream")
			fmt.Fprint(w, "file content")

		default:
			t.Fatalf("unexpected request to %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	c := &Client{
		baseURL: srv.URL,
		client:  srv.Client(),
	}

	rc, err := c.DownloadFile(context.Background(), "FILE_ID_7")
	if err != nil {
		t.Fatalf("DownloadFile returned error: %v", err)
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		t.Fatalf("reading downloaded data failed: %v", err)
	}
	if got, want := string(data), "file content"; got != want {
		t.Errorf("downloaded content = %q; want %q", got, want)
	}
}
