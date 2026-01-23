import {
    Combobox,
    VirtualizedTreeList,
    cn,
    useCombobox,
    type FlatNode as VirtualizedTreeListNode,
} from '@enonic/ui';
import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    type ComponentPropsWithoutRef,
    type ReactElement,
    type RefObject,
} from 'react';
import type {VirtuosoHandle} from 'react-virtuoso';
import {Virtuoso} from 'react-virtuoso';
import type {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';
import {IssueItemsTreeRow} from './IssueItemsTreeRow';

export type IssueItemsTreeProps = {
    items: VirtualizedTreeListNode<ContentTreeSelectorItem>[];
    activeId: string | null;
    onActiveChange: (id: string | null) => void;
    onExpand: (id: string) => void;
    onCollapse: (id: string) => void;
    onLoadMore: (id: string) => void;
    treeHeight: number;
    hasMoreChildren: (id: string) => boolean;
    isLoading: (id: string | null) => boolean;
    showMoreLabel: string;
    label: string;
    disabled: boolean;
    virtuosoRef: RefObject<VirtuosoHandle>;
};

const ISSUE_ITEMS_TREE_NAME = 'IssueItemsTree';
const IssueItemsTreeScroller = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
    ({className, ...props}, ref) => (
        <div ref={ref} {...props} className={cn('rounded-sm *:p-1', className)}/>
    ),
);
IssueItemsTreeScroller.displayName = 'IssueItemsTreeScroller';

const IssueItemsTreeList = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
    ({className, ...props}, ref) => (
        <div ref={ref} {...props} className={cn('flex flex-col gap-1', className)}/>
    ),
);
IssueItemsTreeList.displayName = 'IssueItemsTreeList';

const TREE_VIRTUOSO_COMPONENTS = {
    Scroller: IssueItemsTreeScroller,
    List: IssueItemsTreeList,
};

export const IssueItemsTree = ({
                                   items,
                                   activeId,
                                   onActiveChange,
                                   onExpand,
                                   onCollapse,
                                   onLoadMore,
                                   treeHeight,
                                   hasMoreChildren,
                                   isLoading,
                                   showMoreLabel,
                                   label,
                                   disabled,
                                   virtuosoRef,
                               }: IssueItemsTreeProps): ReactElement => {
    const {selection, onSelectionChange, baseId} = useCombobox();
    const hasFocusedRef = useRef(false);

    const handleTreeSelectionChange = useCallback((nextSelection: ReadonlySet<string>) => {
        if (disabled) {
            return;
        }
        onSelectionChange(Array.from(nextSelection));
    }, [disabled, onSelectionChange]);

    const getItemInteraction = useCallback((node: typeof items[number]) => {
        if (disabled || node.isLoading || !node.data) {
            return 'none';
        }
        if (!node.data.isSelectable()) {
            return 'navigate-only';
        }
        return 'full';
    }, [disabled]);

    useEffect(() => {
        if (hasFocusedRef.current) {
            return;
        }

        hasFocusedRef.current = true;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const tree = document.getElementById(`${baseId}-tree`);
                const treeContainer = tree?.querySelector<HTMLElement>('[role="tree"]');
                treeContainer?.focus();
            });
        });
    }, [baseId]);

    return (
        <Combobox.TreeContent style={{height: treeHeight}}>
            <VirtualizedTreeList
                items={items}
                selection={selection}
                onSelectionChange={handleTreeSelectionChange}
                selectionMode='multiple'
                active={activeId}
                onActiveChange={onActiveChange}
                onExpand={onExpand}
                onCollapse={onCollapse}
                preserveFilteredSelection={true}
                clearSelectionOnEscape={false}
                getItemInteraction={getItemInteraction}
                virtuosoRef={virtuosoRef}
                aria-label={label}
                className='h-full focus-within:ring-0 focus-within:ring-offset-0'
            >
                {({items: visibleItems, getItemProps, containerProps}) => (
                    <Virtuoso
                        ref={virtuosoRef}
                        data={visibleItems}
                        components={TREE_VIRTUOSO_COMPONENTS}
                        {...containerProps}
                        className={cn('h-full', containerProps.className)}
                        itemContent={(index, node) => {
                            if (node.isLoading) {
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

                                return <VirtualizedTreeList.RowLoading level={node.level}/>;
                            }

                            const itemProps = getItemProps(index, node);
                            const item = node.data;
                            if (!item) {
                                return null;
                            }
                            const content = item.getContent();
                            if (!content) {
                                return null;
                            }

                            const selectable = item.isSelectable() && !disabled;
                            return (
                                <IssueItemsTreeRow
                                    node={node}
                                    index={index}
                                    itemProps={itemProps}
                                    selectable={selectable}
                                    content={content}
                                    onExpand={onExpand}
                                    onCollapse={onCollapse}
                                />
                            );
                        }}
                    />
                )}
            </VirtualizedTreeList>
        </Combobox.TreeContent>
    );
};

IssueItemsTree.displayName = ISSUE_ITEMS_TREE_NAME;
