import { describe, it, expect, beforeEach } from 'vitest';
import type { MovedContentItem } from '../../../app/browse/MovedContentItem';
import { emitContentMoved } from '../../shared/socket/socket.store';
import { $filterRefreshNeeded, clearFilterRefreshNeeded } from './filter-tree.store';

// Builds a MovedContentItem-like object whose new path (from the summary) and old
// path expose the parent paths the $contentMoved guard compares.
function createMovedItem(oldParent: string, newParent: string): MovedContentItem {
    const makeParentPath = (path: string) => ({
        toString: () => path,
        equals: (other: { toString: () => string }) => other.toString() === path,
    });

    const newPath = {
        getParentPath: () => makeParentPath(newParent),
    };

    return {
        item: {
            getContentSummary: () => ({
                getPath: () => newPath,
            }),
        },
        oldPath: {
            getParentPath: () => makeParentPath(oldParent),
        },
    } as unknown as MovedContentItem;
}

describe('filter-tree.store $contentMoved refresh signal', () => {
    beforeEach(() => {
        clearFilterRefreshNeeded();
    });

    it('does not refresh on a same-parent move (rename leaking as move)', () => {
        emitContentMoved([createMovedItem('/site/folder', '/site/folder')]);

        expect($filterRefreshNeeded.get()).toBe(0);
    });

    it('refreshes on a cross-parent move', () => {
        emitContentMoved([createMovedItem('/site/folder', '/site/other')]);

        expect($filterRefreshNeeded.get()).not.toBe(0);
    });

    it('refreshes when at least one item is a cross-parent move', () => {
        emitContentMoved([
            createMovedItem('/site/folder', '/site/folder'),
            createMovedItem('/site/folder', '/site/other'),
        ]);

        expect($filterRefreshNeeded.get()).not.toBe(0);
    });
});
