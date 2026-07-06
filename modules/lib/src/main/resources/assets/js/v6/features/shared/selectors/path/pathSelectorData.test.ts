import { errAsync, okAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { ContentId } from '../../../../../app/content/ContentId';
import { ContentName } from '../../../../../app/content/ContentName';
import { ContentPath } from '../../../../../app/content/ContentPath';
import { ContentSummaryBuilder, type ContentSummary } from '../../../../../app/content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../../../../../app/content/ContentSummaryAndCompareStatus';
import { ContentTreeSelectorItem } from '../../../../../app/item/ContentTreeSelectorItem';
import { ChildOrder } from '../../../../../app/resource/order/ChildOrder';
import { FieldOrderExprBuilder } from '../../../../../app/resource/order/FieldOrderExpr';
import { AppError } from '../../../../shared/api/errors';
import { contentSelectorQuery, contentTreeSelectorQuery } from '../../../../entities/content/api/selectorQuery.api';
import { ROOT_ID } from './PathSelectorRoot';
import { loadChildItems, loadRootItems, searchItems } from './pathSelectorData';

vi.mock('../../../../entities/content/api/selectorQuery.api', () => ({
    contentSelectorQuery: vi.fn(),
    contentTreeSelectorQuery: vi.fn(),
}));

//
// * Fixtures
//

const createSummary = (id: string, path: string): ContentSummary =>
    new ContentSummaryBuilder()
        .setId(id)
        .setContentId(new ContentId(id))
        .setName(new ContentName(id))
        .setDisplayName(id)
        .setPath(ContentPath.create().fromString(path).build())
        .setType(ContentTypeName.FOLDER)
        .build();

const createTreeItem = (summary: ContentSummary): ContentTreeSelectorItem =>
    ContentTreeSelectorItem.create().setContent(ContentSummaryAndCompareStatus.fromContentSummary(summary)).build();

beforeEach(() => {
    vi.mocked(contentTreeSelectorQuery).mockReturnValue(okAsync({ items: [], totalHits: 0 }));
    vi.mocked(contentSelectorQuery).mockReturnValue(okAsync({ contents: [], hits: 0, totalHits: 0 }));
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(contentTreeSelectorQuery).mockReset();
    vi.mocked(contentSelectorQuery).mockReset();
});

//
// * loadRootItems
//

describe('loadRootItems', () => {
    it('should request the first tree page without a parent scope', async () => {
        await loadRootItems();

        expect(contentTreeSelectorQuery).toHaveBeenCalledTimes(1);
        expect(contentTreeSelectorQuery).toHaveBeenCalledWith({ from: 0, size: 50 });
    });

    it('should prepend the fake root item to the loaded items', async () => {
        const child = createTreeItem(createSummary('c-1', '/one'));
        vi.mocked(contentTreeSelectorQuery).mockReturnValue(okAsync({ items: [child], totalHits: 7 }));

        const result = await loadRootItems();

        const items = result._unsafeUnwrap();
        expect(items).toHaveLength(2);
        expect(items[0].getId()).toBe(ROOT_ID);
        expect(items[0].isSelectable()).toBe(true);
        expect(items[0].isExpandable()).toBe(false);
        expect(items[0].hasChildren()).toBe(false);
        expect(items[1]).toBe(child);
    });

    it('should pass the api error through', async () => {
        const error = new AppError('tree query failed');
        vi.mocked(contentTreeSelectorQuery).mockReturnValue(errAsync(error));

        const result = await loadRootItems();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBe(error);
    });
});

//
// * loadChildItems
//

describe('loadChildItems', () => {
    it('should request a child page scoped by the parent path and serialized child order', async () => {
        const summary = createSummary('p-1', '/site');
        const order = new ChildOrder();
        order.addOrderExpr(new FieldOrderExprBuilder().setFieldName('modifiedTime').setDirection('DESC').build());
        vi.spyOn(summary, 'getChildOrder').mockReturnValue(order);
        const parent = createTreeItem(summary);

        await loadChildItems(parent, 20);

        expect(contentTreeSelectorQuery).toHaveBeenCalledTimes(1);
        expect(contentTreeSelectorQuery).toHaveBeenCalledWith({
            from: 20,
            size: 50,
            parentPath: '/site',
            childOrder: order.toString(),
        });
    });

    it('should leave the child order unset when the parent has none', async () => {
        const parent = createTreeItem(createSummary('p-1', '/site'));

        await loadChildItems(parent, 0);

        const params = vi.mocked(contentTreeSelectorQuery).mock.calls[0][0];
        expect(params.childOrder).toBeUndefined();
        expect(params.parentPath).toBe('/site');
    });

    it('should return the loaded items and total hits without a fake root', async () => {
        const child = createTreeItem(createSummary('c-1', '/site/one'));
        vi.mocked(contentTreeSelectorQuery).mockReturnValue(okAsync({ items: [child], totalHits: 42 }));
        const parent = createTreeItem(createSummary('p-1', '/site'));

        const result = await loadChildItems(parent, 0);

        const page = result._unsafeUnwrap();
        expect(page.items).toHaveLength(1);
        expect(page.items[0]).toBe(child);
        expect(page.totalHits).toBe(42);
    });

    it('should pass the api error through', async () => {
        const error = new AppError('tree query failed');
        vi.mocked(contentTreeSelectorQuery).mockReturnValue(errAsync(error));
        const parent = createTreeItem(createSummary('p-1', '/site'));

        const result = await loadChildItems(parent, 0);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBe(error);
    });
});

//
// * searchItems
//

describe('searchItems', () => {
    it('should run a flat selector query with the legacy flat page size', async () => {
        await searchItems('ann');

        expect(contentSelectorQuery).toHaveBeenCalledTimes(1);
        expect(contentSelectorQuery).toHaveBeenCalledWith({ from: 0, size: 15, searchString: 'ann' });
        expect(contentTreeSelectorQuery).not.toHaveBeenCalled();
    });

    it('should wrap the found summaries into tree selector items', async () => {
        const summary = createSummary('c-1', '/one');
        vi.mocked(contentSelectorQuery).mockReturnValue(okAsync({ contents: [summary], hits: 1, totalHits: 1 }));

        const result = await searchItems('one');

        const items = result._unsafeUnwrap();
        expect(items).toHaveLength(1);
        expect(items[0]).toBeInstanceOf(ContentTreeSelectorItem);
        expect(items[0].getId()).toBe('c-1');
        expect(items[0].getContentSummary()).toBe(summary);
    });

    it('should pass the api error through', async () => {
        const error = new AppError('flat query failed');
        vi.mocked(contentSelectorQuery).mockReturnValue(errAsync(error));

        const result = await searchItems('x');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBe(error);
    });
});
