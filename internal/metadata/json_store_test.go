package metadata

import (
	"context"
	"path/filepath"
	"reflect"
	"testing"
	"time"
	"tstore/pkg/model"
)

func TestJSONStore_CRUD_List_Persistence(t *testing.T) {
	tmpDir := t.TempDir()
	storePath := filepath.Join(tmpDir, "metadata.json")

	store, err := NewJSONStore(storePath)
	if err != nil {
		t.Fatalf("NewJSONStore failed: %v", err)
	}

	ctx := context.Background()
	ts := time.Date(2025, 5, 6, 15, 30, 0, 0, time.UTC)

	rec1 := &model.FileRecord{
		Name:        "file1.txt",
		State:       model.StateLocal,
		Description: "first file",
		Size:        123,
		Checksum:    "abc123",
		UploadedAt:  ts,
		ChunkIds:    []string{"c1"},
	}

	rec2 := &model.FileRecord{
		Name:        "file2.txt",
		State:       model.StateCloud,
		Description: "second file",
		Size:        456,
		Checksum:    "def456",
		UploadedAt:  ts,
		ChunkIds:    []string{"x", "y"},
	}

	// --- Create & Get ---
	if err := store.Create(ctx, rec1); err != nil {
		t.Fatalf("Create(rec1) failed: %v", err)
	}

	got1, err := store.Get(ctx, rec1.Name)
	if err != nil {
		t.Fatalf("Get(rec1) failed: %v", err)
	}

	if !reflect.DeepEqual(got1, rec1) {
		t.Errorf("Get(rec1) = %+v; want %+v", got1, rec1)
	}

	if err := store.Create(ctx, rec1); err != ErrAlreadyExists {
		t.Errorf("Create(rec1) second time: got %v; want ErrAlreadyExists", err)
	}

	// --- Add second record & List ---
	if err := store.Create(ctx, rec2); err != nil {
		t.Fatalf("Create(rec2) failed: %v", err)
	}

	list, err := store.List(ctx)
	if err != nil {
		t.Fatalf("List() failed: %v", err)
	}

	if len(list) != 2 {
		t.Fatalf("List length = %d; want 2", len(list))
	}

	names := map[string]bool{list[0].Name: true, list[1].Name: true}
	if !names[rec1.Name] || !names[rec2.Name] {
		t.Errorf("List names = %v; want contains %q and %q", names, rec1.Name, rec2.Name)
	}

	// --- Update ---
	rec1Updated := *rec1
	rec1Updated.Description = "updated desc"
	if err := store.Update(ctx, &rec1Updated); err != nil {
		t.Fatalf("Update(rec1) failed: %v", err)
	}

	got1u, _ := store.Get(ctx, rec1.Name)
	if got1u.Description != "updated desc" {
		t.Errorf("After Update, Description = %q; want %q", got1u.Description, "updated desc")
	}

	if err := store.Update(ctx, &model.FileRecord{Name: "nope"}); err != ErrNotFound {
		t.Errorf("Update(nonexistent) = %v; want ErrNotFound", err)
	}

	// --- Delete ---
	if err := store.Delete(ctx, rec2.Name); err != nil {
		t.Fatalf("Delete(rec2) failed: %v", err)
	}

	if _, err := store.Get(ctx, rec2.Name); err != ErrNotFound {
		t.Errorf("Get(rec2) after Delete = %v; want ErrNotFound", err)
	}

	if err := store.Delete(ctx, "nope"); err != ErrNotFound {
		t.Errorf("Delete(nonexistent) = %v; want ErrNotFound", err)
	}

	// --- Persistence ---
	store2, err := NewJSONStore(storePath)
	if err != nil {
		t.Fatalf("Re-open NewJSONStore failed: %v", err)
	}

	got1p, err := store2.Get(ctx, rec1.Name)
	if err != nil {
		t.Fatalf("Get(rec1) on reopened store failed: %v", err)
	}

	if !reflect.DeepEqual(got1p, &rec1Updated) {
		t.Errorf("On reopen, record = %+v; want %+v", got1p, &rec1Updated)
	}
}
