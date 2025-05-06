package sync

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMoveFile_Success(t *testing.T) {
	tmp := t.TempDir()
	srcDir := filepath.Join(tmp, "src")
	destDir := filepath.Join(tmp, "nested", "dest")
	if err := os.MkdirAll(srcDir, 0o755); err != nil {
		t.Fatalf("mkdir srcDir: %v", err)
	}

	srcPath := filepath.Join(srcDir, "file.txt")
	content := []byte("hello world")
	if err := os.WriteFile(srcPath, content, 0o644); err != nil {
		t.Fatalf("write src file: %v", err)
	}

	destPath := filepath.Join(destDir, "file.txt")
	if err := MoveFile(srcPath, destPath); err != nil {
		t.Fatalf("MoveFile returned error: %v", err)
	}

	if _, err := os.Stat(srcPath); !os.IsNotExist(err) {
		t.Errorf("expected source to be removed, but Stat returned: %v", err)
	}

	data, err := os.ReadFile(destPath)
	if err != nil {
		t.Fatalf("reading dest file: %v", err)
	}
	if string(data) != string(content) {
		t.Errorf("dest content = %q; want %q", string(data), string(content))
	}
}

func TestMoveFile_SrcNotExist(t *testing.T) {
	tmp := t.TempDir()
	destPath := filepath.Join(tmp, "dest", "file.txt")
	err := MoveFile("/path/does/not/exist", destPath)
	if err == nil {
		t.Fatal("expected an error when source does not exist, got nil")
	}
}

func TestMoveFile_SrcIsDir(t *testing.T) {
	tmp := t.TempDir()
	srcDir := filepath.Join(tmp, "dirsrc")
	if err := os.Mkdir(srcDir, 0o755); err != nil {
		t.Fatalf("mkdir srcDir: %v", err)
	}

	destPath := filepath.Join(tmp, "dest", "file.txt")
	err := MoveFile(srcDir, destPath)
	if err == nil {
		t.Fatal("expected an error when source is a directory, got nil")
	}
}
