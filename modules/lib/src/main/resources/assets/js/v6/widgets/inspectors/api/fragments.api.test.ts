import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchFragmentSummaries } from './fragments.api';

vi.mock('../../../../app/content/ContentSummary', () => ({
    ContentSummary: { fromJson: (json: unknown) => ({ summaryFrom: json }) },
}));

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('fetchFragmentSummaries', () => {
    it('should POST a fragment query scoped to the site path and parse the summaries', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [{ id: 'frag-1' }], metadata: { totalHits: 1 } }));

        const result = await fetchFragmentSummaries('/mysite');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/query');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(body.contentTypeNames).toEqual(['portal:fragment']);
        expect(body.expand).toBe('summary');
        expect(body.size).toBe(-1);
        expect(body.queryExpr).toContain("_path LIKE '/content/mysite/*'");

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ summaryFrom: { id: 'frag-1' } }]);
    });

    it('should omit the path constraint when no site path is given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [], metadata: { totalHits: 0 } }));

        const result = await fetchFragmentSummaries();

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.queryExpr).not.toContain('_path LIKE');
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchFragmentSummaries('/mysite');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
