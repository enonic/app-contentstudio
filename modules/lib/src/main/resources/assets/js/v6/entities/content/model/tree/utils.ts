import type { FlatNode } from '../../../../shared/lib/tree-store';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import type { ContentTreeNodeData } from './types';
import type { ContentData } from '../ContentData';
import { calcContentState } from '../../../../shared/lib/cms/content/workflow';
import { calcTreePublishStatus } from '../../../../shared/lib/cms/content/status';
import { getIdByPath } from '../content.store';

/**
 * Converts a tree FlatNode to ContentData format for rendering.
 * Shared between main tree and filter tree stores.
 */
export function convertToContentFlatNode(
    node: FlatNode<ContentTreeNodeData>,
    cache: Record<string, ContentSummary>,
): FlatNode<ContentData> {
    if (node.nodeType === 'loading' || !node.data) {
        // Loading node or missing data - return as-is with minimal data
        return {
            ...node,
            data: node.data
                ? {
                      id: node.data.id,
                      displayName: node.data.displayName,
                      name: node.data.name,
                      publishStatus: node.data.publishStatus,
                      contentState: node.data.contentState,
                      contentType: node.data.contentType,
                      iconUrl: node.data.iconUrl,
                      hasChildren: node.hasChildren,
                      item: cache[node.id], // May be undefined
                  }
                : null,
        } as FlatNode<ContentData>;
    }

    const content = cache[node.id];
    const data = node.data;

    // CACHE-FIRST: Use cache values when available, fallback to node data.
    // This ensures fresh status values after socket events update the cache.
    return {
        ...node,
        data: {
            id: data.id,
            displayName: content?.getDisplayName() || data.displayName,
            name: data.name,
            publishStatus: content ? calcTreePublishStatus(content) : data.publishStatus,
            contentState: content ? calcContentState(content) : data.contentState,
            contentType: data.contentType,
            iconUrl: content?.getIconUrl() ?? data.iconUrl,
            hasChildren: node.hasChildren,
            item: content,
        },
    } as FlatNode<ContentData>;
}

export function toTreeNodeData(summary: ContentSummary): ContentTreeNodeData {
    return {
        id: summary.getId(),
        displayName: summary.getDisplayName(),
        name: summary.getName().toString(),
        publishStatus: calcTreePublishStatus(summary),
        contentState: calcContentState(summary),
        contentType: summary.getType(),
        iconUrl: summary.getIconUrl(),
    };
}

export function findParentIdByPath(content: ContentSummary): string | null {
    const path = content.getPath();
    if (!path?.hasParentContent()) return null;

    const parentPath = path.getParentPath();
    if (!parentPath || parentPath.isRoot()) return null;

    return getIdByPath(parentPath.toString()) ?? null;
}
