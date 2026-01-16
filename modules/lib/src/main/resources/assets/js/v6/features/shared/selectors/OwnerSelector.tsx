import {Combobox, Listbox, cn, Avatar} from '@enonic/ui';
import {useEffect, useMemo, useState, type ReactElement} from 'react';
import {createDebounce} from '../../utils/timing/createDebounce';
import {buildKey} from '../../utils/format/keys';
import {getInitials} from '../../utils/format/initials';

export type OwnerSelectorOption = {
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
};

export type OwnerSelectorProps = {
    label: string;
    options: OwnerSelectorOption[];
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    filterOptions?: boolean;
    onSearchChange?: (value: string) => void;
    debounceMs?: number;
    className?: string;
};

const OWNER_SELECTOR_NAME = 'OwnerSelector';

const DEFAULT_DEBOUNCE_MS = 200;
const NO_ACTIVE_OPTION = '__no-active__';

const toOptionKey = (value: string): string => buildKey(value);

const matchesQuery = (option: OwnerSelectorOption, normalizedQuery: string): boolean => {
    if (!normalizedQuery) {
        return true;
    }

    return option.label.toLowerCase().includes(normalizedQuery) ||
           option.description?.toLowerCase().includes(normalizedQuery) === true;
};

export const OwnerSelector = ({
    label,
    options,
    selection,
    onSelectionChange,
    disabled = false,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    filterOptions,
    onSearchChange,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    className,
}: OwnerSelectorProps): ReactElement => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeItem, setActiveItem] = useState<string>(NO_ACTIVE_OPTION);

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

    const shouldFilter = filterOptions ?? !onSearchChange;

    const visibleOptions = useMemo(() => {
        if (!open || !shouldFilter) {
            return options;
        }

        const normalizedQuery = inputValue.trim().toLowerCase();
        return options.filter(option => matchesQuery(option, normalizedQuery));
    }, [open, shouldFilter, options, inputValue]);

    const debouncedSearch = useMemo(() => {
        if (!onSearchChange) {
            return undefined;
        }

        return createDebounce(onSearchChange, debounceMs);
    }, [onSearchChange, debounceMs]);

    useEffect(() => {
        if (!open || !onSearchChange) {
            return;
        }

        if (debouncedSearch) {
            debouncedSearch(inputValue);
            return;
        }

        onSearchChange(inputValue);
    }, [open, onSearchChange, debouncedSearch, inputValue]);

    useEffect(() => {
        if (open) {
            return;
        }
        debouncedSearch?.cancel?.();
    }, [open, debouncedSearch]);

    const handleOpenChange = (next: boolean): void => {
        setOpen(next);
        if (next && !open) {
            setInputValue('');
            setActiveItem(NO_ACTIVE_OPTION);
        }
    };

    const handleActiveChange = (next: string | null): void => {
        setActiveItem(next ?? NO_ACTIVE_OPTION);
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
            data-component={OWNER_SELECTOR_NAME}
            className={cn('flex flex-col gap-2.5', className)}>
            <span className='text-md font-semibold text-subtle'>{label}</span>
            <Combobox.Root
                open={open}
                onOpenChange={handleOpenChange}
                value={inputValue}
                onChange={setInputValue}
                active={activeItem}
                setActive={handleActiveChange}
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
                        <Listbox.Content className='max-h-64 overflow-y-auto rounded-sm' label={label}>
                            {visibleOptions.length === 0 && emptyLabel ? (
                                <div className='px-4.5 py-2 text-sm text-subtle'>{emptyLabel}</div>
                            ) : (
                                visibleOptions.map(option => (
                                    <Listbox.Item
                                        key={option.id}
                                        value={toOptionKey(option.id)}
                                        disabled={option.disabled}
                                    >
                                        <Avatar size='md' className='mr-2.5'>
                                            <Avatar.Fallback>{getInitials(option.label)}</Avatar.Fallback>
                                        </Avatar>
                                        <div className='flex w-full flex-col gap-0.5'>
                                            <span className='text-sm font-medium group-data-[tone=inverse]:text-alt'>
                                                {option.label}
                                            </span>
                                            {option.description && (
                                                <span className='text-xs text-subtle group-data-[tone=inverse]:text-alt'>
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
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

OwnerSelector.displayName = OWNER_SELECTOR_NAME;
