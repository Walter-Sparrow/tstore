package metadata

import (
	"context"
	"tstore/pkg/model"
)

type Store interface {
	Create(ctx context.Context, rec *model.FileRecord) error
	Get(ctx context.Context, id string) (*model.FileRecord, error)
	Update(ctx context.Context, rec *model.FileRecord) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*model.FileRecord, error)
}

var ErrNotFound = model.ErrNotFound
