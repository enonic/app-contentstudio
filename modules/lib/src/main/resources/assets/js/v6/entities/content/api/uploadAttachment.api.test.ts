import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { UploadError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { restoreXhr, stubXhr, type XhrStub } from '../../../shared/lib/test/xhr.test.utils';
import { deleteAttachment, uploadAttachmentFile } from './uploadAttachment.api';

let xhrs: XhrStub[];
let mockFetch: Mock;

beforeEach(() => {
    xhrs = stubXhr();
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreXhr();
    setActiveProjectResolver(() => undefined);
});

describe('uploadAttachmentFile', () => {
    const file = new File(['bits'], 'my doc?.pdf');

    it('should POST multipart form data to the createAttachment endpoint and resolve the attachment', async () => {
        const resultPromise = uploadAttachmentFile({ id: 'a-1', file, contentId: 'content-1' });

        const [xhr] = xhrs;
        expect(xhr.method).toBe('POST');
        expect(xhr.url).toContain('/rest-v2/cs/cms/test-project/content/content/createAttachment');
        expect(xhr.body).toBeInstanceOf(FormData);

        const form = xhr.body as FormData;
        expect(form.get('file')).toBe(file);
        expect(form.get('name')).toBe('my doc_.pdf');
        expect(form.get('id')).toBe('content-1');

        xhr.respond(200, { name: 'my doc_.pdf', label: '', size: 4, mimeType: 'application/pdf' });
        const result = await resultPromise;

        expect(result.isOk()).toBe(true);
        const success = result._unsafeUnwrap();
        expect(success.identifier).toBe('a-1');
        expect(success.attachment.getName().toString()).toBe('my doc_.pdf');
    });

    it('should cap upload progress at 99 and report 100 only on completion', async () => {
        const onProgress = vi.fn();
        const resultPromise = uploadAttachmentFile({ id: 'a-1', file, contentId: 'content-1', onProgress });

        const [xhr] = xhrs;
        xhr.progress(100, 100);
        expect(onProgress).toHaveBeenLastCalledWith('a-1', 99);

        xhr.respond(200, { name: 'doc.pdf' });
        await resultPromise;

        expect(onProgress).toHaveBeenLastCalledWith('a-1', 100);
    });

    it('should surface the server error message for non-2xx responses', async () => {
        const resultPromise = uploadAttachmentFile({ id: 'a-1', file, contentId: 'content-1' });

        xhrs[0].respond(500, { message: 'Quota exceeded' }, 'Server Error');
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ message: 'Quota exceeded' });
    });

    it('should report a network error', async () => {
        const resultPromise = uploadAttachmentFile({ id: 'a-1', file, contentId: 'content-1' });

        xhrs[0].failNetwork();
        const result = await resultPromise;

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(UploadError);
        expect(result._unsafeUnwrapErr()).toMatchObject({ message: 'Network error' });
    });
});

describe('deleteAttachment', () => {
    it('should POST the content id and attachment names to the deleteAttachment endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'content-1' }));

        const result = await deleteAttachment({ contentId: 'content-1', attachmentNames: ['doc.pdf'] });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/deleteAttachment');
        expect(init).toMatchObject({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentId: 'content-1', attachmentNames: ['doc.pdf'] }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return an error with the status text for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await deleteAttachment({ contentId: 'content-1', attachmentNames: ['doc.pdf'] });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe('Server Error');
    });
});
