import type {FlatNode} from '../../../lib/tree-store';
import type {ContentData} from './ContentData';
import type {ContentUploadData} from './ContentUploadData';

export type ContentFlatNode = FlatNode<ContentData | ContentUploadData>;
export type ErrorPlaceholderNode = ContentFlatNode & {failedIds: string[]};

type BuildVisibleTreeItemsParams = {
    rawItems: ContentFlatNode[];
    isFailedPlaceholder: (item: ContentFlatNode) => boolean;
    errorRowPrefix: string;
};

type BuildVisibleTreeItemsResult = {
    visibleItems: ContentFlatNode[];
    rawIndexById: Map<string, number>;
};

export function buildVisibleTreeItems({
    rawItems,
    isFailedPlaceholder,
    errorRowPrefix,
}: BuildVisibleTreeItemsParams): BuildVisibleTreeItemsResult {
    const rawIndexById = new Map<string, number>(rawItems.map((item, idx) => [item.id, idx]));
    const visibleItems: ContentFlatNode[] = [];
    let pendingFailedIds: string[] = [];
    let pendingFailedLevel = 0;

    /**
     * Collapses contiguous failed placeholders into one synthetic row.
     *
     * Note: This is a render optimization only. Non-failed placeholders are
     * preserved in visible items so viewport loading can still request them.
     */
    const flushFailedChunk = () => {
        if (pendingFailedIds.length === 0) return;

        const errorId = `${errorRowPrefix}${pendingFailedIds[0]}__${pendingFailedIds.length}`;
        visibleItems.push({
            id: errorId,
            data: null,
            level: pendingFailedLevel,
            isExpanded: false,
            isLoading: false,
            isLoadingData: false,
            hasChildren: false,
            parentId: null,
            nodeType: 'loading',
            failedIds: pendingFailedIds,
        } as ErrorPlaceholderNode);

        pendingFailedIds = [];
    };

    rawItems.forEach((item) => {
        if (isFailedPlaceholder(item)) {
            if (pendingFailedIds.length === 0) {
                pendingFailedLevel = item.level;
            }
            pendingFailedIds.push(item.id);
            return;
        }

        flushFailedChunk();
        visibleItems.push(item);
    });

    flushFailedChunk();

    return {visibleItems, rawIndexById};
}
