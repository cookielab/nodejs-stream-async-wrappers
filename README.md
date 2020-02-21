# Stream Async Wrappers

## Installation

```sh
$ yarn add @cookielab.io/stream-async-wrappers
```
## Usage

### Read data from stream

```typescript
import {ReadableStreamAsyncReader} from '@cookielab.io/stream-async-wrappers';

const reader = new ReadableStreamAsyncReader(stream); // wrap readable stream

const chunk = await reader.read(); // read chunk of data
```

### Write data into stream

```typescript
import {WritableStreamAsyncReader} from '@cookielab.io/stream-async-wrappers';

const writer = new WritableStreamAsyncWriter(stream);

await writer.write(chunk); // write chunk of data

await writer.end(); // ends wrapped write stream
```

## API

###### `new WritableStreamAsyncWriter(stream: Writable)`

Creates an instance of writer by wrapping Node's `Writable` stream.

###### `writableStreamAsyncWriter.write(chunk: string | Buffer | any, encoding?: string, callback?: (error?: Error | null) => void): Promise<void>`

Writes given chunk of data into the wrapped stream.
The returned promise will resolve once the data is successfully written into the wrapped write stream.
The returned promise will reject with an error when the write fails.
The optional callback argument is called just before the returned promise resolves or rejects.

###### `writableStreamAsyncWriter.end(callback?: (error?: Error | null) => void): Promise<void>`

Ends wrapped write stream after all data has been successfully written into the stream.
The returned promise will resolve once the stream successfully finishes.
The returned promise will reject with an error when the write or end fails.  

###### `new ReadableStreamAsyncReader(stream: Readable)`

Creates an instance of reader by wrapping Node's `Readable` stream.

###### `readableStreamAsyncReader.read(size?: number): Promise<Chunk | null | undefined>`

Reads chunk of data from the wrapped stream.
The optional size argument can be used to specify how much data to read.
The returned promise will resolve with read data once they are available.
The returned promise will reject with an error when the read fails.
