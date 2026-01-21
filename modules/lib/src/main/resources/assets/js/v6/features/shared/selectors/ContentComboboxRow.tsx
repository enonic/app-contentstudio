import {ListItem, VirtualizedTreeList, type VirtualizedTreeListItemProps} from '@enonic/ui';
import {Loader2} from 'lucide-react';
import type {ReactElement} from 'react';
import {ContentLabel} from '../content/ContentLabel';
import {StatusBadge} from '../status/StatusBadge';
import type {ContentComboboxFlatNode} from '../../hooks/useContentComboboxData';

//
// * Types
//

export type ContentComboboxRowProps = {
    node: ContentComboboxFlatNode;
    itemProps: VirtualizedTreeListItemProps;
    /** Whether to show expand control (tree mode) or hide it (flat mode) */
    showExpandControl?: boolean;
    /** Whether to show status badge */
    showStatusBadge?: boolean;
    onExpand?: (id: string) => void;
    onCollapse?: (id: string) => void;
};

//
// * Loading Row (pagination placeholder)
//

type LoadingRowProps = {
    level: number;
    isLoading: boolean;
    showExpandControl?: boolean;
};

const LoadingRow = ({level, isLoading, showExpandControl = true}: LoadingRowProps): ReactElement => {
    return (
        <VirtualizedTreeList.RowLoading level={level} className='h-12'>
            {isLoading && (
                <Loader2 className={showExpandControl ? 'ml-7.5 size-6 animate-spin text-subtle' : 'ml-2 size-6 animate-spin text-subtle'} />
            )}
        </VirtualizedTreeList.RowLoading>
    );
};

//
// * Skeleton Row (data not loaded yet)
//

type SkeletonRowProps = {
    level: number;
    showExpandControl?: boolean;
};

const SkeletonRow = ({level, showExpandControl = true}: SkeletonRowProps): ReactElement => {
    return (
        <VirtualizedTreeList.Row active={false} selected={false}>
            {showExpandControl && (
                <VirtualizedTreeList.RowLeft>
                    <VirtualizedTreeList.RowLevelSpacer level={level} />
                    <span className='size-5 shrink-0' />
                </VirtualizedTreeList.RowLeft>
            )}
            <VirtualizedTreeList.RowContent>
                <div className='flex items-center gap-2.5 animate-pulse'>
                    <div className='size-6 rounded bg-surface-neutral-hover' />
                    <div className='flex flex-col gap-1 flex-1'>
                        <div className='h-4 w-32 rounded bg-surface-neutral-hover' />
                        <div className='h-3 w-24 rounded bg-surface-neutral-hover' />
                    </div>
                </div>
            </VirtualizedTreeList.RowContent>
            <VirtualizedTreeList.RowRight>
                <span className='size-5 shrink-0' />
            </VirtualizedTreeList.RowRight>
        </VirtualizedTreeList.Row>
    );
};

//
// * Main Row Component
//

export const ContentComboboxRow = ({
    node,
    itemProps,
    showExpandControl = true,
    showStatusBadge = true,
    onExpand,
    onCollapse,
}: ContentComboboxRowProps): ReactElement => {
    const {id, level, isExpanded, hasChildren, data, nodeType, isLoading} = node;

    // Handle loading node (renders spinner when actually loading)
    if (nodeType === 'loading') {
        return <LoadingRow level={level} isLoading={isLoading} showExpandControl={showExpandControl} />;
    }

    // Skeleton row when data not loaded yet
    if (data === null) {
        return <SkeletonRow level={level} showExpandControl={showExpandControl} />;
    }

    const content = data.item;
    const isSelectable = data.selectable;

    return (
        <VirtualizedTreeList.Row {...itemProps}>
            {showExpandControl && (
                <VirtualizedTreeList.RowLeft>
                    <VirtualizedTreeList.RowLevelSpacer level={level} />
                    <VirtualizedTreeList.RowExpandControl
                        rowId={id}
                        expanded={isExpanded}
                        hasChildren={hasChildren}
                        onToggle={() => isExpanded ? onCollapse?.(id) : onExpand?.(id)}
                        selected={itemProps.selected}
                    />
                </VirtualizedTreeList.RowLeft>
            )}
            <VirtualizedTreeList.RowContent>
                {content ? (
                    <ListItem className='p-0'>
                        <ListItem.Left className='flex-1'>
                            <ContentLabel content={content} />
                        </ListItem.Left>
                        {showStatusBadge && (
                            <ListItem.Right>
                                <StatusBadge status={content.getPublishStatus()} />
                            </ListItem.Right>
                        )}
                    </ListItem>
                ) : (
                    <Loader2 className='size-5 animate-spin text-subtle' />
                )}
            </VirtualizedTreeList.RowContent>
            <VirtualizedTreeList.RowRight>
                {isSelectable && (
                    <VirtualizedTreeList.RowSelectionControl rowId={id} />
                )}
            </VirtualizedTreeList.RowRight>
        </VirtualizedTreeList.Row>
    );
};

ContentComboboxRow.displayName = 'ContentComboboxRow';
