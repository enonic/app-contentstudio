import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { restoreXhr, stubXhr, type XhrStub } from '../lib/test/xhr.test.utils';
import { AppError } from './errors';
import { requestUploadJson } from './upload';

let xhrs: XhrStub[];

beforeEach(() => {
    xhrs = stubXhr();
});

afterEach(() => {
    restoreXhr();
});

describe('requestUploadJson', () => {
    it('should POST FormData as-is without setting a JSON content-type header', async () => {
        const formData = new FormData();
        formData.append('file', 'bits');

        const resultPromise = requestUploadJson<{ id: string }>('/upload', { formData });

        const [xhr] = xhrs;
        expect(xhr.method).toBe('POST');
        expect(xhr.url).toBe('/upload');
        expect(xhr.body).toBe(formData);
        expect(xhr.requestHeaders['Content-Type']).toBeUndefined();

        xhr.respond(200, { id: 'c-1' });
        const result = await resultPromise;

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ id: 'c-1' });
    });

    it('should JSON-serialize the body and set the JSON content-type header', async () => {
        const resultPromise = requestUploadJson<{ ok: boolean }>('/upload', { body: { name: 'pic' } });

        const [xhr] = xhrs;
        expect(xhr.requestHeaders['Content-Type']).toBe('application/json');
        expect(xhr.body).toBe(JSON.stringify({ name: 'pic' }));

        xhr.respond(200, { ok: true });
        const result = await resultPromise;

        expect(result._unsafeUnwrap()).toEqual({ ok: true });
    });

    it('should cap progress at 99 and report 100 only on completion', async () => {
        const onProgress = vi.fn();
        const resultPromise = requestUploadJson('/upload', { formData: new FormData(), onProgress });

        const [xhr] = xhrs;
        xhr.progress(50, 100);
        expect(onProgress).toHaveBeenLastCalledWith(50);

        xhr.progress(100, 100);
        expect(onProgress).toHaveBeenLastCalledWith(99);

        xhr.respond(200, {});
        await resultPromise;

        expect(onProgress).toHaveBeenLastCalledWith(100);
    });

    it('should surface the server error message for non-2xx responses', async () => {
        const resultPromise = requestUploadJson('/upload', { formData: new FormData() });

        xhrs[0].respond(500, { message: 'Disk full' }, 'Server Error');
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        const error = result._unsafeUnwrapErr();
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Disk full');
    });

    it('should fall back to the status text when the error body has no message', async () => {
        const resultPromise = requestUploadJson('/upload', { formData: new FormData() });

        xhrs[0].respond(500, 'not-json', 'Server Error');
        const result = await resultPromise;

        expect(result._unsafeUnwrapErr().message).toBe('Server Error');
    });

    it('should report a network error', async () => {
        const resultPromise = requestUploadJson('/upload', { formData: new FormData() });

        xhrs[0].failNetwork();
        const result = await resultPromise;

        expect(result._unsafeUnwrapErr().message).toBe('Network error');
    });

    it('should err on an unparsable 2xx body after reporting completion', async () => {
        const onProgress = vi.fn();
        const resultPromise = requestUploadJson('/upload', { formData: new FormData(), onProgress });

        xhrs[0].respond(200, 'not-json');
        const result = await resultPromise;

        expect(onProgress).toHaveBeenLastCalledWith(100);
        expect(result._unsafeUnwrapErr().message).toBe('Failed to parse response');
    });
});
