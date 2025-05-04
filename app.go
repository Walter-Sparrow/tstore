package main

import (
	"context"
	"fmt"
	"os"
	"tstore/internal/config"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
	cfg *config.Config
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
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

func (a *App) UpdateConfig(newCfg *config.Config) error {
	info, err := os.Stat(newCfg.SyncFolder)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("sync folder %q does not exist", newCfg.SyncFolder)
		}
		return fmt.Errorf("cannot access sync folder %q: %w", newCfg.SyncFolder, err)
	}

	if !info.IsDir() {
		return fmt.Errorf("sync folder %q is not a directory", newCfg.SyncFolder)
	}

	a.cfg = newCfg
	if err := config.SaveConfig(a.cfg); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	return nil
}

func (a *App) GetConfig() *config.Config {
	return a.cfg
}
