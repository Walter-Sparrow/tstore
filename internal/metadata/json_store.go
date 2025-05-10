package metadata

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"sync"
	"tstore/internal/config"
	"tstore/pkg/model"
)

var ErrAlreadyExists = errors.New("record already exists")

type JSONStore struct {
	path    string
	mu      sync.Mutex
	records map[string]*model.FileRecord
}

func NewJSONStore(path string) (*JSONStore, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, err
	}

	s := &JSONStore{
		path:    path,
		records: make(map[string]*model.FileRecord),
	}

	if err := s.load(); err != nil {
		return nil, err
	}

	return s, nil
}

func NewDefaultJSONStore() (*JSONStore, error) {
	cfgPath, err := config.ConfigPath()
	if err != nil {
		return nil, err
	}

	dir := filepath.Dir(cfgPath)
	metaPath := filepath.Join(dir, "metadata.json")
	return NewJSONStore(metaPath)
}

func (s *JSONStore) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.path)
	if os.IsNotExist(err) {
		return nil
	} else if err != nil {
		return err
	}

	var list []*model.FileRecord
	if err := json.Unmarshal(data, &list); err != nil {
		return err
	}

	for _, rec := range list {
		s.records[rec.Name] = rec
	}

	return nil
}

func (s *JSONStore) save() error {
	list := make([]*model.FileRecord, 0, len(s.records))
	for _, rec := range s.records {
		list = append(list, rec)
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}

	return os.Rename(tmp, s.path)
}

func (s *JSONStore) Create(ctx context.Context, rec *model.FileRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.records[rec.Name]; exists {
		return ErrAlreadyExists
	}

	copyRec := *rec
	s.records[rec.Name] = &copyRec
	return s.save()
}

func (s *JSONStore) Get(ctx context.Context, name string) (*model.FileRecord, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	rec, exists := s.records[name]
	if !exists {
		return nil, ErrNotFound
	}

	copyRec := *rec
	return &copyRec, nil
}

func (s *JSONStore) Update(ctx context.Context, rec *model.FileRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.records[rec.Name]; !exists {
		return ErrNotFound
	}

	copyRec := *rec
	s.records[rec.Name] = &copyRec
	return s.save()
}

func (s *JSONStore) Delete(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.records[id]; !exists {
		return ErrNotFound
	}

	delete(s.records, id)
	return s.save()
}

func (s *JSONStore) List(ctx context.Context) ([]*model.FileRecord, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	out := make([]*model.FileRecord, 0, len(s.records))
	for _, rec := range s.records {
		copyRec := *rec
		out = append(out, &copyRec)
	}

	return out, nil
}

func (s *JSONStore) Path() string {
	return s.path
}

func (s *JSONStore) Load(ctx context.Context, reader io.ReadCloser) error {
	defer reader.Close()

	var list []*model.FileRecord
	dec := json.NewDecoder(reader)
	if err := dec.Decode(&list); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.records = make(map[string]*model.FileRecord, len(list))
	for _, rec := range list {
		copyRec := *rec
		s.records[copyRec.Name] = &copyRec
	}

	return nil
}
