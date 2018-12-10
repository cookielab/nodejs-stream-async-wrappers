import {PassThrough} from 'stream';
import ReadableStreamAsyncReader from '../src/ReadableStreamAsyncReader';

let stream = new PassThrough();
beforeEach(() => {
    stream = new PassThrough();
});

describe('ReadableStreamAsyncReader', () => {
    describe('read', () => {
        let readSpy: jest.SpyInstance | null = null;
        beforeEach(() => {
            readSpy = jest.spyOn(stream, 'read');
        });
        afterEach(() => {
            if (readSpy != null) {
                readSpy.mockReset();
                readSpy.mockRestore();
                readSpy = null;
            }
        });

        it('reads a chunk', async () => {
            stream.write('chunk');
            const reader = new ReadableStreamAsyncReader(stream);
            const chunk = await reader.read();
            expect(chunk.toString()).toBe('chunk');
        });

        it('reads a chunk with await on readable event', async () => {
            const reader = new ReadableStreamAsyncReader(stream);
            const promise = reader.read();

            setTimeout(() => stream.write('chunk'), 100);

            const startTime = Date.now();
            const chunk = await promise;
            expect(chunk.toString()).toBe('chunk');
            expect(Date.now() - startTime).toBeGreaterThanOrEqual(100);
        });

        it('reads NULL value at the end of stream', async () => {
            const reader = new ReadableStreamAsyncReader(stream);
            const promise = reader.read();

            setTimeout(() => stream.end(), 100);

            const chunk = await promise;
            expect(chunk).toBeNull();
        });

        it('fails when waiting for readable event on read', async () => {
            const reader = new ReadableStreamAsyncReader(stream);
            const promise = reader.read();

            setTimeout(() => stream.emit('error', new Error('Testing error')), 100);

            await expect(promise).rejects.toThrow(new Error('Testing error'));
        });

        it('passes optional size parameter directly to internal stream', async () => {
            const reader = new ReadableStreamAsyncReader(stream);
            const promise = reader.read(5);

            setTimeout(() => stream.write('chunk'), 100);

            await promise;
            expect(readSpy).toHaveBeenCalledTimes(3);
            expect(readSpy).toHaveBeenCalledWith(5);
        });
    });
});
