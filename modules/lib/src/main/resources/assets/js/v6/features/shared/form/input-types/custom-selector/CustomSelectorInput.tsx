import {ReactElement, useEffect, useMemo, useState} from 'react';
import {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {CustomSelectorConfig} from './CustomSelectorConfig';
import {cn, Combobox} from '@enonic/ui';
import {useI18n} from '../../../../hooks/useI18n';
import {SortableList} from '@enonic/lib-admin-ui/form2/components';
import {ContentId} from '../../../../../../app/content/ContentId';
import {ContentSummary, ContentSummaryBuilder} from '../../../../../../app/content/ContentSummary';
import {CustomSelectorInputComboboxList} from './CustomSelectorComboboxList';
import {CustomSelectorSelectionItemView} from './CustomSelectorSelectionItemView';
import {useCustomSelector} from './useCustomSelector';

export type CustomSelectorItem = {
    id: string;
    displayName: string;
    description?: string;
    iconUrl?: string;
    icon?: {
        data: string;
        type: string;
    };
};

const CUSTOM_SELECTOR_INPUT_NAME = 'CustomSelectorInput';

export const CustomSelectorInput = ({
    onAdd,
    onMove,
    onRemove,
    occurrences,
    config,
    values,
    errors,
    enabled,
}: SelfManagedComponentProps<CustomSelectorConfig>): ReactElement => {
    const selection: string[] = useMemo(() => values.filter((v) => v.isNotNull()).map((v) => v.getString()), [values]);
    const [inputValue, setInputValue] = useState<string | undefined>();
    const {allItems, filteredItems, isLoading, hasError, hasMore, preLoad, load, onSelectionChange} = useCustomSelector({
        config,
        selection,
        query: inputValue,
        onAdd,
        onRemove,
    });
    const selectedItems = useMemo(
        () => selection.map((id) => allItems.find((item) => item.id === id)).filter((item): item is CustomSelectorItem => !!item),
        [allItems, selection]
    );
    const selectedContents = useMemo(() => selectedItems.map(itemToContent), [selectedItems]);

    // i18n
    const placeholder: string = useI18n('field.search.placeholder');
    const emptyLabel: string = useI18n('field.option.noitems');
    const loadingLabel: string = useI18n('field.search.loading');
    const errorLabel: string = useI18n('field.search.error');
    const noExtensionOrServiceLabel: string = useI18n('field.customSelector.noService');

    // Constants
    const resolvedSelectionMode = occurrences.getMaximum() === 1 ? 'single' : 'staged';
    const resolvedListMode = config.galleryMode ? 'flat' : 'list';
    const resolvedPopupLabel = useMemo(() => {
        if (!config.extension && !config.service) return noExtensionOrServiceLabel;
        if (isLoading) return loadingLabel;
        if (hasError) return errorLabel;
        if (filteredItems.length === 0) return emptyLabel;
        return null;
    }, [config.extension, config.service, noExtensionOrServiceLabel, isLoading, loadingLabel, hasError, errorLabel, filteredItems.length, emptyLabel]);
    const resolvedHasErrors = errors.some((error) => error.breaksRequired || error.validationResults.length > 0);
    const disabled = !enabled;

    // Preload data based on the initial selection.
    useEffect(() => {
        void preLoad();
    }, []);

    // Sequential debounced loads based on the input value.
    useEffect(() => {
        void load();
    }, [inputValue, load]);

    return (
        <div data-component={CUSTOM_SELECTOR_INPUT_NAME} className="flex flex-col gap-2.5">
            <Combobox.Root
                value={inputValue}
                onChange={setInputValue}
                selection={selection}
                onSelectionChange={onSelectionChange}
                selectionMode={resolvedSelectionMode}
                disabled={disabled}
                error={resolvedHasErrors}
                contentType="listbox"
            >
                <Combobox.Content>
                    <Combobox.Control>
                        <Combobox.Search>
                            <Combobox.SearchIcon />
                            <Combobox.Input placeholder={placeholder} />
                            {resolvedSelectionMode === 'staged' && <Combobox.Apply />}
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>

                    <Combobox.Portal>
                        <Combobox.Popup>
                            {resolvedPopupLabel && <div className="p-4 text-subtle">{resolvedPopupLabel}</div>}
                            {!hasError && filteredItems.length > 0 && (
                                <CustomSelectorInputComboboxList
                                    items={filteredItems}
                                    selectionMode={resolvedSelectionMode}
                                    listMode={resolvedListMode}
                                    isLoading={isLoading}
                                    onLoadMore={load}
                                    hasMore={hasMore}
                                />
                            )}
                        </Combobox.Popup>
                    </Combobox.Portal>
                </Combobox.Content>
            </Combobox.Root>

            <SortableList
                items={selectedContents}
                fullRowDraggable
                keyExtractor={(content) => content.getId()}
                onMove={onMove}
                enabled={!disabled}
                className="@container"
                renderItem={(context) => (
                    <CustomSelectorSelectionItemView
                        context={context}
                        items={allItems}
                        listMode={resolvedListMode}
                        onRemove={onRemove}
                        className="py-2"
                    />
                )}
            />
        </div>
    );
};

CustomSelectorInput.displayName = CUSTOM_SELECTOR_INPUT_NAME;

//
// * Helpers
//
function itemToContent(item: CustomSelectorItem): ContentSummary {
    const contentId = new ContentId(item.id);

    return new ContentSummary(
        new ContentSummaryBuilder().setId(contentId.toString()).setContentId(contentId).setDisplayName(item.displayName)
    );
}
