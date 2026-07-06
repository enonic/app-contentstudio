import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { restoreXhr, stubXhr, type XhrStub } from '../../../shared/lib/test/xhr.test.utils';
import { updateImageMedia } from './updateImageMedia.api';

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

let xhrs: XhrStub[];

beforeEach(() => {
    xhrs = stubXhr();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreXhr();
    setActiveProjectResolver(() => undefined);
});

describe('updateImageMedia', () => {
    const file = new File(['bits'], 'photo.png');

    it('should POST multipart form data to the updateMedia endpoint and build the content', async () => {
        const resultPromise = updateImageMedia({ id: 'i-1', file, contentId: 'content-1' });

        const [xhr] = xhrs;
        expect(xhr.method).toBe('POST');
        expect(xhr.url).toContain('/rest-v2/cs/cms/test-project/content/content/updateMedia');
        expect(xhr.body).toBeInstanceOf(FormData);

        const form = xhr.body as FormData;
        expect(form.get('file')).toBe(file);
        expect(form.get('name')).toBe('photo.png');
        expect(form.get('content')).toBe('content-1');

        xhr.respond(200, { id: 'c-1' });
        const result = await resultPromise;

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ mediaIdentifier: 'i-1', content: { builtFrom: { id: 'c-1' } } });
    });

    it('should cap upload progress at 99 and report 100 only on completion', async () => {
        const onProgress = vi.fn();
        const resultPromise = updateImageMedia({ id: 'i-1', file, contentId: 'content-1', onProgress });

        const [xhr] = xhrs;
        xhr.progress(100, 100);
        expect(onProgress).toHaveBeenLastCalledWith('i-1', 99);

        xhr.respond(200, { id: 'c-1' });
        await resultPromise;

        expect(onProgress).toHaveBeenLastCalledWith('i-1', 100);
    });

    it('should surface the server error message with the media identifier for non-2xx responses', async () => {
        const resultPromise = updateImageMedia({ id: 'i-1', file, contentId: 'content-1' });

        xhrs[0].respond(500, { message: 'Not an image' }, 'Server Error');
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ mediaIdentifier: 'i-1', message: 'Not an image' });
    });

    it('should report a network error with the media identifier', async () => {
        const resultPromise = updateImageMedia({ id: 'i-1', file, contentId: 'content-1' });

        xhrs[0].failNetwork();
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ mediaIdentifier: 'i-1', message: 'Network error' });
    });
});
