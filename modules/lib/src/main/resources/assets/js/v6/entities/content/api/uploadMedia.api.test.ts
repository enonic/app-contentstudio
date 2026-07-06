import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { UploadError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { restoreXhr, stubXhr, type XhrStub } from '../../../shared/lib/test/xhr.test.utils';
import { uploadMediaFile, uploadRemoteImage } from './uploadMedia.api';

vi.mock('../../../../app/content/Content', () => ({
    ContentBuilder: class {
        json: unknown;
        fromContentJson(json: unknown) {
            this.json = json;
            return this;
        }
        build() {
            return { builtFrom: this.json };
        }
    },
}));

const parentStub = { getPath: () => ({ toString: () => '/parent' }) } as unknown as ContentSummary;

let xhrs: XhrStub[];

beforeEach(() => {
    xhrs = stubXhr();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreXhr();
    setActiveProjectResolver(() => undefined);
});

describe('uploadMediaFile', () => {
    const file = new File(['bits'], 'my file?.png');

    it('should POST multipart form data to the createMedia endpoint and build the content', async () => {
        const resultPromise = uploadMediaFile({ id: 'u-1', file, parentContent: parentStub });

        const [xhr] = xhrs;
        expect(xhr.method).toBe('POST');
        expect(xhr.url).toContain('/rest-v2/cs/cms/test-project/content/content/createMedia');
        expect(xhr.body).toBeInstanceOf(FormData);

        const form = xhr.body as FormData;
        expect(form.get('file')).toBe(file);
        expect(form.get('name')).toBe('my file_.png');
        expect(form.get('parent')).toBe('/parent');

        xhr.respond(200, { id: 'c-1' });
        const result = await resultPromise;

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ mediaIdentifier: 'u-1', content: { builtFrom: { id: 'c-1' } } });
    });

    it('should default the parent to the content root when no parent content is given', async () => {
        const resultPromise = uploadMediaFile({ id: 'u-1', file });

        const [xhr] = xhrs;
        expect((xhr.body as FormData).get('parent')).toBe('/');

        xhr.respond(200, { id: 'c-1' });
        await resultPromise;
    });

    it('should cap upload progress at 99 and report 100 only on completion', async () => {
        const onProgress = vi.fn();
        const resultPromise = uploadMediaFile({ id: 'u-1', file, onProgress });

        const [xhr] = xhrs;
        xhr.progress(50, 100);
        expect(onProgress).toHaveBeenLastCalledWith('u-1', 50);

        xhr.progress(100, 100);
        expect(onProgress).toHaveBeenLastCalledWith('u-1', 99);

        xhr.respond(200, { id: 'c-1' });
        await resultPromise;

        expect(onProgress).toHaveBeenLastCalledWith('u-1', 100);
    });

    it('should surface the server error message with the media identifier for non-2xx responses', async () => {
        const resultPromise = uploadMediaFile({ id: 'u-1', file });

        xhrs[0].respond(500, { message: 'Disk full' }, 'Server Error');
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ mediaIdentifier: 'u-1', message: 'Disk full' });
    });

    it('should fall back to the status text when the error body has no message', async () => {
        const resultPromise = uploadMediaFile({ id: 'u-1', file });

        xhrs[0].respond(500, 'not-json', 'Server Error');
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ mediaIdentifier: 'u-1', message: 'Server Error' });
    });

    it('should report a network error with the media identifier', async () => {
        const resultPromise = uploadMediaFile({ id: 'u-1', file });

        xhrs[0].failNetwork();
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ mediaIdentifier: 'u-1', message: 'Network error' });
    });

    it('should err on an unparsable 2xx body after reporting completion', async () => {
        const onProgress = vi.fn();
        const resultPromise = uploadMediaFile({ id: 'u-1', file, onProgress });

        xhrs[0].respond(200, 'not-json');
        const result = await resultPromise;

        expect(onProgress).toHaveBeenLastCalledWith('u-1', 100);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({
            mediaIdentifier: 'u-1',
            message: 'Failed to parse response',
        });
    });
});

describe('uploadRemoteImage', () => {
    it('should POST a JSON payload to the createMediaFromUrl endpoint', async () => {
        const resultPromise = uploadRemoteImage({ id: 'r-1', imageSource: 'https://example.com/pic' });

        const [xhr] = xhrs;
        expect(xhr.method).toBe('POST');
        expect(xhr.url).toContain('/rest-v2/cs/cms/test-project/content/content/createMediaFromUrl');
        expect(xhr.requestHeaders['Content-Type']).toBe('application/json');

        const payload = JSON.parse(xhr.body as string);
        expect(payload.url).toBe('https://example.com/pic');
        expect(payload.name).toMatch(/^image-\d{14}[0-9a-z]*\.jpg$/);
        expect(payload.parent).toBe('/');

        xhr.respond(200, { id: 'c-2' });
        const result = await resultPromise;

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ mediaIdentifier: 'r-1', content: { builtFrom: { id: 'c-2' } } });
    });

    it('should surface the server error message with the media identifier for non-2xx responses', async () => {
        const resultPromise = uploadRemoteImage({ id: 'r-1', imageSource: 'https://example.com/pic' });

        xhrs[0].respond(500, { message: 'Remote fetch failed' }, 'Server Error');
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ mediaIdentifier: 'r-1', message: 'Remote fetch failed' });
    });
});
