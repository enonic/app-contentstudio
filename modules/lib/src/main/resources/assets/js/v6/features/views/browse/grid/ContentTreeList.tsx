import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {FlatTreeNode, TreeItems, TreeList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {KeyboardEventHandler} from 'preact';
import {useCallback} from 'react';
import {
    $contentTreeItems,
} from '../../../store/contentTreeData.store';
import {
    $contentTreeActiveItem,
    $contentTreeSelection,
    $contentTreeSelectionMode,
    addSelectedItem, hasSelectedItems, isItemSelected, isMultipleSelectionMode, isSingleSelectionMode, removeSelectedItem,
    resetSelection, setActiveItem, setMultipleSelectionMode,
    setSelection,
    setSingleSelectionMode
} from '../../../store/contentTreeSelectionStore';
import {ContentData} from './ContentData';
import {ContentDataFetcher} from './ContentDataFetcher';
import {ContentTreeContextMenu} from './ContentTreeContextMenu';
import {ContentTreeListRow} from './ContentTreeListRow';

const renderItem = (item: FlatTreeNode<ContentData>): React.ReactElement => {
    return (
        <ContentTreeListRow item={item} />
    );
}

export type ContentTreeListProps = {
    fetcher: ContentDataFetcher;
    contextMenuActions?: Action[];
}

export const ContentTreeList = ({fetcher, contextMenuActions = []}: ContentTreeListProps): React.ReactElement => {
    const items = useStore($contentTreeItems);
    const selection = useStore($contentTreeSelection);
    const active = useStore($contentTreeActiveItem);

    const handleSelection = (newSelection: ReadonlySet<string>) => {
        if (newSelection.size > selection.size) {
            const added = Array.from(newSelection).find(x => !selection.has(x));

            if (added) {
                setSelection([added]);
            }
        } else {
            const isMultipleSelectionMode = $contentTreeSelectionMode.get() === 'multiple';
            const removed = Array.from(selection).find(x => !newSelection.has(x));

            if (removed) {
                if (isMultipleSelectionMode && selection.has(removed)) {
                    setSelection([removed]);
                } else {
                    resetSelection();
                }
            }
        }

        setSingleSelectionMode();
    };

    const setItemsHandler = useCallback((newItems: TreeItems<ContentData>) => {
        $contentTreeItems.set(newItems);
    }, []);

    const handleKeyDownCapture: KeyboardEventHandler<HTMLElement> = useCallback((e) => {
        if (e.key === ' ' && active) {
            e.stopPropagation();

            if (isItemSelected(active)) {
                if (isSingleSelectionMode()) {
                    setMultipleSelectionMode();
                } else {
                    removeSelectedItem(active);

                    if (!hasSelectedItems()) {
                        setSingleSelectionMode();
                    }
                }
            } else {
                if (isMultipleSelectionMode()) {
                    addSelectedItem(active);
                } else {
                    setSelection([active]);
                }
            }
        }

    }, [active]);

    const setActive = useCallback((id: string | null) => {
        setActiveItem(id);
    }, []);

    return (
        <TreeList<ContentData>
            className='w-full h-full bg-surface-neutral'
            fetchChildren={fetcher.fetchChildren}
            items={items}
            onItemsChange={setItemsHandler}
            selection={selection}
            onSelectionChange={handleSelection}
            selectionMode={'multiple'}
            onKeyDownCapture={handleKeyDownCapture}
            active={active}
            setActive={setActive}
        >
            <ContentTreeContextMenu actions={contextMenuActions}>
                <TreeList.Container className='px-5 py-2.5 bg-surface-neutral'>
                    <TreeList.Content renderNode={renderItem} />
                </TreeList.Container>
            </ContentTreeContextMenu>
        </TreeList>
    );
};
