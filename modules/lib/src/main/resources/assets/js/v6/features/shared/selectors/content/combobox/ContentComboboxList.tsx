import {Combobox, VirtualizedTreeList, cn, useCombobox} from '@enonic/ui';
import {Loader2} from 'lucide-react';
import {forwardRef, useCallback, type HTMLAttributes, type ReactElement, type RefObject} from 'react';
import type {ListRange, VirtuosoHandle} from 'react-virtuoso';
import {Virtuoso} from 'react-virtuoso';
import type {ContentComboboxFlatNode} from '../../../../hooks/useContentComboboxData';
import {getLoadingNodeParentId} from '../../../../hooks/useContentComboboxData';
import {ContentRow, type ContentRowProps} from '../../shared/combobox/ContentRow';

//
// * Types
//

export type ContentComboboxListProps = {
    items: ContentComboboxFlatNode[];
    mode: 'tree' | 'flat';
    activeId: string | null;
    onActiveChange: (id: string | null) => void;
    onExpand?: (id: string) => void;
    onCollapse?: (id: string) => void;
    onLoadMore?: (parentId: string | null) => void;
    onEndReached?: () => void;
    height: number;
    ariaLabel: string;
    emptyLabel: string;
    isLoading: boolean;
    hasMore?: boolean;
    virtuosoRef?: RefObject<VirtuosoHandle>;
    /** Custom row renderer */
    rowRenderer?: (props: ContentRowProps) => ReactElement;
};

//
// * Virtuoso Components
//

const virtuosoComponents = {
    Scroller: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, className, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className={cn('rounded-sm *:p-1', className)}>
            {children}
        </div>
    )),
    List: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, className, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className={cn('flex flex-col gap-y-1.5', className)}>
            {children}
        </div>
    )),
};

//
// * Component
//

export const ContentComboboxList = ({
    items,
    mode,
    activeId,
    onActiveChange,
    onExpand,
    onCollapse,
    onLoadMore,
    onEndReached,
    height,
    ariaLabel,
    emptyLabel,
    isLoading,
    hasMore,
    virtuosoRef,
    rowRenderer,
}: ContentComboboxListProps): ReactElement => {
    const {selection, onSelectionChange, selectionMode} = useCombobox();
    const showExpandControl = mode === 'tree';

    // Convert Set changes to array for Combobox's staged selection
    // Also filter out non-selectable items
    const handleSelectionChange = useCallback(
        (newSelection: ReadonlySet<string>) => {
            // Filter out non-selectable items
            const selectableIds = Array.from(newSelection).filter((id) => {
                const item = items.find((i) => i.id === id);
                // Allow selection if item not found (might be from previous selection)
                // or if item is selectable
                return !item || item.data?.selectable !== false;
            });
            onSelectionChange(selectableIds);
        },
        [onSelectionChange, items]
    );

    // Trigger load more when loading nodes become visible
    // Optimized: only scan visible range and short-circuit on first loading node
    const handleRangeChange = useCallback(
        (range: ListRange) => {
            if (!onLoadMore) return;

            // Only scan visible range (startIndex to endIndex)
            for (let i = range.startIndex; i <= range.endIndex && i < items.length; i++) {
                const node = items[i];
                if (node.nodeType === 'loading') {
                    const parentId = getLoadingNodeParentId(node.id);
                    // parentId is null for root loading nodes
                    onLoadMore(parentId);
                    // Short-circuit after finding first loading node
                    // (typically only one loading node visible at a time)
                    break;
                }
            }
        },
        [items, onLoadMore]
    );

    if (isLoading) {
        return (
            <VirtualizedTreeList.RowLoading level={1} className="h-14">
                <Loader2 className="ml-2 size-6 animate-spin text-subtle" />
            </VirtualizedTreeList.RowLoading>
        );
    }

    if (items.length === 0) {
        return (
            <VirtualizedTreeList.RowPlaceholder level={1} className="h-14">
                <span className="ml-2 text-subtle">{emptyLabel}</span>
            </VirtualizedTreeList.RowPlaceholder>
        );
    }

    return (
        <Combobox.TreeContent style={{height}}>
            <VirtualizedTreeList
                items={items}
                preserveFilteredSelection
                clearSelectionOnEscape={false}
                selection={selection}
                rowClickSelection="toggle"
                onSelectionChange={handleSelectionChange}
                selectionMode={selectionMode}
                active={activeId}
                onActiveChange={onActiveChange}
                onExpand={onExpand}
                onCollapse={onCollapse}
                virtuosoRef={virtuosoRef}
                aria-label={ariaLabel}
                className="h-full"
            >
                {({items: visibleItems, getItemProps, containerProps}) => (
                    <Virtuoso<ContentComboboxFlatNode>
                        ref={virtuosoRef}
                        data={visibleItems as ContentComboboxFlatNode[]}
                        components={virtuosoComponents}
                        {...containerProps}
                        className={cn('h-full @container', containerProps.className)}
                        rangeChanged={mode === 'tree' ? handleRangeChange : undefined}
                        endReached={mode === 'flat' && hasMore ? onEndReached : undefined}
                        itemContent={(index, node) => {
                            const hasCustomRowRenderer = rowRenderer !== undefined;

                            const props = {
                                node,
                                mode,
                                itemProps: getItemProps(index, node),
                                showExpandControl,
                                showStatusBadge: true,
                                onExpand,
                                onCollapse,
                            };

                            return hasCustomRowRenderer ? rowRenderer(props) : <ContentRow {...props} />;
                        }}
                    />
                )}
            </VirtualizedTreeList>
        </Combobox.TreeContent>
    );
};

ContentComboboxList.displayName = 'ContentComboboxList';
