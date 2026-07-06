import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { contentFullSelectorQuery } from './selectorQueryFull.api';

vi.mock('../lib/parseContent', () => ({
    parseContent: (json: unknown) => ({ contentFrom: json }),
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

describe('contentFullSelectorQuery', () => {
    it('should POST the flat selector query with the full expand and parse the contents', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [{ id: 'c-1' }], metadata: { hits: 1, totalHits: 3 } }));

        const result = await contentFullSelectorQuery({ searchString: 'ann', from: 0, size: 10 });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/selectorQuery');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(body.expand).toBe('full');
        expect(body.from).toBe(0);
        expect(body.size).toBe(10);
        expect(body.queryExpr).toContain("'ann'");

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toMatchObject({
            contents: [{ contentFrom: { id: 'c-1' } }],
            hits: 1,
            totalHits: 3,
        });
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await contentFullSelectorQuery({ searchString: 'x', from: 0, size: 10 });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
