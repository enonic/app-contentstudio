import {isLoadingPlaceholder, TreeList, useTreeList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {KeyboardEventHandler} from 'preact';
import {useCallback} from 'react';
import {
    $contentTreeItems,
} from '../../../store/contentTreeData.store';
import {$contentTreeRootLoadingState} from '../../../store/contentTreeLoadingStore';
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
import {ContentTreeListLoadingRow} from './ContentTreeListLoadingRow';
import {ContentTreeListRow} from './ContentTreeListRow';

const TreeListRowsWithContext = (): React.ReactElement => {
    const loadingState = useStore($contentTreeRootLoadingState);

    if (loadingState === 'requested') {
        const item: ContentData = {
            id: 'root-loading-placeholder',
            displayName: '',
            name: '',
            workflowStatus: null,
            contentType: null,
            contentStatus: null,
            iconUrl: null,
            item: null,
            path: [null],
        }
        return (
            <ContentTreeListLoadingRow key={item.id} item={item}/>
        )
    }

    const {items} = useTreeList<ContentData>();

    return (
        <>
            {items.map(item =>
                isLoadingPlaceholder(item) ? <ContentTreeListLoadingRow key={item.id} item={item}/> : <ContentTreeListRow item={item}
                                                                                                                          key={item.id}/>
            )}
        </>
    );
};

export type ContentTreeListProps = {
    fetcher: ContentDataFetcher;
}

export const ContentTreeList = ({fetcher}: ContentTreeListProps): React.ReactElement => {
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

    const setItemsHandler = useCallback((newItems: ContentData[]) => {
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
            className={'w-full h-full bg-surface-neutral'}
            fetchChildren={fetcher.fetchChildren}
            items={items}
            setItems={setItemsHandler}
            selection={selection}
            onSelectionChange={handleSelection}
            selectionMode={'multiple'}
            onKeyDownCapture={handleKeyDownCapture}
            active={active}
            setActive={setActive}
        >
            <TreeList.Container className={'px-5 py-2.5'}>
                <TreeList.Content load={false}>
                    <TreeListRowsWithContext/>
                </TreeList.Content>
            </TreeList.Container>
        </TreeList>
    );
}
