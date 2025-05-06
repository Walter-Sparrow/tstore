package sync

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func MoveFile(src, dst string) error {
	srcInfo, err := os.Stat(src)
	if err != nil {
		return fmt.Errorf("stat source %q: %w", src, err)
	}
	if srcInfo.IsDir() {
		return fmt.Errorf("source %q is a directory", src)
	}

	if err := os.MkdirAll(filepath.Dir(dst), 0o700); err != nil {
		return fmt.Errorf("creating destination directory %q: %w", filepath.Dir(dst), err)
	}

	if err := os.Rename(src, dst); err == nil {
		return nil
	} else if linkErr, ok := err.(*os.LinkError); ok {
		// Fall through to copy+delete on cross-device or other link errors
		_ = linkErr
	} else {
		return fmt.Errorf("renaming %q to %q: %w", src, dst, err)
	}

	in, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("opening source file %q: %w", src, err)
	}
	defer in.Close()

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, srcInfo.Mode().Perm())
	if err != nil {
		return fmt.Errorf("creating destination file %q: %w", dst, err)
	}
	defer func() {
		if cerr := out.Close(); cerr != nil && err == nil {
			err = fmt.Errorf("closing destination file %q: %w", dst, cerr)
		}
	}()

	if _, err := io.Copy(out, in); err != nil {
		_ = os.Remove(dst)
		return fmt.Errorf("copying data to %q: %w", dst, err)
	}

	if err := out.Sync(); err != nil {
		return fmt.Errorf("syncing destination file %q: %w", dst, err)
	}

	if err := os.Remove(src); err != nil {
		return fmt.Errorf("removing source file %q: %w", src, err)
	}

	return nil
}
