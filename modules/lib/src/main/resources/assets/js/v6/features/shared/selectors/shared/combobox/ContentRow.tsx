import {ListItem, VirtualizedTreeList, type VirtualizedTreeListItemProps} from '@enonic/ui';
import {Loader2} from 'lucide-react';
import type {ReactElement} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {ContentLabel} from '../../../content/ContentLabel';
import {StatusBadge} from '../../../status/StatusBadge';
import {calcTreePublishStatus} from '../../../../utils/cms/content/status';
import type {ContentComboboxFlatNode} from '../../../../hooks/useContentComboboxData';

//
// * Types
//

export type ContentRowProps = {
    node: ContentComboboxFlatNode;
    mode?: 'tree' | 'flat';
    itemProps: VirtualizedTreeListItemProps;
    /** Whether to show expand control (tree mode) or hide it (flat mode) */
    showExpandControl?: boolean;
    /** Whether to show status badge */
    showStatusBadge?: boolean;
    /** Optional custom renderer for tree mode content. Defaults to ContentLabel + StatusBadge. */
    renderTreeContent?: (content: ContentSummary, hideStatus: boolean) => ReactElement;
    /** Optional custom renderer for flat mode content. Defaults to ContentLabel + StatusBadge. */
    renderFlatContent?: (content: ContentSummary, hideStatus: boolean) => ReactElement;
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

export const LoadingRow = ({level, isLoading, showExpandControl = true}: LoadingRowProps): ReactElement => {
    return (
        <VirtualizedTreeList.RowLoading level={level} className="h-12">
            {isLoading && (
                <Loader2
                    className={showExpandControl ? 'ml-7.5 size-6 animate-spin text-subtle' : 'ml-2 size-6 animate-spin text-subtle'}
                />
            )}
        </VirtualizedTreeList.RowLoading>
    );
};

LoadingRow.displayName = 'LoadingRow';

//
// * Skeleton Row (data not loaded yet)
//

type SkeletonRowProps = {
    level: number;
    showExpandControl?: boolean;
};

export const SkeletonRow = ({level, showExpandControl = true}: SkeletonRowProps): ReactElement => {
    return (
        <VirtualizedTreeList.Row active={false} selected={false}>
            {showExpandControl && (
                <VirtualizedTreeList.RowLeft>
                    <VirtualizedTreeList.RowLevelSpacer level={level} />
                    <span className="size-5 shrink-0" />
                </VirtualizedTreeList.RowLeft>
            )}
            <VirtualizedTreeList.RowContent>
                <div className="flex items-center gap-2.5 animate-pulse">
                    <div className="size-6 rounded bg-surface-neutral-hover" />
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="h-4 w-32 rounded bg-surface-neutral-hover" />
                        <div className="h-3 w-24 rounded bg-surface-neutral-hover" />
                    </div>
                </div>
            </VirtualizedTreeList.RowContent>
            <VirtualizedTreeList.RowRight>
                <span className="size-5 shrink-0" />
            </VirtualizedTreeList.RowRight>
        </VirtualizedTreeList.Row>
    );
};

SkeletonRow.displayName = 'SkeletonRow';

//
// * Main Row Component
//

const DefaultRow = (content: ContentSummary, hideStatus: boolean): ReactElement => (
    <ListItem className="p-0">
        <ListItem.Left className="flex-1">
            <ContentLabel content={content} />
        </ListItem.Left>
        {!hideStatus && (
            <ListItem.Right>
                <StatusBadge status={calcTreePublishStatus(content)} />
            </ListItem.Right>
        )}
    </ListItem>
);

export const ContentRow = ({
    node,
    mode,
    itemProps,
    showExpandControl = true,
    showStatusBadge = true,
    renderTreeContent,
    renderFlatContent,
    onExpand,
    onCollapse,
}: ContentRowProps): ReactElement => {
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
    const hideStatus = !showStatusBadge;
    const renderTree = renderTreeContent ?? DefaultRow;
    const renderFlat = renderFlatContent ?? DefaultRow;

    return (
        <VirtualizedTreeList.Row {...itemProps} className={mode === 'flat' ? '@container' : undefined}>
            {showExpandControl && (
                <VirtualizedTreeList.RowLeft>
                    <VirtualizedTreeList.RowLevelSpacer level={level} />
                    <VirtualizedTreeList.RowExpandControl
                        rowId={id}
                        expanded={isExpanded}
                        hasChildren={hasChildren}
                        onToggle={() => (isExpanded ? onCollapse?.(id) : onExpand?.(id))}
                        selected={itemProps.selected}
                    />
                </VirtualizedTreeList.RowLeft>
            )}
            <VirtualizedTreeList.RowContent>
                {content && mode === 'tree' && renderTree(content, hideStatus)}
                {content && mode === 'flat' && renderFlat(content, hideStatus)}
                {!content && <Loader2 className="size-5 animate-spin text-subtle" />}
            </VirtualizedTreeList.RowContent>
            <VirtualizedTreeList.RowRight>
                {isSelectable && <VirtualizedTreeList.RowSelectionControl rowId={id} />}
            </VirtualizedTreeList.RowRight>
        </VirtualizedTreeList.Row>
    );
};

ContentRow.displayName = 'ContentRow';
