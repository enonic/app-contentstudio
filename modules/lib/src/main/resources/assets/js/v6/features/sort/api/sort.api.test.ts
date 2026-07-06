import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { ChildOrder } from '../../../../app/resource/order/ChildOrder';
import { FieldOrderExprBuilder } from '../../../../app/resource/order/FieldOrderExpr';
import { OrderChildMovement } from '../../../../app/resource/order/OrderChildMovement';
import { OrderChildMovements } from '../../../../app/resource/order/OrderChildMovements';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { reorderChildren, setChildOrder } from './sort.api';

const makeChildOrder = (fieldName: string, direction: string): ChildOrder => {
    const order = new ChildOrder();
    order.addOrderExpr(new FieldOrderExprBuilder().setFieldName(fieldName).setDirection(direction).build());
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

describe('reorderChildren', () => {
    it('should POST the manual order payload with movements to the reorderChildren endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({}));

        const movements = new OrderChildMovements();
        movements.addChildMovement(new OrderChildMovement(new ContentId('a'), new ContentId('b')));
        movements.addChildMovement(new OrderChildMovement(new ContentId('c'), undefined as unknown as ContentId));

        const result = await reorderChildren({
            contentId: new ContentId('parent-1'),
            childOrder: makeChildOrder('_manualOrderValue', 'DESC'),
            movements,
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/reorderChildren');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual(['manualOrder', 'contentId', 'childOrder', 'reorderChildren']);
        expect(body).toEqual({
            manualOrder: true,
            contentId: 'parent-1',
            childOrder: {
                orderExpressions: [{ FieldOrderExpr: { fieldName: '_manualOrderValue', direction: 'DESC' } }],
            },
            reorderChildren: [
                { contentId: 'a', moveBefore: 'b' },
                { contentId: 'c', moveBefore: '' },
            ],
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await reorderChildren({
            contentId: new ContentId('parent-1'),
            childOrder: makeChildOrder('_manualOrderValue', 'DESC'),
            movements: new OrderChildMovements(),
        });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('setChildOrder', () => {
    it('should POST the child order before the content id to the setChildOrder endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'parent-1' }));

        const result = await setChildOrder({
            contentId: new ContentId('parent-1'),
            childOrder: makeChildOrder('modifiedTime', 'DESC'),
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/setChildOrder');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual(['childOrder', 'contentId']);
        expect(body).toEqual({
            childOrder: { orderExpressions: [{ FieldOrderExpr: { fieldName: 'modifiedTime', direction: 'DESC' } }] },
            contentId: 'parent-1',
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await setChildOrder({
            contentId: new ContentId('parent-1'),
            childOrder: makeChildOrder('displayName', 'ASC'),
        });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
