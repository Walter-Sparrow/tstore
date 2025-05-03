package ingestion

import (
	"bytes"
	"os"
	"testing"
)

func TestStreamChunks(t *testing.T) {
	content := []byte("abcdefghijklmnopqrstuvwxyz")
	tmpFile, err := os.CreateTemp("", "stream_test")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.Write(content); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}
	tmpFile.Close()

	const chunkSize = 5
	var dataCollected []byte
	count := 0
	err = StreamChunks(tmpFile.Name(), chunkSize, func(index int, data []byte) error {
		if index != count {
			t.Errorf("expected chunk index %d, got %d", count, index)
		}
		dataCollected = append(dataCollected, data...)
		count++
		return nil
	})
	if err != nil {
		t.Fatalf("StreamChunks returned error: %v", err)
	}

	if !bytes.Equal(dataCollected, content) {
		t.Errorf("streamed data mismatch: expected %q, got %q", content, dataCollected)
	}

	expectedChunks := (len(content) + chunkSize - 1) / chunkSize
	if count != expectedChunks {
		t.Errorf("expected %d chunks, got %d", expectedChunks, count)
	}
}
