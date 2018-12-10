import {Readable} from 'stream';

type ReadableResolver = (...args: any[]) => any;

type Chunk = string | Buffer | any;

export default class ReadableStreamAsyncReader {
    private readonly stream: Readable;
    private reading: boolean;
    private done: boolean;
    private readableResolve: ReadableResolver | null;

    constructor(stream: Readable) {
        this.stream = stream;
        this.reading = true; // do not wait for readable event by default
        this.done = false;
        this.readableResolve = null;

        this.stream.once('end', (): void => {
            this.done = true;
            if (this.readableResolve != null) {
                this.readableResolve();
            }
        });
    }

    async read(size?: number): Promise<Chunk | null | undefined> {
        if (!this.reading) {
            await new Promise((resolve: () => void, reject: (error: Error) => void): void => {
                this.stream.once('error', reject);
                this.readableResolve = (): void => {
                    this.stream.removeListener('error', reject);
                    if (this.readableResolve != null) {
                        this.stream.removeListener('readable', this.readableResolve);
                    }
                    resolve();
                    this.readableResolve = null;
                };
                this.stream.once('readable', this.readableResolve);
            });
            this.reading = true;
        }

        const chunk = this.stream.read(size);

        if (chunk == null) {
            this.reading = false;
            if (!this.done) {
                return await this.read(size);
            }
        }

        return chunk;
    }
}
