import { describe, expect, it } from 'vitest';
import { calculateVisibleActionCount, getOverflowActions } from './OverflowActionRow.utils';

describe('getOverflowActions', () => {
    it('uses Preview during partial overflow and Save when fully collapsed', () => {
        const actions = ['save', 'reset', 'preview'].map((id) => ({ id }));

        expect(getOverflowActions(actions, 1, 'preview').map(({ id }) => id)).toEqual(['preview', 'reset']);
        expect(getOverflowActions(actions, 0, 'preview').map(({ id }) => id)).toEqual(['save', 'reset', 'preview']);
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
