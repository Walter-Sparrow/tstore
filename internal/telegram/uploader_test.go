package telegram

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"tstore/internal/metadata"
)

func TestUploader_UploadFile_WithProgress(t *testing.T) {
	content := []byte("abcdef")
	tmp := t.TempDir()
	origDir := filepath.Join(tmp, "orig")
	syncDir := filepath.Join(tmp, "sync")
	if err := os.MkdirAll(origDir, 0o700); err != nil {
		t.Fatalf("mkdir origDir: %v", err)
	}
	filename := "small.txt"
	origPath := filepath.Join(origDir, filename)
	if err := os.WriteFile(origPath, content, 0o600); err != nil {
		t.Fatalf("write source file: %v", err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/sendDocument" {
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		if err := r.ParseMultipartForm(1 << 20); err != nil {
			t.Fatalf("ParseMultipartForm failed: %v", err)
		}

		if got := r.FormValue("chat_id"); got != "123" {
			t.Errorf("chat_id = %q; want %q", got, "123")
		}

		part, header, err := r.FormFile("document")
		if err != nil {
			t.Fatalf("FormFile: %v", err)
		}

		defer part.Close()
		data, err := io.ReadAll(part)
		if err != nil {
			t.Fatalf("read part: %v", err)
		}

		var idx int
		if _, err := fmt.Sscanf(header.Filename, "chunk_%d", &idx); err != nil {
			t.Fatalf("invalid filename %q: %v", header.Filename, err)
		}

		var want []byte
		if idx == 0 {
			want = content[0:4]
		} else {
			want = content[4:]
		}
		if !bytes.Equal(data, want) {
			t.Errorf("chunk %d data = %q; want %q", idx, data, want)
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"ok":true,"result":{"document":{"file_id":"fid_%d"}}}`, idx)
	}))
	defer srv.Close()

	client := &Client{baseURL: srv.URL, client: srv.Client()}
	storePath := filepath.Join(tmp, "meta.json")
	store, err := metadata.NewJSONStore(storePath)
	if err != nil {
		t.Fatalf("NewJSONStore: %v", err)
	}
	u := NewUploader(client, store, syncDir, 4)

	var progresses []float64
	progressFn := func(p float64) {
		progresses = append(progresses, p)
	}

	ctx := context.Background()
	rec, err := u.UploadFile(ctx, origPath, "123", progressFn)
	if err != nil {
		t.Fatalf("UploadFile returned error: %v", err)
	}

	if rec.Name != filename {
		t.Errorf("Name = %q; want %q", rec.Name, filename)
	}
	if rec.Size != int64(len(content)) {
		t.Errorf("Size = %d; want %d", rec.Size, len(content))
	}
	sum := sha256.Sum256(content)
	wantChecksum := hex.EncodeToString(sum[:])
	if rec.Checksum != wantChecksum {
		t.Errorf("Checksum = %q; want %q", rec.Checksum, wantChecksum)
	}

	wantIDs := []string{"fid_0", "fid_1"}
	if !reflect.DeepEqual(rec.ChunkIds, wantIDs) {
		t.Errorf("ChunkIds = %v; want %v", rec.ChunkIds, wantIDs)
	}

	if len(progresses) != 2 {
		t.Fatalf("progress callbacks = %d; want 2", len(progresses))
	}
	if got, want := progresses[0], 100*4.0/6.0; got < want-0.1 || got > want+0.1 {
		t.Errorf("first progress = %.2f; want ~%.2f", got, want)
	}
	if got, want := progresses[1], 100.0; got < want-0.1 || got > want+0.1 {
		t.Errorf("second progress = %.2f; want ~100.00", got)
	}

	if _, err := os.Stat(origPath); !os.IsNotExist(err) {
		t.Errorf("expected original file removed: %v", err)
	}
	syncedPath := filepath.Join(syncDir, filename)
	data2, err := os.ReadFile(syncedPath)
	if err != nil {
		t.Fatalf("read moved file: %v", err)
	}
	if !bytes.Equal(data2, content) {
		t.Errorf("moved file content = %q; want %q", data2, content)
	}

	stored, err := store.Get(ctx, filename)
	if err != nil {
		t.Fatalf("store.Get: %v", err)
	}

	stored.UploadedAt = rec.UploadedAt
	if !reflect.DeepEqual(stored, rec) {
		t.Errorf("stored record = %+v; want %+v", stored, rec)
	}
}
