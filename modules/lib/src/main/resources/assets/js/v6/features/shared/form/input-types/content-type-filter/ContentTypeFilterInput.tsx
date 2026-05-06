import type {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {SortableGridList} from '@enonic/lib-admin-ui/form2/components';
import {Combobox} from '@enonic/ui';
import {type ReactElement, useMemo, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import type {ContentTypeFilterConfig} from './ContentTypeFilterConfig';
import {ContentTypeFilterComboboxList} from './ContentTypeFilterComboboxList';
import {ContentTypeFilterSelectionItemView} from './ContentTypeFilterSelectionItemView';
import {useContentTypeFilter} from './useContentTypeFilter';
import {useSelectorInputHasError} from '../hooks';

const COMPONENT_NAME = 'ContentTypeFilterInput';

export const ContentTypeFilterInput = ({
    values,
    onAdd,
    onRemove,
    onMove,
    config,
    errors,
    occurrences,
    enabled,
}: SelfManagedComponentProps<ContentTypeFilterConfig>): ReactElement => {
    const [inputValue, setInputValue] = useState<string | undefined>();
    const selection: string[] = useMemo(() => values.filter((v) => v.isNotNull()).map((v) => v.getString()), [values]);
    const {allContentTypes, filteredContentTypes, isLoading, hasError, onSelectionChange} = useContentTypeFilter({
        config,
        selection,
        query: inputValue,
        onAdd,
        onRemove,
    });

    // i18n
    const placeholder = useI18n('field.option.placeholder');
    const loadingLabel: string = useI18n('field.search.loading');
    const emptyLabel = useI18n('field.option.noitems');
    const errorLabel = useI18n('field.search.error');

    // Constants
    const resolvedSelectionMode = occurrences.getMaximum() === 1 ? 'single' : 'staged';
    const resolvedHasErrors = useSelectorInputHasError(occurrences, errors);
    const disabled = !enabled;
    const popupLabel = useMemo(() => {
        if (isLoading) return loadingLabel;
        if (hasError) return errorLabel;
        if (filteredContentTypes.length === 0) return emptyLabel;
        return undefined;
    }, [isLoading, loadingLabel, hasError, errorLabel, filteredContentTypes.length, emptyLabel]);

    // Memoized values
    const selectedContentTypes = useMemo(
        () => selection.map((name) => allContentTypes.find((ct) => ct.getContentTypeName().toString() === name)).filter(Boolean),
        [selection, allContentTypes]
    );

    return (
        <div data-component={COMPONENT_NAME} className="flex flex-col gap-2.5">
            <Combobox.Root
                value={inputValue}
                onChange={setInputValue}
                selection={selection}
                onSelectionChange={onSelectionChange}
                selectionMode={resolvedSelectionMode}
                disabled={disabled}
                error={resolvedHasErrors}
                closeOnBlur
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
                            {popupLabel && <div className="p-4 text-subtle">{popupLabel}</div>}
                            {!hasError && filteredContentTypes.length > 0 && <ContentTypeFilterComboboxList items={filteredContentTypes} />}
                        </Combobox.Popup>
                    </Combobox.Portal>
                </Combobox.Content>
            </Combobox.Root>

            <SortableGridList
                items={selectedContentTypes}
                keyExtractor={(ct) => ct.getContentTypeName().toString()}
                onMove={onMove}
                enabled={!disabled}
                fullRowDraggable
                renderItem={(context) => <ContentTypeFilterSelectionItemView context={context} onRemove={onRemove} className="py-2" />}
            />
        </div>
    );
};

ContentTypeFilterInput.displayName = COMPONENT_NAME;
