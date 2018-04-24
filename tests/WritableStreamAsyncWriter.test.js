import {PassThrough} from 'stream';
import WritableStreamAsyncWriter from '../src/WritableStreamAsyncWriter';

let stream = null;
beforeEach(() => {
    stream = new PassThrough();
});
afterEach(() => {
    stream = null;
});

describe('WritableStreamAwaitWriter', () => {
    describe('write', () => {
        let writeSpy = null;
        let originalWrite = null;
        beforeEach(() => {
            originalWrite = stream.write.bind(stream);
            writeSpy = jest.spyOn(stream, 'write');
        });
        afterEach(() => {
            if (writeSpy != null) {
                writeSpy.mockReset();
                writeSpy.mockRestore();
                writeSpy = null;
            }
            originalWrite = null;
        });

        it('writes chunks in series one chunk at a time', async () => {
            const writer = new WritableStreamAsyncWriter(stream);

            const chunks = ['chunk1', 'chunk2', 'chunk3'];
            const promises = chunks.map((chunk) => {
                return writer.write(chunk);
            });

            await Promise.all(promises);

            expect(writeSpy).toHaveBeenCalledTimes(3);
            expect(writeSpy).toHaveBeenCalledWith('chunk1', undefined, undefined);
            expect(writeSpy).toHaveBeenCalledWith('chunk2', undefined, undefined);
            expect(writeSpy).toHaveBeenCalledWith('chunk3', undefined, undefined);
        });

        it('awaits writing of next chunk until drain event', async () => {
            writeSpy.mockImplementationOnce((chunk) => {
                originalWrite(chunk);
                return false;
            });

            const writer = new WritableStreamAsyncWriter(stream);

            await writer.write('chunk1');
            const promise = writer.write('chunk2');

            expect(writeSpy).toHaveBeenCalledTimes(1);
            expect(writeSpy).toHaveBeenCalledWith('chunk1', undefined, undefined);

            stream.emit('drain');

            await promise;

            expect(writeSpy).toHaveBeenCalledTimes(2);
            expect(writeSpy).toHaveBeenCalledWith('chunk2', undefined, undefined);
        });
    });

    describe('end', () => {
        let endSpy = null;
        beforeEach(() => {
            endSpy = jest.spyOn(stream, 'end');
        });
        afterEach(() => {
            if (endSpy != null) {
                endSpy.mockReset();
                endSpy.mockRestore();
                endSpy = null;
            }
        });

        it('recalls end of stream', async () => {
            const callback = jest.fn();
            const writer = new WritableStreamAsyncWriter(stream);
            await writer.end(callback);

            expect(endSpy).toHaveBeenCalledTimes(1);
            expect(endSpy).toHaveBeenCalledWith(callback);
        });
    });
});
