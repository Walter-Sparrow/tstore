package ingestion

import (
	"bufio"
	"io"
)

type Chunk struct {
	Index int
	Data  []byte
}

func StreamChunks(r io.Reader, chunkSize int64) (<-chan Chunk, <-chan error) {
	chunks := make(chan Chunk)
	errs := make(chan error, 1)

	go func() {
		defer close(chunks)
		defer close(errs)

		reader := bufio.NewReader(r)
		index := 0

		for {
			buf := make([]byte, chunkSize)
			n, err := io.ReadFull(reader, buf)

			if err == io.ErrUnexpectedEOF || err == io.EOF {
				if n > 0 {
					chunks <- Chunk{Index: index, Data: buf[:n]}
				}
				break
			}

			if err != nil {
				errs <- err
				return
			}

			chunks <- Chunk{Index: index, Data: buf}
			index++
		}

		errs <- nil
	}()

	return chunks, errs
}
