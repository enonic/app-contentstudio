import {SortableGridList} from '@enonic/lib-admin-ui/form2/components/sortable-grid-list';
import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $isSortDialogReady,
    $sortDialog,
    reorderSortDialogItems,
    setSortDialogOrderSelection,
    startSortDialogManualReorder,
    submitSortDialogAction,
} from '../../../store/dialogs/sortDialog.store';
import type {SortOrderOptionId} from '../../../store/dialogs/sortDialog.types';
import {SortContentListItem} from '../../items';
import {SortElementSelector} from '../../selectors/SortElementSelector';

const SORT_DIALOG_MAIN_CONTENT_NAME = 'SortDialogMainContent';

export const SortDialogMainContent = (): ReactElement => {
    const {items, loading, failed, selectedOptionId} = useStore($sortDialog, {
        keys: ['items', 'loading', 'failed', 'selectedOptionId'],
    });
    const canSave = useStore($isSortDialogReady);

    const title = useI18n('dialog.sort');
    const sortElementLabel = useI18n('field.sortElement');
    const sortElementEmptyLabel = useI18n('field.sortElement.missing');
    const ascendingLabel = useI18n('field.sortType.ascending');
    const descendingLabel = useI18n('field.sortType.descending');
    const alphabeticalAscendingLabel = useI18n('field.sortType.alphabetical.ascending');
    const alphabeticalDescendingLabel = useI18n('field.sortType.alphabetical.descending');
    const loadErrorLabel = useI18n('dialog.sort.items.failed');
    const loadingLabel = useI18n('dialog.sort.items.loading');

    const modifiedLabel = useI18n('field.sortType.modified');
    const createdLabel = useI18n('field.sortType.created');
    const displayNameLabel = useI18n('field.sortType.displayName');
    const publishLabel = useI18n('field.sortType.publish');
    const manualLabel = useI18n('field.sortType.manual');
    const saveLabel = useI18n('action.save');
    const reorderLabel = useI18n('field.occurrence.action.reorder');

    const sortElementOptions: {id: SortOrderOptionId; label: string}[] = [
        {id: 'modified:ASC', label: `${modifiedLabel} (${ascendingLabel})`},
        {id: 'modified:DESC', label: `${modifiedLabel} (${descendingLabel})`},
        {id: 'created:ASC', label: `${createdLabel} (${ascendingLabel})`},
        {id: 'created:DESC', label: `${createdLabel} (${descendingLabel})`},
        {id: 'displayName:ASC', label: `${displayNameLabel} (${alphabeticalAscendingLabel})`},
        {id: 'displayName:DESC', label: `${displayNameLabel} (${alphabeticalDescendingLabel})`},
        {id: 'publish:ASC', label: `${publishLabel} (${ascendingLabel})`},
        {id: 'publish:DESC', label: `${publishLabel} (${descendingLabel})`},
        {id: 'manual', label: manualLabel},
    ];
    const isManualSorting = selectedOptionId === 'manual';

    return (
        <Dialog.Content className='w-full h-full gap-7.5 sm:h-fit md:min-w-184 md:max-w-220'>
            <Dialog.DefaultHeader title={title} withClose >
                <SortElementSelector
                    label={sortElementLabel}
                    emptyLabel={sortElementEmptyLabel}
                    options={sortElementOptions}
                    selection={[selectedOptionId]}
                    onSelectionChange={setSortDialogOrderSelection}
                    disabled={loading}
                    className='flex flex-col gap-2.5 col-start-1 row-start-3 col-span-2 min-w-0'
                />
            </Dialog.DefaultHeader>
            <Dialog.Body className='flex flex-col gap-5 focus-within:outline-none focus-within:ring-3 focus-within:ring-ring focus-within:ring-offset-3 focus-within:ring-offset-ring-offset focus-within:border-bdr-solid rounded-sm'>
                {loading && <span>{loadingLabel}</span>}
                {!loading && failed && <span>{loadErrorLabel}</span>}
                {!loading && !failed && items.length > 0 && (
                    <SortableGridList
                        items={items}
                        keyExtractor={(item) => item.getId()}
                        onMove={(fromIndex, toIndex) => {
                            if (!isManualSorting) {
                                startSortDialogManualReorder();
                            }
                            reorderSortDialogItems(fromIndex, toIndex);
                        }}
                        enabled={isManualSorting}
                        fullRowDraggable
                        dragLabel={reorderLabel}
                        className='flex flex-col gap-y-2.5'
                        itemClassName='[&>button]:hidden'
                        renderItem={({item, isFocused, isMovable}) => (
                            <SortContentListItem
                                content={item}
                                variant='detailed'
                                dragEnabled={isManualSorting}
                                inverseTone={false}
                                selected={isMovable}
                                isFocused={isFocused && !isMovable}
                                isMovable={isMovable}
                                className='flex-1 bg-unset'
                            />
                        )}
                    />
                )}
            </Dialog.Body>
            <Dialog.Footer>
                <Button
                    size='lg'
                    variant='solid'
                    label={saveLabel}
                    disabled={!canSave}
                    onClick={() => {
                        void submitSortDialogAction();
                    }}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

SortDialogMainContent.displayName = SORT_DIALOG_MAIN_CONTENT_NAME;
