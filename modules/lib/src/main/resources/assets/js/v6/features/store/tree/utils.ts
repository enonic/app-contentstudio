import type {FlatNode} from '../../lib/tree-store';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentTreeNodeData} from './types';
import type {ContentData} from '../../views/browse/grid/ContentData';
import {calcWorkflowStateStatus, resolveDisplayName} from '../../utils/cms/content/workflow';

/**
 * Converts a tree FlatNode to ContentData format for rendering.
 * Shared between main tree and filter tree stores.
 */
export function convertToContentFlatNode(
    node: FlatNode<ContentTreeNodeData>,
    cache: Record<string, ContentSummaryAndCompareStatus>
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
                      workflowStatus: node.data.workflowStatus,
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
            displayName: content ? resolveDisplayName(content) : data.displayName,
            name: data.name,
            publishStatus: content?.getPublishStatus() ?? data.publishStatus,
            workflowStatus: content ? calcWorkflowStateStatus(content.getContentSummary()) : data.workflowStatus,
            contentType: data.contentType,
            iconUrl: content?.getContentSummary()?.getIconUrl() ?? data.iconUrl,
            hasChildren: node.hasChildren,
            item: content, // Full ContentSummaryAndCompareStatus from cache
        },
    } as FlatNode<ContentData>;
}
