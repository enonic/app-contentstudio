import {Combobox, Listbox, cn} from '@enonic/ui';
import {useEffect, useMemo, useState, type ReactElement} from 'react';
import {buildKey} from '../../utils/format/keys';

export type LanguageSelectorOption = {
    id: string;
    label: string;
    disabled?: boolean;
};

export type LanguageSelectorProps = {
    label: string;
    options: LanguageSelectorOption[];
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    className?: string;
};

const LANGUAGE_SELECTOR_NAME = 'LanguageSelector';

const toOptionKey = (value: string): string => buildKey(value);

const matchesQuery = (option: LanguageSelectorOption, normalizedQuery: string): boolean => {
    if (!normalizedQuery) {
        return true;
    }

    return option.label.toLowerCase().includes(normalizedQuery);
};

export const LanguageSelector = ({
    label,
    options,
    selection,
    onSelectionChange,
    disabled = false,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    className,
}: LanguageSelectorProps): ReactElement => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const selectedIds = selection ?? [];
    const safeSelection = useMemo(() => selectedIds.map(toOptionKey), [selectedIds]);

    const optionMap = useMemo(() => new Map(options.map(option => [option.id, option])), [options]);
    const optionKeyMap = useMemo(() => {
        return new Map(options.map(option => [toOptionKey(option.id), option.id]));
    }, [options]);
    const selectionDisplay = useMemo(() => {
        const selectedId = selectedIds[0];
        return selectedId ? optionMap.get(selectedId)?.label ?? selectedId : '';
    }, [selectedIds, optionMap]);

    useEffect(() => {
        if (!open) {
            setInputValue(selectionDisplay);
        }
    }, [open, selectionDisplay]);

    const visibleOptions = useMemo(() => {
        if (!open) {
            return options;
        }

        const normalizedQuery = inputValue.trim().toLowerCase();
        return options.filter(option => matchesQuery(option, normalizedQuery));
    }, [open, options, inputValue]);

    const handleOpenChange = (next: boolean): void => {
        setOpen(next);
        if (next && !open) {
            setInputValue('');
        }
    };

    const handleSelectionChange = (next: readonly string[]): void => {
        const decodedSelection = next.map((value) => optionKeyMap.get(value) ?? value);
        const selectedIds = decodedSelection.slice(0, 1);
        const selectedId = selectedIds[0];
        const nextDisplay = selectedId ? optionMap.get(selectedId)?.label ?? selectedId : '';

        setInputValue(nextDisplay);
        onSelectionChange(selectedIds);
    };

    return (
        <div
            data-component={LANGUAGE_SELECTOR_NAME}
            className={cn('flex flex-col gap-2.5', className)}>
            <span className='text-md font-semibold text-subtle'>{label}</span>
            <Combobox.Root
                open={open}
                onOpenChange={handleOpenChange}
                value={inputValue}
                onChange={setInputValue}
                selectionMode='single'
                selection={safeSelection}
                onSelectionChange={handleSelectionChange}
                disabled={disabled}
            >
                <Combobox.Content className='relative'>
                    <Combobox.Control>
                        <Combobox.Search>
                            <Combobox.SearchIcon />
                            <Combobox.Input
                                placeholder={searchPlaceholder ?? placeholder}
                                aria-label={label}
                            />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>

                    <Combobox.Popup>
                        <Listbox.Content className='max-h-64 rounded-sm' label={label}>
                            {visibleOptions.length === 0 && emptyLabel ? (
                                <div className='px-4.5 py-2 text-sm text-subtle'>{emptyLabel}</div>
                            ) : (
                                visibleOptions.map(option => (
                                    <Listbox.Item
                                        key={option.id}
                                        value={toOptionKey(option.id)}
                                        disabled={option.disabled}
                                    >
                                        <span className='text-sm font-medium group-data-[tone=inverse]:text-alt'>
                                            {option.label}
                                        </span>
                                    </Listbox.Item>
                                ))
                            )}
                        </Listbox.Content>
                    </Combobox.Popup>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

LanguageSelector.displayName = LANGUAGE_SELECTOR_NAME;
