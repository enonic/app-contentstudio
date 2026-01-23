import {
    VirtualizedTreeList,
    useVirtualizedTreeList,
    type FlatNode as VirtualizedTreeListNode,
    type VirtualizedTreeListItemProps,
} from '@enonic/ui';
import {type ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';
import {ContentLabel} from '../../content/ContentLabel';
import {StatusBadge} from '../../status/StatusBadge';

export type IssueItemsTreeRowProps = {
    node: VirtualizedTreeListNode<ContentTreeSelectorItem>;
    index: number;
    itemProps: VirtualizedTreeListItemProps;
    selectable: boolean;
    content: ContentSummaryAndCompareStatus;
    onExpand: (id: string) => void;
    onCollapse: (id: string) => void;
};

const ISSUE_ITEMS_TREE_ROW_NAME = 'IssueItemsTreeRow';

export const IssueItemsTreeRow = ({
                                      node,
                                      index,
                                      itemProps,
                                      selectable,
                                      content,
                                      onExpand,
                                      onCollapse,
                                  }: IssueItemsTreeRowProps): ReactElement => {
    const {setActiveIndex, toggleSelection} = useVirtualizedTreeList();
    const defaultOnClick = itemProps.onClick;

    return (
        <VirtualizedTreeList.Row
            {...itemProps}
            selectable={selectable}
            onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey) {
                    defaultOnClick(event);
                    return;
                }

                setActiveIndex(index);
                if (selectable) {
                    toggleSelection(node.id, index);
                }

                const tree = event.currentTarget.closest<HTMLElement>('[role="tree"]');
                tree?.focus();
            }}
        >
            <VirtualizedTreeList.RowLeft>
                <VirtualizedTreeList.RowLevelSpacer level={node.level}/>
                <VirtualizedTreeList.RowExpandControl
                    rowId={node.id}
                    expanded={node.isExpanded}
                    hasChildren={node.hasChildren}
                    onToggle={() => (node.isExpanded ? onCollapse(node.id) : onExpand(node.id))}
                    selected={itemProps.selected}
                />
            </VirtualizedTreeList.RowLeft>
            <VirtualizedTreeList.RowContent className='min-w-0'>
                <ContentLabel content={content}/>
            </VirtualizedTreeList.RowContent>
            <VirtualizedTreeList.RowRight className='flex items-center gap-2.5'>
                <StatusBadge status={content.getPublishStatus()}/>
                <VirtualizedTreeList.RowSelectionControl
                    rowId={node.id}
                    selectable={selectable}
                />
            </VirtualizedTreeList.RowRight>
        </VirtualizedTreeList.Row>
    );
};

IssueItemsTreeRow.displayName = ISSUE_ITEMS_TREE_ROW_NAME;
