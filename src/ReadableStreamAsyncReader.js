// @flow

import {Readable} from 'stream';
import type {Chunk} from './types';

export default class ReadableStreamAwaitReader {
    stream: Readable;
    reading: boolean;
    done: boolean;
    readableResolve: ?() => void;

    constructor(stream: Readable): void {
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

    async read(size?: number): Promise<?Chunk> {
        if (!this.reading) {
            await new Promise((resolve: () => void, reject: (Error) => void): void => {
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
