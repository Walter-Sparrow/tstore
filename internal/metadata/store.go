package metadata

import (
	"context"
	"io"
	"tstore/pkg/model"
)

type Store interface {
	Create(ctx context.Context, rec *model.FileRecord) error
	Get(ctx context.Context, id string) (*model.FileRecord, error)
	Update(ctx context.Context, rec *model.FileRecord) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*model.FileRecord, error)
	Load(ctx context.Context, reader io.ReadCloser) error
	Path() string
}

var ErrNotFound = model.ErrNotFound
