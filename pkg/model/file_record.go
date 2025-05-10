package model

import (
	"errors"
	"time"
)

var ErrNotFound = errors.New("record not found")

type FileState string

const (
	StateLocal FileState = "local"
	StateCloud FileState = "cloud"
)

var AllStates = []struct {
	Value  FileState
	TSName string
}{
	{StateLocal, "local"},
	{StateCloud, "cloud"},
}

type FileRecord struct {
	Name        string    `json:"name"`
	State       FileState `json:"state"`
	Description string    `json:"description"`
	Size        int64     `json:"size"`
	Checksum    string    `json:"checksum"`
	UploadedAt  time.Time `json:"uploaded_at"`
	ChunkIds    []string  `json:"chunk_ids"`
}
