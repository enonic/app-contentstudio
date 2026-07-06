import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchContentAttachments } from './attachments.api';

vi.mock('../../../../app/attachment/Attachments', () => ({
    Attachments: {
        create: () => ({
            fromJson: (json: unknown) => ({ build: () => ({ attachmentsFrom: json }) }),
        }),
    },
}));

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('fetchContentAttachments', () => {
    it('should GET the attachments endpoint with the content id and build the attachments', async () => {
        mockFetch.mockResolvedValue(jsonResponse([{ name: 'doc.pdf' }]));

        const result = await fetchContentAttachments(contentId('c-1'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/getAttachments?id=c-1');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ attachmentsFrom: [{ name: 'doc.pdf' }] });
    });

    it('should resolve undefined when the content has no attachments', async () => {
        mockFetch.mockResolvedValue(jsonResponse([]));

        const result = await fetchContentAttachments(contentId('c-1'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchContentAttachments(contentId('c-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
