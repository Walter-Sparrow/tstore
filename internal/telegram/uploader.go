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

type progressReader struct {
	r          io.Reader
	total      int64
	done       *int64
	onProgress ProgressFn
}

func (pr *progressReader) Read(p []byte) (n int, err error) {
	n, err = pr.r.Read(p)
	if n > 0 {
		*pr.done += int64(n)
		pr.onProgress(float64(*pr.done) / float64(pr.total) * 100)
	}
	return
}

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

func (u *Uploader) backupMetadata(ctx context.Context, chatID string) error {
	msgID, _, err := u.Client.SendFile(ctx, chatID, u.Store.Path(), "metadata backup")
	if err != nil {
		return fmt.Errorf("sending metadata backup: %w", err)
	}
	if err := u.Client.PinChatMessage(ctx, chatID, msgID, true); err != nil {
		return fmt.Errorf("pinning metadata backup: %w", err)
	}

	return nil
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
		State:       model.StateLocal,
		Description: "",
		Size:        fileSize,
		Checksum:    checksum,
		UploadedAt:  time.Now(),
		ChunkIds:    chunkIDs,
	}
	if err := u.Store.Create(ctx, rec); err != nil {
		return nil, fmt.Errorf("save metadata: %w", err)
	}

	if err := u.backupMetadata(ctx, chatID); err != nil {
		return nil, fmt.Errorf("backup metadata: %w", err)
	}

	return rec, nil
}

func (u *Uploader) OffloadFile(ctx context.Context, name string, chatID string) error {
	rec, err := u.Store.Get(ctx, name)
	if err != nil {
		return fmt.Errorf("lookup %q: %w", name, err)
	}

	localPath := filepath.Join(u.SyncFolder, rec.Name)
	if err := os.Remove(localPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove local file: %w", err)
	}

	rec.State = model.StateCloud
	if err := u.Store.Update(ctx, rec); err != nil {
		return fmt.Errorf("update local metadata: %w", err)
	}

	if err := u.backupMetadata(ctx, chatID); err != nil {
		rec.State = model.StateLocal
		_ = u.Store.Update(ctx, rec)
		return err
	}

	return nil
}

func (u *Uploader) DownloadFile(
	ctx context.Context,
	name string,
	chatID string,
	onProgress ProgressFn,
) error {
	rec, err := u.Store.Get(ctx, name)
	if err != nil {
		return fmt.Errorf("lookup %q: %w", name, err)
	}

	totalSize := rec.Size
	if totalSize <= 0 {
		return fmt.Errorf("invalid total size %d", totalSize)
	}

	dstPath := filepath.Join(u.SyncFolder, rec.Name)
	tmpPath := dstPath + ".tmp"
	if err := os.MkdirAll(filepath.Dir(dstPath), 0o700); err != nil {
		return fmt.Errorf("create sync folder: %w", err)
	}
	out, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o600)
	if err != nil {
		return fmt.Errorf("open temp file: %w", err)
	}
	defer out.Close()

	var downloaded int64
	for _, fileID := range rec.ChunkIds {
		rc, err := u.Client.DownloadFile(ctx, fileID)
		if err != nil {
			os.Remove(tmpPath)
			return fmt.Errorf("download chunk %q: %w", fileID, err)
		}

		pr := &progressReader{
			r:          rc,
			total:      totalSize,
			done:       &downloaded,
			onProgress: onProgress,
		}

		if _, err := io.Copy(out, pr); err != nil {
			rc.Close()
			os.Remove(tmpPath)
			return fmt.Errorf("assemble chunk %q: %w", fileID, err)
		}
		rc.Close()
	}

	if err := out.Sync(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("sync temp file: %w", err)
	}
	if err := out.Close(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("close temp file: %w", err)
	}
	if err := os.Rename(tmpPath, dstPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("rename to final file: %w", err)
	}

	rec.State = model.StateLocal
	if err := u.Store.Update(ctx, rec); err != nil {
		return fmt.Errorf("update metadata: %w", err)
	}

	if err := u.backupMetadata(ctx, chatID); err != nil {
		rec.State = model.StateLocal
		_ = u.Store.Update(ctx, rec)
		return err
	}

	return nil
}
