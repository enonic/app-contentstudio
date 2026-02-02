import {
    VirtualizedTreeList,
    cn,
    type FlatNode as VirtualizedTreeListNode,
    type VirtualizedTreeListItemProps,
} from '@enonic/ui';
import {type ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';
import {useVirtualizedTreeListRowClick} from '../../../hooks/useVirtualizedTreeListRowClick';
import {ContentLabel} from '../../content/ContentLabel';
import {StatusBadge} from '../../status/StatusBadge';
import {RootLabel, isRootContent} from './PathSelectorRoot';

type PathSelectorTreeRowProps = {
    node: VirtualizedTreeListNode<ContentTreeSelectorItem>;
    index: number;
    itemProps: VirtualizedTreeListItemProps;
    selectable: boolean;
    content: ContentSummaryAndCompareStatus;
    onExpand: (id: string) => void;
    onCollapse: (id: string) => void;
};

const PATH_SELECTOR_TREE_ROW_NAME = 'PathSelectorTreeRow';

export const PathSelectorTreeRow = ({
    node,
    index,
    itemProps,
    selectable,
    content,
    onExpand,
    onCollapse,
}: PathSelectorTreeRowProps): ReactElement => {
    const defaultOnClick = itemProps.onClick;
    const {onClick} = useVirtualizedTreeListRowClick({
        index,
        id: node.id,
        selectable,
        defaultOnClick,
    });
    const isRoot = isRootContent(content);
    const isDisabled = !selectable;

    return (
        <VirtualizedTreeList.Row
            {...itemProps}
            selectable={selectable}
            onClick={onClick}
            className={cn(isDisabled && '')}
        >
            <VirtualizedTreeList.RowLeft>
                <VirtualizedTreeList.RowLevelSpacer level={node.level} />
                <VirtualizedTreeList.RowExpandControl
                    rowId={node.id}
                    expanded={node.isExpanded}
                    hasChildren={node.hasChildren}
                    onToggle={() => (node.isExpanded ? onCollapse(node.id) : onExpand(node.id))}
                    selected={itemProps.selected}
                />
            </VirtualizedTreeList.RowLeft>
            <VirtualizedTreeList.RowContent className={cn('min-w-0', isDisabled && 'opacity-50 pointer-events-none')}>
                {isRoot ? (
                    <RootLabel content={content} />
                ) : (
                    <ContentLabel content={content} variant='detailed' />
                )}
            </VirtualizedTreeList.RowContent>
            <VirtualizedTreeList.RowRight
                className={cn('flex items-center gap-2.5', isDisabled && 'opacity-50 pointer-events-none')}
            >
                {!isRoot && <StatusBadge status={content.getPublishStatus()} />}
            </VirtualizedTreeList.RowRight>
        </VirtualizedTreeList.Row>
    );
};

PathSelectorTreeRow.displayName = PATH_SELECTOR_TREE_ROW_NAME;
