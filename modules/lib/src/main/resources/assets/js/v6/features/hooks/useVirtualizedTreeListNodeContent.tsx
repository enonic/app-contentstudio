import {VirtualizedTreeList, type FlatNode as VirtualizedTreeListNode} from '@enonic/ui';
import {useCallback, type ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentTreeSelectorItem} from '../../../app/item/ContentTreeSelectorItem';

type UseVirtualizedTreeListNodeContentParams = {
    hasMoreChildren: (id: string) => boolean;
    isLoading: (id: string | null) => boolean;
    disabled: boolean;
    onLoadMore: (id: string) => void;
    showMoreLabel: string;
};

type UseVirtualizedTreeListNodeContentResult = {
    renderLoadingNode: (node: VirtualizedTreeListNode<ContentTreeSelectorItem>) => ReactElement | null;
    getNodeContent: (node: VirtualizedTreeListNode<ContentTreeSelectorItem>) => ContentSummaryAndCompareStatus | null;
};

export function useVirtualizedTreeListNodeContent({
    hasMoreChildren,
    isLoading,
    disabled,
    onLoadMore,
    showMoreLabel,
}: UseVirtualizedTreeListNodeContentParams): UseVirtualizedTreeListNodeContentResult {
    const renderLoadingNode = useCallback((node: VirtualizedTreeListNode<ContentTreeSelectorItem>) => {
        if (!node.isLoading) {
            return null;
        }

        const parentId = node.parentId;
        const showMore = parentId ? hasMoreChildren(parentId) && !isLoading(parentId) : false;

        if (showMore && parentId) {
            return (
                <VirtualizedTreeList.RowPlaceholder
                    level={node.level}
                    className='cursor-pointer text-sm text-subtle'
                    onClick={() => {
                        if (!disabled) {
                            onLoadMore(parentId);
                        }
                    }}
                >
                    {showMoreLabel}
                </VirtualizedTreeList.RowPlaceholder>
            );
        }

        return <VirtualizedTreeList.RowLoading level={node.level} />;
    }, [disabled, hasMoreChildren, isLoading, onLoadMore, showMoreLabel]);

    const getNodeContent = useCallback((node: VirtualizedTreeListNode<ContentTreeSelectorItem>) => {
        const item = node.data;
        if (!item) {
            return null;
        }
        const content = item.getContent();
        if (!content) {
            return null;
        }
        return content;
    }, []);

    return {
        renderLoadingNode,
        getNodeContent,
    };
}
