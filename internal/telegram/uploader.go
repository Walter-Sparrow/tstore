package telegram

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
	"tstore/internal/ingestion"
	"tstore/internal/metadata"
	"tstore/internal/sync"
	"tstore/pkg/model"
)

type ProgressFn func(percent float64)

type Uploader struct {
	Client     *Client
	Store      metadata.Store
	SyncFolder string
	ChunkSize  int64
}

func NewUploader(client *Client, store metadata.Store, syncFolder string, chunkSize int64) *Uploader {
	return &Uploader{
		Client:     client,
		Store:      store,
		SyncFolder: syncFolder,
		ChunkSize:  chunkSize,
	}
}

func (u *Uploader) UploadFile(
	ctx context.Context,
	filePath string,
	chatID string,
	onProgress ProgressFn,
) (*model.FileRecord, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("open file %q: %w", filePath, err)
	}

	info, err := f.Stat()
	if err != nil {
		return nil, fmt.Errorf("stat file %q: %w", filePath, err)
	}
	fileSize := info.Size()
	fileName := info.Name()

	hasher := sha256.New()
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("seek for chunking: %w", err)
	}

	chunksCh, errCh := ingestion.StreamChunks(f, u.ChunkSize)
	var (
		chunkIDs []string
		uploaded int64
	)

	for chunk := range chunksCh {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		hasher.Write(chunk.Data)
		reader := bytes.NewReader(chunk.Data)
		fileID, err := u.Client.SendChunk(ctx, chatID, reader, chunk.Index)
		if err != nil {
			return nil, fmt.Errorf("send chunk %d: %w", chunk.Index, err)
		}
		chunkIDs = append(chunkIDs, fileID)

		uploaded += int64(len(chunk.Data))
		if onProgress != nil {
			percent := (float64(uploaded) / float64(fileSize)) * 100
			onProgress(percent)
		}
	}
	if err := <-errCh; err != nil {
		return nil, fmt.Errorf("chunking error: %w", err)
	}

	f.Close()
	dstPath := filepath.Join(u.SyncFolder, fileName)
	if err := sync.MoveFile(filePath, dstPath); err != nil {
		return nil, fmt.Errorf("move file to sync folder: %w", err)
	}

	checksum := hex.EncodeToString(hasher.Sum(nil))
	rec := &model.FileRecord{
		Name:        fileName,
		State:       model.StateCloud,
		Description: "",
		Size:        fileSize,
		Checksum:    checksum,
		UploadedAt:  time.Now(),
		ChunkIds:    chunkIDs,
	}
	if err := u.Store.Create(ctx, rec); err != nil {
		return nil, fmt.Errorf("save metadata: %w", err)
	}

	return rec, nil
}
