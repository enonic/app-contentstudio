import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type ContentId } from '../../../../app/content/ContentId';
import { ChildOrder } from '../../../../app/resource/order/ChildOrder';
import { FieldOrderExprBuilder } from '../../../../app/resource/order/FieldOrderExpr';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchReadOnlyContentIds, listContentByParent, listContentIdsByParent, queryContent } from './contentQuery.api';

vi.mock('../../../../app/content/ContentSummary', () => ({
    ContentSummary: {
        fromJson: (json: unknown) => ({ summaryFrom: json }),
        fromJsonArray: (json: unknown[]) => json.map((item) => ({ summaryFrom: item })),
    },
}));

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

const makeOrder = (): ChildOrder => {
    const order = new ChildOrder();
    order.addOrderExpr(new FieldOrderExprBuilder().setFieldName('_modifiedTime').setDirection('DESC').build());
    return order;
};

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('listContentByParent', () => {
    it('should GET the list endpoint with the parent id, numeric summary expand and child order', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [{ id: 'c-1' }], metadata: { totalHits: 3 } }));

        const result = await listContentByParent({
            parentId: contentId('p-1'),
            from: 0,
            size: 10,
            childOrder: makeOrder(),
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/list?');
        expect(url).toContain('parentId=p-1');
        expect(url).toContain('expand=1');
        expect(url).toContain('from=0');
        expect(url).toContain('size=10');
        expect(url).toContain('childOrder=_modifiedTime+DESC');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({
            contents: [{ summaryFrom: { id: 'c-1' } }],
            totalHits: 3,
        });
    });

    it('should omit the parent id for root listings and send an empty child order when unset', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [], metadata: { totalHits: 0 } }));

        await listContentByParent({ from: 0, size: 10 });

        const [url] = mockFetch.mock.calls[0];
        expect(url).not.toContain('parentId=');
        expect(url).toContain('childOrder=');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await listContentByParent({ from: 0, size: 10 });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('queryContent', () => {
    it('should POST the draft-branch summary query and parse contents, total and aggregations', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({
                contents: [{ id: 'c-1' }],
                metadata: { totalHits: 42 },
                aggregations: [{ name: 'contentTypes' }],
            }),
        );

        const result = await queryContent({ queryExpr: "fulltext('displayName', 'x', 'AND')", from: 0, size: 10 });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/query');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(body.queryExpr).toBe("fulltext('displayName', 'x', 'AND')");
        expect(body.from).toBe(0);
        expect(body.size).toBe(10);
        expect(body.expand).toBe('summary');
        expect(body.branch).toBe('draft');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({
            contents: [{ summaryFrom: { id: 'c-1' } }],
            totalHits: 42,
            aggregations: [{ name: 'contentTypes' }],
        });
    });

    it('should query the given branch when one is provided', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ contents: [], metadata: { totalHits: 0 }, aggregations: [] }),
        );

        await queryContent({ queryExpr: '', from: 0, size: 10, branch: 'master' });

        const [, init] = mockFetch.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(body.branch).toBe('master');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await queryContent({ queryExpr: '', from: 0, size: 10 });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchReadOnlyContentIds', () => {
    it('should POST the content ids and pass the read-only id list through', async () => {
        mockFetch.mockResolvedValue(jsonResponse(['a']));

        const result = await fetchReadOnlyContentIds([contentId('a'), contentId('b')]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/isReadOnlyContent');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentIds: ['a', 'b'] }),
        });
        expect(result._unsafeUnwrap()).toEqual(['a']);
    });

    it('should short-circuit to an empty list without fetching for empty input', async () => {
        const result = await fetchReadOnlyContentIds([]);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result._unsafeUnwrap()).toEqual([]);
    });
});

describe('listContentIdsByParent', () => {
    it('should GET the listIds endpoint with the parent id and child order and parse the ids', async () => {
        mockFetch.mockResolvedValue(jsonResponse([{ id: 'c-1' }, { id: 'c-2' }]));

        const result = await listContentIdsByParent({ parentId: contentId('p-1'), childOrder: makeOrder() });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/listIds?');
        expect(url).toContain('parentId=p-1');
        expect(url).toContain('childOrder=_modifiedTime+DESC');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().map((id) => id.toString())).toEqual(['c-1', 'c-2']);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await listContentIdsByParent({ parentId: contentId('p-1') });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
