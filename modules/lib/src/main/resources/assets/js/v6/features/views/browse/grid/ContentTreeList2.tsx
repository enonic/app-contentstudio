import {Checkbox, VirtualizedTreeList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Loader2, LoaderCircle} from 'lucide-react';
import type {HTMLAttributes, KeyboardEventHandler} from 'react';
import {forwardRef, useCallback, useEffect, useRef} from 'react';
import type {VirtuosoHandle} from 'react-virtuoso';
import {Virtuoso} from 'react-virtuoso';
import {EditContentEvent} from '../../../../../app/event/EditContentEvent';
import {fetchChildren, fetchRootChildrenFiltered} from '../../../api/content-fetcher';
import type {FlatNode} from '../../../lib/tree-store';
import {ItemLabel} from '../../../shared/ItemLabel';
import {ProgressBar} from '../../../shared/primitives/ProgressBar';
import {
    $contentTreeActiveItem,
    $contentTreeSelection,
    $contentTreeSelectionMode,
    addSelectedItem,
    getSelectedItems,
    hasSelectedItems,
    isItemSelected,
    isMultipleSelectionMode,
    isSingleSelectionMode,
    removeSelectedItem,
    setActiveItem,
    setMultipleSelectionMode,
    setSelection,
    setSingleSelectionMode,
} from '../../../store/contentTreeSelectionStore';
import {
    $mergedFlatNodes,
    collapseNode,
    expandNode,
    nodeNeedsChildrenLoad,
} from '../../../store/tree-list.store';
import type {ContentData} from './ContentData';
import {ContentTreeContextMenu, type ContentTreeContextMenuProps} from './ContentTreeContextMenu';
import {ContentTreeListItem} from './ContentTreeListItem';
import type {ContentUploadData} from './ContentUploadData';

//
// * Types
//

type ContentFlatNode = FlatNode<ContentData | ContentUploadData>;

//
// * Type checking helpers (not type guards to avoid narrowing issues)
//

function hasProgressData(data: unknown): data is ContentUploadData {
    return data !== null && typeof data === 'object' && 'progress' in data;
}

function hasDisplayNameData(data: unknown): data is ContentData {
    return data !== null && typeof data === 'object' && 'displayName' in data;
}

//
// * Render Helper
//

type GetItemPropsReturn = {
    id: string;
    'data-index': number;
    role: 'treeitem';
    'aria-selected': boolean | undefined;
    'aria-expanded': boolean | undefined;
    'aria-level': number;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
    active: boolean;
    selected: boolean;
};

function renderRow(
    node: ContentFlatNode,
    index: number,
    getItemProps: (index: number, node: unknown) => GetItemPropsReturn,
    handleCheckboxClick: (e: React.MouseEvent<HTMLDivElement>, data: ContentData) => void,
    handleContextMenu: (data: ContentData) => void,
    handleExpand: (id: string) => void,
    handleCollapse: (id: string) => void
): React.ReactElement | null {
    const {id, level, isExpanded, hasChildren, nodeType, data} = node;

    // Upload row
    if (hasProgressData(data)) {
        return <ContentTreeListUploadRow item={node as FlatNode<ContentUploadData>} />;
    }

    // Loading indicator
    if (nodeType === 'loading' || data === null) {
        return (
            <VirtualizedTreeList.RowLoading level={level} className='min-h-12'>
                <Loader2 className='ml-13.5 size-6 animate-spin text-subtle' />
            </VirtualizedTreeList.RowLoading>
        );
    }

    // Content row
    if (hasDisplayNameData(data)) {
        const itemProps = getItemProps(index, node);

        return (
            <div onClickCapture={(e) => handleCheckboxClick(e, data)}>
                <VirtualizedTreeList.Row
                    {...itemProps}
                    onContextMenu={() => handleContextMenu(data)}
                >
                    <VirtualizedTreeList.RowLeft>
                        <ContentTreeListRowSelectionControl data={data} selected={itemProps.selected} />
                        <VirtualizedTreeList.RowLevelSpacer level={level} />
                        <VirtualizedTreeList.RowExpandControl
                            rowId={id}
                            expanded={isExpanded}
                            hasChildren={hasChildren}
                            onToggle={() => (isExpanded ? handleCollapse(id) : handleExpand(id))}
                            selected={itemProps.selected}
                        />
                    </VirtualizedTreeList.RowLeft>
                    <VirtualizedTreeList.RowContent>
                        <ContentTreeListItem content={data} />
                    </VirtualizedTreeList.RowContent>
                </VirtualizedTreeList.Row>
            </div>
        );
    }

    return null;
}

//
// * Virtuoso Custom Components
//

const virtuosoComponents = {
    Scroller: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className="*:p-1">
            {children}
        </div>
    )),
    List: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className="flex flex-col gap-y-1.5">
            {children}
        </div>
    )),
};

//
// * Row Selection Control
//

type ContentTreeListRowSelectionControlProps = {
    data: ContentData | ContentUploadData | null;
    selected: boolean;
};

const ContentTreeListRowSelectionControl = ({
    data,
    selected,
}: ContentTreeListRowSelectionControlProps): React.ReactElement => {
    const selectionMode = useStore($contentTreeSelectionMode);

    if (!data || !('displayName' in data)) {
        return <span className="w-3.5" />;
    }

    return (
        <Checkbox
            className="content-tree-row-checkbox relative z-0 after:absolute after:-inset-2 after:content-[''] after:rounded-sm after:pointer-events-auto after:-z-10"
            tabindex={-1}
            key={data.id}
            id={'content-tree-' + data.id}
            checked={selectionMode === 'multiple' && selected}
        />
    );
};

//
// * Upload Row
//

type ContentTreeListUploadRowProps = {
    item: FlatNode<ContentUploadData>;
};

const ContentTreeListUploadRow = ({item}: ContentTreeListUploadRowProps): React.ReactElement => {
    return (
        <VirtualizedTreeList.Row active={false} selected={false}>
            <VirtualizedTreeList.RowLeft>
                <span className="w-3.5" />
                <VirtualizedTreeList.RowLevelSpacer level={item.level} />
                <span className="size-5 shrink-0" />
            </VirtualizedTreeList.RowLeft>
            <VirtualizedTreeList.RowContent>
                <div className="flex items-center justify-between gap-2.5">
                    <ItemLabel
                        icon={<LoaderCircle size={24} className="animate-spin" />}
                        primary={item.data.name}
                        secondary={item.data.name}
                    />
                    <ProgressBar className="w-[134px] h-2.5" value={item.data.progress} />
                </div>
            </VirtualizedTreeList.RowContent>
        </VirtualizedTreeList.Row>
    );
};

//
// * Main Component
//

export type ContentTreeList2Props = {
    contextMenuActions?: ContentTreeContextMenuProps['actions'];
};

export const ContentTreeList2 = ({contextMenuActions = {}}: ContentTreeList2Props): React.ReactElement => {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const flatNodes = useStore($mergedFlatNodes);
    const selection = useStore($contentTreeSelection);
    const activeId = useStore($contentTreeActiveItem);

    // Load root on mount
    useEffect(() => {
        fetchRootChildrenFiltered();
    }, []);

    // Handle expand
    const handleExpand = useCallback((id: string) => {
        expandNode(id);
        if (nodeNeedsChildrenLoad(id)) {
            fetchChildren(id);
        }
    }, []);

    // Handle collapse
    const handleCollapse = useCallback((id: string) => {
        collapseNode(id);
    }, []);

    // Handle selection change from VirtualizedTreeList
    const handleSelectionChange = useCallback(
        (newSelection: ReadonlySet<string>) => {
            if (newSelection.size > selection.size) {
                const added = Array.from(newSelection).find((x) => !selection.has(x));
                if (added) {
                    setSelection([added]);
                }
            } else {
                const isMultiple = $contentTreeSelectionMode.get() === 'multiple';
                const removed = Array.from(selection).find((x) => !newSelection.has(x));

                if (removed) {
                    if (isMultiple && selection.has(removed)) {
                        setSelection([removed]);
                    } else {
                        setSelection([]);
                    }
                }
            }

            setSingleSelectionMode();
        },
        [selection]
    );

    // Handle active change
    const handleActiveChange = useCallback((id: string | null) => {
        setActiveItem(id);
    }, []);

    // Handle activation (Enter or double-click)
    const handleActivate = useCallback(
        (id: string) => {
            const node = flatNodes.find((n) => n.id === id);
            if (node && hasDisplayNameData(node.data) && node.data.item) {
                new EditContentEvent([node.data.item]).fire();
            }
        },
        [flatNodes]
    );

    // Handle keyboard (space for multi-select toggle)
    const handleKeyDownCapture: KeyboardEventHandler<HTMLElement> = useCallback(
        (e) => {
            if (e.key === ' ' && activeId) {
                e.stopPropagation();

                if (isItemSelected(activeId)) {
                    if (isSingleSelectionMode()) {
                        setMultipleSelectionMode();
                    } else {
                        removeSelectedItem(activeId);

                        if (!hasSelectedItems()) {
                            setSingleSelectionMode();
                        }
                    }
                } else {
                    if (isMultipleSelectionMode()) {
                        addSelectedItem(activeId);
                    } else {
                        setSelection([activeId]);
                    }
                }
            }
        },
        [activeId]
    );

    // Handle checkbox click
    const handleCheckboxClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>, data: ContentData) => {
            const target = e.target as HTMLElement;
            const isCheckboxClick = target.closest('.content-tree-row-checkbox') !== null;

            if (isCheckboxClick) {
                e.stopPropagation();

                const selectionMode = $contentTreeSelectionMode.get();

                if (selectionMode === 'multiple') {
                    if (isItemSelected(data.id)) {
                        removeSelectedItem(data.id);

                        if (!hasSelectedItems()) {
                            setSingleSelectionMode();
                        }
                    } else {
                        addSelectedItem(data.id);
                    }
                } else {
                    setMultipleSelectionMode();
                    setSelection([data.id]);
                }
            }
        },
        []
    );

    // Handle context menu (right-click selection)
    const handleContextMenu = useCallback((data: ContentData) => {
        const selectedItems = getSelectedItems();
        const isAlreadySelected = selectedItems.find((content) => content.getId() === data.item?.getId());

        if (isAlreadySelected) return;

        setSingleSelectionMode();
        setActiveItem(null);
        setSelection([data.id]);
    }, []);

    return (
        <VirtualizedTreeList
            items={flatNodes}
            selection={selection}
            onSelectionChange={handleSelectionChange}
            selectionMode="multiple"
            active={activeId}
            onActiveChange={handleActiveChange}
            onExpand={handleExpand}
            onCollapse={handleCollapse}
            onActivate={handleActivate}
            virtuosoRef={virtuosoRef}
            aria-label="Content browser"
            className="w-full flex-1 min-h-0"
            onKeyDownCapture={handleKeyDownCapture}
        >
            {({items, getItemProps, containerProps}) => (
                <ContentTreeContextMenu actions={contextMenuActions}>
                    <Virtuoso
                        ref={virtuosoRef}
                        data={items as ContentFlatNode[]}
                        className="h-full px-5 py-2.5 bg-surface-neutral"
                        components={virtuosoComponents}
                        {...containerProps}
                        itemContent={(index, node) =>
                            renderRow(node, index, getItemProps, handleCheckboxClick, handleContextMenu, handleExpand, handleCollapse)
                        }
                    />
                </ContentTreeContextMenu>
            )}
        </VirtualizedTreeList>
    );
};
