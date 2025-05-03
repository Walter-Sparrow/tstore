package ingestion

import (
	"bufio"
	"io"
	"os"
)

func StreamChunks(filePath string, chunkSize int64, handler func(index int, data []byte) error) error {
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()

	reader := bufio.NewReader(f)
	buf := make([]byte, chunkSize)
	index := 0

	for {
		n, err := io.ReadFull(reader, buf)
		if err == io.ErrUnexpectedEOF || err == io.EOF {
			if n > 0 {
				if err := handler(index, buf[:n]); err != nil {
					return err
				}
			}
			break
		}
		if err != nil {
			return err
		}
		if err := handler(index, buf); err != nil {
			return err
		}
		index++
	}
	return nil
}
