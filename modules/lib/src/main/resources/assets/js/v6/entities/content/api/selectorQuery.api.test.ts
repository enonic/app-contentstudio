import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { contentSelectorQuery, contentTreeSelectorQuery } from './selectorQuery.api';

vi.mock('../../../../app/item/ContentTreeSelectorItem', () => ({
    ContentTreeSelectorItem: { fromJson: (json: unknown) => ({ treeItemFrom: json }) },
}));

vi.mock('../../../../app/content/ContentSummary', () => ({
    ContentSummary: {
        fromJson: (json: unknown) => ({ summaryFrom: json }),
        fromJsonArray: (json: unknown[]) => json.map((item) => ({ summaryFrom: item })),
    },
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

describe('contentSelectorQuery', () => {
    it('should POST the flat selector query with the search expression and parse the summaries', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [{ id: 'c-1' }], metadata: { hits: 1, totalHits: 5 } }));

        const result = await contentSelectorQuery({ searchString: 'ann', from: 0, size: 50 });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/selectorQuery');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(body.from).toBe(0);
        expect(body.size).toBe(50);
        expect(body.queryExpr).toContain("'ann'");
        expect(body.queryExpr).toContain('fulltext');
        expect(body.parentPath).toBeUndefined();

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toMatchObject({
            contents: [{ summaryFrom: { id: 'c-1' } }],
            totalHits: 5,
        });
    });

    it('should pass content scoping fields into the payload when given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [], metadata: { hits: 0, totalHits: 0 } }));

        await contentSelectorQuery({
            searchString: '',
            from: 0,
            size: 10,
            contentId: 'ctx-1',
            inputName: 'mySelector',
            contentTypeNames: ['my:type'],
            allowedContentPaths: ['/site'],
            applicationKey: 'com.app',
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.contentId).toBe('ctx-1');
        expect(body.inputName).toBe('mySelector');
        expect(body.contentTypeNames).toEqual(['my:type']);
        expect(body.allowedContentPaths).toEqual(['/site']);
        expect(body.applicationKey).toBe('com.app');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await contentSelectorQuery({ searchString: 'x', from: 0, size: 10 });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('contentTreeSelectorQuery', () => {
    it('should POST the tree selector query with the parent path and child order', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ items: [{ name: 'i-1' }], metadata: { hits: 1, totalHits: 2 } }));

        const result = await contentTreeSelectorQuery({
            searchString: '',
            from: 0,
            size: 50,
            parentPath: '/site/folder',
            childOrder: '_score DESC, _path ASC',
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/treeSelectorQuery');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(body.parentPath).toBe('/site/folder');
        expect(body.childOrder).toBe('_score DESC, _path ASC');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toMatchObject({
            items: [{ treeItemFrom: { name: 'i-1' } }],
            totalHits: 2,
        });
    });

    it('should send a null parent path and empty child order when unset', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ items: [], metadata: { hits: 0, totalHits: 0 } }));

        const result = await contentTreeSelectorQuery({ searchString: '', from: 0, size: 50 });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.parentPath).toBeNull();
        expect(body.childOrder).toBe('');
        expect(result._unsafeUnwrap()).toMatchObject({ items: [], totalHits: 0 });
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await contentTreeSelectorQuery({ searchString: '', from: 0, size: 50 });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
