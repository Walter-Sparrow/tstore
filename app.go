package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"
	"tstore/internal/config"
	"tstore/internal/metadata"
	"tstore/internal/telegram"
	"tstore/pkg/model"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx            context.Context
	cfg            *config.Config
	uploader       *telegram.Uploader
	client         *telegram.Client
	store          metadata.Store
	backupTickerMu sync.Mutex
	backupTimer    *time.Timer
}

const DEBOUNCE_DURATION = time.Minute

func (a *App) initServices() error {
	newCfg, err := config.LoadConfig()
	if err != nil {
		return fmt.Errorf("loading config: %w", err)
	}
	a.cfg = newCfg

	a.client = telegram.NewClient(a.cfg.BotToken)
	if a.store == nil {
		a.store, err = metadata.NewDefaultJSONStore()
		if err != nil {
			return fmt.Errorf("init metadata store: %w", err)
		}
	}

	const chunkSize = 5 * 1024 * 1024
	a.uploader = telegram.NewUploader(a.client, a.store, a.cfg.SyncFolder, chunkSize)

	return nil
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := a.initServices(); err != nil {
		log.Fatalf("failed to init services: %v", err)
	}

	fileID, err := a.client.GetPinnedFileID(ctx, a.cfg.ChatID)
	if err != nil {
		log.Printf("failed to get pinned file ID: %v", err)
		return
	}

	reader, err := a.client.DownloadFile(ctx, fileID)
	if err != nil {
		log.Fatalf("failed to download file: %v", err)
	}
	defer reader.Close()

	if err := a.store.Load(ctx, reader); err != nil {
		log.Fatalf("failed to load metadata: %v", err)
	}
}

func (a *App) shutdown(ctx context.Context) {
	a.backupTickerMu.Lock()
	timer := a.backupTimer
	a.backupTimer = nil
	a.backupTickerMu.Unlock()

	if timer != nil {
		timer.Stop()
		if err := a.uploader.BackupMetadata(a.ctx, a.cfg.ChatID); err != nil {
			log.Printf("final metadata backup failed: %v", err)
		}
	}
}

func (a *App) Minimize() {
	runtime.WindowMinimise(a.ctx)
}

func (a *App) ToggleFullscreen() {
	runtime.WindowToggleMaximise(a.ctx)
}

func (a *App) Close() {
	runtime.Quit(a.ctx)
}

func (a *App) SelectDirectory() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:                "Choose a Folder",
		DefaultDirectory:     "",
		CanCreateDirectories: true,
		ShowHiddenFiles:      false,
	})

	if err != nil {
		return "", err
	}

	return dir, nil
}

func (a *App) SelectFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:                "Choose a File",
		DefaultDirectory:     "",
		CanCreateDirectories: false,
		ShowHiddenFiles:      false,
	})

	if err != nil {
		return "", err
	}

	return file, nil
}

func (a *App) UpdateConfig(newCfg *config.Config) error {
	if err := a.validateAndSaveConfig(newCfg); err != nil {
		return err
	}

	if err := a.initServices(); err != nil {
		return err
	}

	return nil
}

func (a *App) validateAndSaveConfig(newCfg *config.Config) error {
	if info, err := os.Stat(newCfg.SyncFolder); err != nil || !info.IsDir() {
		return fmt.Errorf("invalid sync_folder %q", newCfg.SyncFolder)
	}

	if err := config.SaveConfig(newCfg); err != nil {
		return fmt.Errorf("saving config: %w", err)
	}

	return nil
}

func (a *App) GetConfig() *config.Config {
	return a.cfg
}

func (a *App) UploadFile(path string) (string, error) {
	rec, err := a.uploader.UploadFile(a.ctx, path, a.cfg.ChatID, func(p float64) {
		runtime.EventsEmit(a.ctx, "uploadProgress", p)
	})

	if err != nil {
		return "", err
	}

	return rec.Name, nil
}

func (a *App) GetFilesMetadata() ([]*model.FileRecord, error) {
	return a.store.List(a.ctx)
}

func (a *App) OffloadFile(name string) error {
	return a.uploader.OffloadFile(a.ctx, name, a.cfg.ChatID)
}

func (a *App) DownloadFile(name string) error {
	return a.uploader.DownloadFile(a.ctx, name, a.cfg.ChatID, func(p float64) {
		runtime.EventsEmit(a.ctx, fmt.Sprintf("downloadProgress/%s", name), p)
	})
}

func (a *App) UpdateDescription(name, description string) error {
	rec, err := a.store.Get(a.ctx, name)
	if err != nil {
		return fmt.Errorf("lookup %q: %w", name, err)
	}

	rec.Description = description
	if err := a.store.Update(a.ctx, rec); err != nil {
		return fmt.Errorf("update metadata: %w", err)
	}

	a.scheduleBackup()
	return nil
}

func (a *App) scheduleBackup() {
	a.backupTickerMu.Lock()
	defer a.backupTickerMu.Unlock()

	if a.backupTimer != nil {
		a.backupTimer.Stop()
	}
	a.backupTimer = time.AfterFunc(DEBOUNCE_DURATION, func() {
		a.backupTickerMu.Lock()
		a.backupTimer = nil
		a.backupTickerMu.Unlock()

		if err := a.uploader.BackupMetadata(a.ctx, a.cfg.ChatID); err != nil {
			log.Printf("metadata backup failed: %v", err)
		} else {
			log.Println("metadata backed up successfully")
		}
	})
}

func (a *App) DeleteFile(name string) error {
	return a.uploader.DeleteFile(a.ctx, name, a.cfg.ChatID)
}
