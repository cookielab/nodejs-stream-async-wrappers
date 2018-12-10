import {Lock} from 'semaphore-async-await';
import {Writable} from 'stream';

type Callback = (error?: Error | null) => void;

export default class WritableStreamAsyncWriter {
    private readonly stream: Writable;
    private readonly lock: Lock;
    private writablePromise: Promise<void> | null;

    constructor(stream: Writable) {
        this.stream = stream;
        this.lock = new Lock();
        this.writablePromise = null;
    }

    async waitForDrain(): Promise<void> {
        if (this.writablePromise != null) {
            await this.writablePromise;
            this.writablePromise = null;
        }
    }

    async write(chunk: string | Buffer | any, encoding?: string, callback?: Callback): Promise<void> {
        await this.lock.execute(async (): Promise<void> => {
            await this.waitForDrain();
            const continueWriting = this.stream.write(chunk, encoding, callback);
            if (!continueWriting) {
                this.writablePromise = new Promise((resolve: () => void, reject: (error: Error) => void): void => {
                    this.stream.once('error', reject);
                    this.stream.once('drain', (): void => {
                        this.stream.removeListener('error', reject);
                        resolve();
                    });
                });
            }
        });
    }

    async end(callback?: Callback): Promise<void> {
        await this.lock.execute(async (): Promise<void> => {
            await this.waitForDrain();
            const finishPromise = new Promise((resolve: () => void, reject: (error: Error) => void): void => {
                this.stream.once('error', reject);
                this.stream.once('finish', (): void => {
                    this.stream.removeListener('error', reject);
                    resolve();
                });
            });
            this.stream.end(callback);
            await finishPromise;
        });
    }
}
