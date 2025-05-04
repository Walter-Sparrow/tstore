package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	BotToken   string `json:"bot_token"`
	ChatID     string `json:"chat_id"`
	SyncFolder string `json:"sync_folder"`
}

func ConfigPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	cfgDir := filepath.Join(dir, "tstore")
	if err := os.MkdirAll(cfgDir, 0o700); err != nil {
		return "", err
	}

	return filepath.Join(cfgDir, "config.json"), nil
}

func LoadConfig() (*Config, error) {
	path, err := ConfigPath()
	if err != nil {
		return nil, err
	}

	f, err := os.Open(path)
	if os.IsNotExist(err) {
		cfg := &Config{}
		return cfg, SaveConfig(cfg)
	} else if err != nil {
		return nil, err
	}
	defer f.Close()

	var cfg Config
	if err := json.NewDecoder(f).Decode(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func SaveConfig(cfg *Config) error {
	path, err := ConfigPath()
	if err != nil {
		return err
	}

	tmp := path + ".tmp"
	f, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o600)
	if err != nil {
		return err
	}

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(cfg); err != nil {
		f.Close()
		return err
	}
	f.Close()

	return os.Rename(tmp, path)
}
