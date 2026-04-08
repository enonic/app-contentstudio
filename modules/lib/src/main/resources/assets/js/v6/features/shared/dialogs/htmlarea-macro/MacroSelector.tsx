import type {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {Combobox, IconButton, Listbox} from '@enonic/ui';
import {XIcon} from 'lucide-react';
import {type ReactElement, useCallback, useId, useMemo, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaMacroDialogContext} from './HtmlAreaMacroDialogContext';

const COMPONENT_NAME = 'MacroSelector';

export const MacroSelector = (): ReactElement => {
    const {
        state: {macros, macrosLoading, selectedDescriptor},
        validationErrors,
        selectDescriptor,
        deselectDescriptor,
    } = useHtmlAreaMacroDialogContext();

    const label = useI18n('dialog.macro.formitem.macro');
    const baseId = useId();
    const inputId = `${COMPONENT_NAME}-${baseId}-input`;
    const [searchValue, setSearchValue] = useState('');

    const filtered = useMemo(() => {
        if (!searchValue) {
            return macros;
        }
        const q = searchValue.trim().toLowerCase();
        return macros.filter(m => m.getDisplayName().toLowerCase().includes(q));
    }, [macros, searchValue]);

    const selection = useMemo(
        () => selectedDescriptor ? [selectedDescriptor.getKey().getRefString()] : [],
        [selectedDescriptor],
    );

    const handleSelectionChange = useCallback((newSelection: readonly string[]) => {
        if (newSelection.length > 0) {
            const selected = macros.find(m => m.getKey().getRefString() === newSelection[0]);
            if (selected) {
                selectDescriptor(selected);
            }
        } else {
            deselectDescriptor();
        }
    }, [macros, selectDescriptor, deselectDescriptor]);

    const error = validationErrors.macro;

    const hasSelection = selectedDescriptor != null;

    return (
        <div data-component={COMPONENT_NAME} className='flex flex-col gap-2'>
            <label htmlFor={inputId} className='font-semibold'>{`${label} *`}</label>

            {!hasSelection && (
                <Combobox.Root
                    value={searchValue}
                    onChange={setSearchValue}
                    selection={selection}
                    onSelectionChange={handleSelectionChange}
                    selectionMode='single'
                    contentType='listbox'
                >
                    <Combobox.Content>
                        <Combobox.Control>
                            <Combobox.Search>
                                <Combobox.SearchIcon />
                                <Combobox.Input id={inputId} placeholder={label} />
                                <Combobox.Toggle />
                            </Combobox.Search>
                        </Combobox.Control>
                        <Combobox.Portal>
                            <Combobox.Popup>
                                <MacroSelectorList items={filtered} loading={macrosLoading} />
                            </Combobox.Popup>
                        </Combobox.Portal>
                    </Combobox.Content>
                </Combobox.Root>
            )}

            {hasSelection && (
                <MacroSelectedView descriptor={selectedDescriptor} onRemove={deselectDescriptor} />
            )}

            {error && <span className='text-sm text-error'>{error}</span>}
        </div>
    );
};

MacroSelector.displayName = COMPONENT_NAME;

type MacroSelectorListProps = {
    items: MacroDescriptor[];
    loading: boolean;
};

const MacroSelectorList = ({items, loading}: MacroSelectorListProps): ReactElement => {
    const loadingLabel = useI18n('dialog.macro.list.loading');
    const emptyLabel = useI18n('dialog.macro.list.empty');

    if (loading) {
        return (
            <Combobox.ListContent className='max-h-60 rounded-sm'>
                <div className='px-4 py-3 text-sm text-subtle'>{loadingLabel}</div>
            </Combobox.ListContent>
        );
    }

    return (
        <Combobox.ListContent className='max-h-60 rounded-sm'>
            {items.map((macro) => {
                const key = macro.getKey().getRefString();

                return (
                    <Listbox.Item key={key} value={key}>
                        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                            {macro.getIconUrl() && (
                                <img
                                    src={macro.getIconUrl()}
                                    alt=''
                                    className='size-6 shrink-0 object-contain'
                                />
                            )}
                            <div className='min-w-0 flex-1'>
                                <span className='block text-sm font-medium truncate'>
                                    {macro.getDisplayName()}
                                </span>
                                {macro.getDescription() && (
                                    <span className='block text-xs text-subtle truncate'>
                                        {macro.getDescription()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Listbox.Item>
                );
            })}
            {items.length === 0 && (
                <div className='px-4 py-3 text-sm text-subtle'>{emptyLabel}</div>
            )}
        </Combobox.ListContent>
    );
};

MacroSelectorList.displayName = 'MacroSelectorList';

type MacroSelectedViewProps = {
    descriptor: MacroDescriptor;
    onRemove: () => void;
};

const MacroSelectedView = ({descriptor, onRemove}: MacroSelectedViewProps): ReactElement => {
    return (
        <div className='flex items-center gap-2.5 min-w-0'>
            {descriptor.getIconUrl() && (
                <img
                    src={descriptor.getIconUrl()}
                    alt=''
                    className='size-8 shrink-0 object-contain'
                />
            )}
            <div className='min-w-0 flex-1'>
                <span className='font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis'>
                    {descriptor.getDisplayName()}
                </span>
                {descriptor.getDescription() && (
                    <span className='text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis'>
                        {descriptor.getDescription()}
                    </span>
                )}
            </div>
            <div className='flex gap-1.5 shrink-0'>
                <IconButton icon={XIcon} onClick={onRemove} />
            </div>
        </div>
    );
};

MacroSelectedView.displayName = 'MacroSelectedView';
