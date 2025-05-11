package sync

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
	"tstore/internal/metadata"

	"github.com/fsnotify/fsnotify"
)

const stabilityDelay = 1 * time.Second

func StartSyncWatcher(
	ctx context.Context,
	dir string,
	store metadata.Store,
	onDetect func(ctx context.Context, path, name string),
) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	timers := make(map[string]*time.Timer)
	var mu sync.Mutex

	go func() {
		defer watcher.Close()
		for {
			select {
			case <-ctx.Done():
				return
			case ev, ok := <-watcher.Events:
				if !ok {
					return
				}

				if ev.Op&(fsnotify.Create|fsnotify.Write) == 0 {
					continue
				}

				if filepath.Ext(ev.Name) == ".tmp" {
					continue
				}

				info, err := os.Stat(ev.Name)
				if err != nil || info.IsDir() {
					continue
				}

				name := filepath.Base(ev.Name)

				mu.Lock()
				if _, err := store.Get(ctx, name); err == nil {
					mu.Unlock()
					continue
				}

				if t, ok := timers[ev.Name]; ok {
					t.Stop()
				}
				timers[ev.Name] = time.AfterFunc(stabilityDelay, func() {
					mu.Lock()
					delete(timers, ev.Name)
					mu.Unlock()
					name := filepath.Base(ev.Name)
					onDetect(ctx, ev.Name, name)
				})
				mu.Unlock()

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Printf("watcher error: %v", err)
			}
		}
	}()

	return watcher.Add(dir)
}
