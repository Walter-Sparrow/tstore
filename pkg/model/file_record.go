package model

import "time"

type FileState int

const (
	StateLocal FileState = iota
	StateCloud
)

type FileRecord struct {
	Name        string
	State       FileState
	Description string
	UploadedAt  time.Time
	ChunkIds    []string
}
