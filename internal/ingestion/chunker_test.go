package ingestion

import (
	"bytes"
	"errors"
	"reflect"
	"slices"
	"testing"
)

func collectChunks(ch <-chan Chunk) []Chunk {
	var out []Chunk
	for c := range ch {
		dataCopy := slices.Clone(c.Data)
		out = append(out, Chunk{Index: c.Index, Data: dataCopy})
	}
	return out
}

type errorReader struct {
	data []byte
	pos  int
	err  error
}

func (r *errorReader) Read(p []byte) (int, error) {
	if r.pos >= len(r.data) {
		return 0, r.err
	}
	n := copy(p, r.data[r.pos:])
	r.pos += n
	return n, nil
}

func TestStreamChunks_PartialLastChunk(t *testing.T) {
	content := []byte("abcdefgh")
	r := bytes.NewReader(content)

	chunksCh, errCh := StreamChunks(r, 3)
	chunks := collectChunks(chunksCh)
	if err := <-errCh; err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := []Chunk{
		{Index: 0, Data: []byte("abc")},
		{Index: 1, Data: []byte("def")},
		{Index: 2, Data: []byte("gh")},
	}
	if !reflect.DeepEqual(chunks, want) {
		t.Errorf("chunks = %+v; want %+v", chunks, want)
	}
}

func TestStreamChunks_ExactMultiple(t *testing.T) {
	content := []byte("0123456789")
	r := bytes.NewReader(content)

	chunksCh, errCh := StreamChunks(r, 5)
	chunks := collectChunks(chunksCh)
	if err := <-errCh; err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := []Chunk{
		{Index: 0, Data: []byte("01234")},
		{Index: 1, Data: []byte("56789")},
	}
	if !reflect.DeepEqual(chunks, want) {
		t.Errorf("chunks = %+v; want %+v", chunks, want)
	}
}

func TestStreamChunks_EmptyReader(t *testing.T) {
	content := []byte{}
	r := bytes.NewReader(content)

	chunksCh, errCh := StreamChunks(r, 4)
	chunks := collectChunks(chunksCh)
	if err := <-errCh; err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(chunks) != 0 {
		t.Errorf("expected 0 chunks for empty reader, got %d", len(chunks))
	}
}

func TestStreamChunks_ReaderError(t *testing.T) {
	errExpected := errors.New("simulated read error")
	r := &errorReader{data: []byte("abcde"), err: errExpected}

	chunksCh, errCh := StreamChunks(r, 3)
	chunks := collectChunks(chunksCh)

	if len(chunks) != 1 {
		t.Errorf("expected 1 chunks before error, got %d", len(chunks))
	}

	err := <-errCh
	if err != errExpected {
		t.Errorf("error = %v; want %v", err, errExpected)
	}
}
