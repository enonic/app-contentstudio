import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchContentVersions } from './versions.api';

vi.mock('../../../../app/resource/GetContentVersionsResult', () => ({
    GetContentVersionsResult: { fromJson: (json: unknown) => ({ versionsFrom: json }) },
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

describe('fetchContentVersions', () => {
    it('should POST the content id with the default unbounded size and parse the result', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentVersions: [] }));

        const result = await fetchContentVersions({ contentId: contentId('c-1') });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/getVersions');
        expect(init.method).toBe('POST');
        expect(init.body).toBe(JSON.stringify({ contentId: 'c-1', size: -1 }));
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ versionsFrom: { contentVersions: [] } });
    });

    it('should include the size and cursor only when given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentVersions: [] }));

        await fetchContentVersions({ contentId: contentId('c-1'), size: 10, cursor: 'abc' });

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ contentId: 'c-1', size: 10, cursor: 'abc' }));
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchContentVersions({ contentId: contentId('c-1') });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
