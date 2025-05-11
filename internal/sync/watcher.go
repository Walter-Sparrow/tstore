package sync

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
	"tstore/internal/metadata"
	"tstore/pkg/model"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const stabilityDelay = 1 * time.Second

func StartSyncWatcher(
	ctx context.Context,
	dir string,
	store metadata.Store,
	onDetect func(ctx context.Context, path, name string),
	onRename func(ctx context.Context),
	onRemove func(ctx context.Context),
) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	var (
		mu            sync.Mutex
		timers        = make(map[string]*time.Timer)
		pendingRename string
	)

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

				if ev.Op&fsnotify.Remove != 0 {
					if filepath.Ext(ev.Name) != ".tmp" {
						base := filepath.Base(ev.Name)
						mu.Lock()
						rec, err := store.Get(ctx, base)
						if err == nil {
							rec.State = model.StateCloud
							store.Update(ctx, rec)
							runtime.EventsEmit(ctx, "fileRemoved", base)
							onRemove(ctx)
						}
						mu.Unlock()
					}
					continue
				}

				if ev.Op&(fsnotify.Create|fsnotify.Write|fsnotify.Rename) == 0 {
					continue
				}
				if filepath.Ext(ev.Name) == ".tmp" {
					continue
				}

				info, err := os.Stat(ev.Name)
				if err != nil {
					if ev.Op&fsnotify.Rename == 0 {
						continue
					}
				} else if info.IsDir() {
					continue
				}

				base := filepath.Base(ev.Name)

				mu.Lock()
				if ev.Op&fsnotify.Rename != 0 {
					if _, err := store.Get(ctx, base); err == nil {
						pendingRename = base
					}
					mu.Unlock()
					continue
				}

				if ev.Op&fsnotify.Create != 0 && pendingRename != "" {
					old := pendingRename
					pendingRename = ""
					rec, err := store.Get(ctx, old)
					if err == nil {
						store.Delete(ctx, old)
						rec.Name = base
						if err := store.Create(ctx, rec); err == nil {
							runtime.EventsEmit(ctx, "fileRenamed", old, base)
							onRename(ctx)
						}
					}
					mu.Unlock()
					continue
				}

				if ev.Op&(fsnotify.Create|fsnotify.Write) != 0 {
					if _, err := store.Get(ctx, base); err == nil {
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
						onDetect(ctx, ev.Name, base)
					})
				}
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
