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
    type ComponentPropsWithoutRef,
    type ReactElement,
    type RefObject,
} from 'react';
import type {VirtuosoHandle} from 'react-virtuoso';
import {Virtuoso} from 'react-virtuoso';
import type {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';
import {useVirtualizedTreeListAutoFocus} from '../../../hooks/useVirtualizedTreeListAutoFocus';
import {useVirtualizedTreeListNodeContent} from '../../../hooks/useVirtualizedTreeListNodeContent';
import {PathSelectorTreeRow} from './PathSelectorTreeRow';

type PathSelectorTreeProps = {
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
    disabledIdSet: ReadonlySet<string>;
    virtuosoRef: RefObject<VirtuosoHandle>;
};

const PATH_SELECTOR_TREE_NAME = 'PathSelectorTree';

const PathSelectorTreeScroller = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
    ({className, ...props}, ref) => (
        <div ref={ref} {...props} className={cn('rounded-sm *:p-1', className)} />
    ),
);
PathSelectorTreeScroller.displayName = 'PathSelectorTreeScroller';

const PathSelectorTreeList = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
    ({className, ...props}, ref) => (
        <div ref={ref} {...props} className={cn('flex flex-col gap-1', className)} />
    ),
);
PathSelectorTreeList.displayName = 'PathSelectorTreeList';

const TREE_VIRTUOSO_COMPONENTS = {
    Scroller: PathSelectorTreeScroller,
    List: PathSelectorTreeList,
};

export const PathSelectorTree = ({
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
    disabledIdSet,
    virtuosoRef,
}: PathSelectorTreeProps): ReactElement => {
    const {selection, onSelectionChange, baseId} = useCombobox();
    const {renderLoadingNode, getNodeContent} = useVirtualizedTreeListNodeContent({
        hasMoreChildren,
        isLoading,
        disabled,
        onLoadMore,
        showMoreLabel,
    });

    const handleTreeSelectionChange = useCallback((nextSelection: ReadonlySet<string>) => {
        if (disabled) {
            return;
        }
        const filtered = Array.from(nextSelection).filter((id) => !disabledIdSet.has(id));
        onSelectionChange(filtered.slice(0, 1));
    }, [disabled, disabledIdSet, onSelectionChange]);

    const getItemInteraction = useCallback((node: typeof items[number]) => {
        if (disabled || node.isLoading || !node.data) {
            return 'none';
        }
        if (!node.data.isSelectable() || disabledIdSet.has(node.id)) {
            return 'navigate-only';
        }
        return 'full';
    }, [disabled, disabledIdSet]);

    useVirtualizedTreeListAutoFocus(baseId);

    return (
        <Combobox.TreeContent style={{height: treeHeight}}>
            <VirtualizedTreeList
                items={items}
                selection={selection}
                onSelectionChange={handleTreeSelectionChange}
                selectionMode='single'
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
                            const loadingNode = renderLoadingNode(node);
                            if (loadingNode) {
                                return loadingNode;
                            }

                            const itemProps = getItemProps(index, node);
                            const content = getNodeContent(node);
                            if (!content) {
                                return null;
                            }

                            const item = node.data;
                            const selectable = (item?.isSelectable() ?? false) && !disabledIdSet.has(node.id) && !disabled;
                            return (
                                <PathSelectorTreeRow
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

PathSelectorTree.displayName = PATH_SELECTOR_TREE_NAME;
