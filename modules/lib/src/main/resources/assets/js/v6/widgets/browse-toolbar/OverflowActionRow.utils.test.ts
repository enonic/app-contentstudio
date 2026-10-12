import { describe, expect, it } from 'vitest';
import { calculateVisibleActionCount, getOverflowLayout } from './OverflowActionRow.utils';

describe('getOverflowLayout', () => {
    describe.each([
        {
            name: 'wizard',
            ids: ['save', 'reset', 'localize', 'archive', 'duplicate', 'move', 'preview'],
            topId: 'save',
        },
        { name: 'browse', ids: ['new', 'edit', 'archive', 'duplicate', 'move', 'sort', 'preview'], topId: 'new' },
    ])('$name toolbar', ({ ids, topId }) => {
        const items = ids.map((id) => ({ id, primaryRank: id === topId ? 2 : id === 'preview' ? 1 : undefined }));

        it.each([0, 1, 2, 3, 4, 5, 6, 7])('preserves the row and full split menu when %i items fit', (visibleCount) => {
            const { rowItems, overflowItems } = getOverflowLayout(items, visibleCount);
            const expectedOverflowIds =
                visibleCount === 0
                    ? ids
                    : visibleCount === ids.length
                      ? []
                      : ['preview', ...ids.slice(visibleCount, -1)];

            expect(rowItems.map(({ id }) => id)).toEqual(ids.slice(0, visibleCount));
            expect(overflowItems[0]?.id).toBe(
                visibleCount === 0 ? topId : visibleCount === ids.length ? undefined : 'preview',
            );
            expect(overflowItems.map(({ id }) => id)).toEqual(expectedOverflowIds);
        });
    });

    it('uses Preview when inherited content hides Save and Reset and no actions fit in the row', () => {
        const visibleItems = [{ id: 'localize' }, { id: 'preview', primaryRank: 1 }];

        const { rowItems, overflowItems } = getOverflowLayout(visibleItems, 0);

        expect(rowItems).toEqual([]);
        expect(overflowItems.map(({ id }) => id)).toEqual(['preview', 'localize']);
    });

    it('keeps an unranked suffix in source order', () => {
        const items: { id: string; primaryRank?: number }[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

        expect(getOverflowLayout(items, 1)).toEqual({ rowItems: [items[0]], overflowItems: [items[1], items[2]] });
    });

    it('uses the earlier item when ranks are equal', () => {
        const items = [{ id: 'a', primaryRank: 1 }, { id: 'b', primaryRank: 1 }, { id: 'c' }];

        expect(getOverflowLayout(items, 0).overflowItems).toEqual([items[0], items[1], items[2]]);
    });

    it('chooses the highest-ranked overflowed item when a higher-ranked item remains in the row', () => {
        const items = [{ id: 'a', primaryRank: 3 }, { id: 'b' }, { id: 'c', primaryRank: 1 }];

        expect(getOverflowLayout(items, 1).overflowItems).toEqual([items[2], items[1]]);
    });

    it('keeps the order when the highest-ranked item is already first in the overflow', () => {
        const items = [{ id: 'a' }, { id: 'b', primaryRank: 1 }, { id: 'c' }];

        expect(getOverflowLayout(items, 1).overflowItems).toEqual([items[1], items[2]]);
    });

    it('returns no overflow when every item fits', () => {
        const items = [{ id: 'a' }, { id: 'b', primaryRank: 1 }];

        expect(getOverflowLayout(items, items.length)).toEqual({ rowItems: items, overflowItems: [] });
    });
});

describe('calculateVisibleActionCount', () => {
    it('keeps all actions visible when the full row fits', () => {
        const visibleCount = calculateVisibleActionCount({
            actionButtonWidths: [72, 84, 96],
            overflowButtonWidths: [160, 120, 96],
            containerWidth: 280,
        });

        expect(visibleCount).toBe(3);
    });

    it('reserves width for the overflow button before deciding how many actions stay visible', () => {
        const visibleCount = calculateVisibleActionCount({
            actionButtonWidths: [72, 84, 96],
            overflowButtonWidths: [160, 120, 96],
            containerWidth: 210,
        });

        expect(visibleCount).toBe(1);
    });

    it('allows the row to collapse fully into the overflow button when needed', () => {
        const visibleCount = calculateVisibleActionCount({
            actionButtonWidths: [88, 92],
            overflowButtonWidths: [92, 92],
            containerWidth: 92,
        });

        expect(visibleCount).toBe(0);
    });
});
