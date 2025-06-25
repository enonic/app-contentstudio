import {describe, expect, it} from 'vitest';
import type {ContentFlatNode} from './content-tree-list-visible-items';
import {buildVisibleTreeItems} from './content-tree-list-visible-items';

function createNode(id: string, level: number, data: unknown): ContentFlatNode {
    return {
        id,
        data,
        level,
        isExpanded: false,
        isLoading: false,
        isLoadingData: false,
        hasChildren: false,
        parentId: null,
        nodeType: 'node',
    } as ContentFlatNode;
}

function createLoadingNode(id: string, level: number): ContentFlatNode {
    return {
        id,
        data: null,
        level,
        isExpanded: false,
        isLoading: true,
        isLoadingData: false,
        hasChildren: false,
        parentId: null,
        nodeType: 'loading',
    } as ContentFlatNode;
}

describe('buildVisibleTreeItems', () => {
    it('groups failed placeholders into a single error row and keeps non-failed placeholders visible', () => {
        const rawItems = [
            createNode('failed-a', 0, null),
            createNode('pending-b', 0, null),
            createNode('resolved-c', 0, {displayName: 'C'}),
            createNode('pending-d', 0, null),
        ];

        const {visibleItems} = buildVisibleTreeItems({
            rawItems,
            isFailedPlaceholder: (item) => item.id === 'failed-a',
            errorRowPrefix: '__error_batch__',
        });

        expect(visibleItems.map((item) => item.id)).toEqual([
            '__error_batch__failed-a__1',
            'pending-b',
            'resolved-c',
            'pending-d',
        ]);
    });

    it('keeps non-node loading rows and preserves raw index mapping', () => {
        const rawItems = [
            createNode('failed-a', 0, null),
            createLoadingNode('__filter_load_more__', 0),
            createNode('resolved-b', 0, {displayName: 'B'}),
        ];

        const {visibleItems, rawIndexById} = buildVisibleTreeItems({
            rawItems,
            isFailedPlaceholder: (item) => item.id === 'failed-a',
            errorRowPrefix: '__error_batch__',
        });

        expect(visibleItems.map((item) => item.id)).toEqual([
            '__error_batch__failed-a__1',
            '__filter_load_more__',
            'resolved-b',
        ]);
        expect(rawIndexById.get('resolved-b')).toBe(2);
    });

    it('flushes nested failed placeholder rows and keeps sibling placeholders visible', () => {
        const rawItems = [
            createNode('root-a', 0, {displayName: 'Root A'}),
            createNode('child-failed-a', 1, null),
            createNode('child-pending-a', 1, null),
            createNode('root-b', 0, {displayName: 'Root B'}),
        ];

        const {visibleItems} = buildVisibleTreeItems({
            rawItems,
            isFailedPlaceholder: (item) => item.id === 'child-failed-a',
            errorRowPrefix: '__error_batch__',
        });

        expect(visibleItems.map((item) => item.id)).toEqual([
            'root-a',
            '__error_batch__child-failed-a__1',
            'child-pending-a',
            'root-b',
        ]);
        expect(visibleItems[1].level).toBe(1);
    });
});
