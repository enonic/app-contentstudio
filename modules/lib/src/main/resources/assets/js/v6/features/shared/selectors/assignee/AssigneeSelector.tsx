import {Combobox, IconButton, ListItem, Listbox, cn} from '@enonic/ui';
import {X} from 'lucide-react';
import {useEffect, useMemo, useRef, useState, type ReactElement} from 'react';
import {createDebounce} from '../../../utils/timing/createDebounce';
import {AssigneeOptionItem} from './AssigneeOptionItem';
import {AssigneeOptionRow} from './AssigneeOptionRow';
import {AssigneeOptionsContent} from './AssigneeOptionsContent';
import type {AssigneeSelectorOption} from './assignee.types';

export type AssigneeSelectorProps = {
    label: string;
    options: AssigneeSelectorOption[];
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    selectedOptions?: AssigneeSelectorOption[];
    selectedListClassName?: string;
    applyLabel?: string;
    disabled?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    filterOptions?: boolean;
    onSearchChange?: (value: string) => void;
    debounceMs?: number;
    className?: string;
};

const ASSIGNEE_SELECTOR_NAME = 'AssigneeSelector';
const DEFAULT_DEBOUNCE_MS = 200;

const normalizeQuery = (query: string): string => query.trim().toLowerCase();

const hashString = (value: string): string => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36);
};

const toSafeValue = (value: string): string => {
    const normalized = value.replace(/[^a-zA-Z0-9_-]/g, '-');
    return `assignee-${normalized}-${hashString(value)}`;
};

const matchesQuery = (option: AssigneeSelectorOption, normalizedQuery: string): boolean => {
    if (!normalizedQuery) {
        return true;
    }

    return option.label.toLowerCase().includes(normalizedQuery) ||
        option.description?.toLowerCase().includes(normalizedQuery) === true;
};

export const AssigneeSelector = ({
    label,
    options,
    selection,
    onSelectionChange,
    selectedOptions,
    selectedListClassName,
    applyLabel,
    disabled = false,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    filterOptions,
    onSearchChange,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    className,
}: AssigneeSelectorProps): ReactElement => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeItem, setActiveItem] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const restoreFocusRef = useRef(false);

    const selectedIds = selection ?? [];
    const shouldFilter = filterOptions ?? !onSearchChange;

    const optionLookup = useMemo(() => {
        const merged = [...options, ...(selectedOptions ?? [])];
        const lookup = new Map<string, AssigneeSelectorOption>();
        merged.forEach(option => lookup.set(option.id, option));
        return lookup;
    }, [options, selectedOptions]);

    const valueMap = useMemo(() => {
        const rawToSafe = new Map<string, string>();
        const safeToRaw = new Map<string, string>();

        const register = (id: string) => {
            if (rawToSafe.has(id)) {
                return;
            }
            const safe = toSafeValue(id);
            rawToSafe.set(id, safe);
            safeToRaw.set(safe, id);
        };

        options.forEach(option => register(option.id));
        selectedOptions?.forEach(option => register(option.id));
        selectedIds.forEach(register);

        return {rawToSafe, safeToRaw};
    }, [options, selectedOptions, selectedIds]);

    const selectedOptionList = useMemo(() => {
        return selectedIds
            .map(id => optionLookup.get(id))
            .filter((option): option is AssigneeSelectorOption => !!option);
    }, [selectedIds, optionLookup]);

    const visibleOptions = useMemo(() => {
        if (!open || !shouldFilter) {
            return options;
        }

        const normalizedQuery = normalizeQuery(inputValue);
        if (!normalizedQuery) {
            return options;
        }

        return options.filter(option => matchesQuery(option, normalizedQuery));
    }, [open, shouldFilter, options, inputValue]);

    const debouncedSearch = useMemo(() => {
        if (!onSearchChange) {
            return undefined;
        }

        return createDebounce(onSearchChange, debounceMs);
    }, [onSearchChange, debounceMs]);

    useEffect(() => {
        if (!open) {
            setInputValue('');
            setActiveItem(null);
        }
    }, [open]);

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
        if (!open) {
            debouncedSearch?.cancel?.();
        }
    }, [open, debouncedSearch]);

    useEffect(() => {
        return () => {
            debouncedSearch?.cancel?.();
        };
    }, [debouncedSearch]);

    const showSelectedOptions = selectedOptionList.length > 0;
    const safeSelection = selectedIds.map(id => valueMap.rawToSafe.get(id) ?? toSafeValue(id));
    const selectionKey = useMemo(() => safeSelection.join('|'), [safeSelection]);

    const handleRemoveAssignee = (id: string): void => {
        onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    };

    const focusInput = (): void => {
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const requestFocusRestore = (): void => {
        restoreFocusRef.current = true;
    };

    useEffect(() => {
        if (open) {
            return;
        }

        if (restoreFocusRef.current) {
            restoreFocusRef.current = false;
            focusInput();
        }
    }, [open]);

    return (
        <div
            data-component={ASSIGNEE_SELECTOR_NAME}
            className={cn('flex min-h-0 flex-col gap-2', className)}>
            <Combobox.Root
                key={selectionKey}
                open={open}
                onOpenChange={setOpen}
                value={inputValue}
                onChange={setInputValue}
                active={activeItem ?? ''}
                setActive={setActiveItem}
                selectionMode='staged'
                defaultSelection={safeSelection}
                onSelectionChange={(next) => {
                    const mapped = next
                        .map(value => valueMap.safeToRaw.get(value))
                        .filter((value): value is string => !!value);
                    onSelectionChange(mapped);
                }}
                disabled={disabled}
            >
                <Combobox.Content className='relative'>
                    <Combobox.Control>
                        <Combobox.Search>
                            <Combobox.SearchIcon />
                            <Combobox.Input
                                ref={inputRef}
                                placeholder={searchPlaceholder ?? placeholder}
                                aria-label={label}
                            />
                            <Combobox.Apply label={applyLabel} onPointerDown={requestFocusRestore} />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>

                    <Combobox.Portal>
                        <Combobox.Popup>
                            <AssigneeOptionsContent
                                label={label}
                                emptyLabel={emptyLabel}
                                hasOptions={visibleOptions.length > 0}
                                onApply={requestFocusRestore}
                            >
                                {visibleOptions.map(option => {
                                    const safeValue = valueMap.rawToSafe.get(option.id) ?? toSafeValue(option.id);
                                    return (
                                        <Listbox.Item
                                            key={option.id}
                                            value={safeValue}
                                            disabled={option.disabled}
                                        >
                                            <AssigneeOptionItem option={option} value={safeValue} />
                                        </Listbox.Item>
                                    );
                                })}
                            </AssigneeOptionsContent>
                        </Combobox.Popup>
                    </Combobox.Portal>
                </Combobox.Content>
            </Combobox.Root>
            {showSelectedOptions && (
                <div className={cn('flex flex-col gap-1.5', selectedListClassName)}>
                    {selectedOptionList.map(option => (
                        <ListItem
                            key={option.id}
                            className='h-12 py-0 px-2.5'
                        >
                            <ListItem.Content className='flex'>
                                <div className='flex flex-1 items-center gap-x-2.5'>
                                    <AssigneeOptionRow option={option} />
                                </div>
                            </ListItem.Content>
                            <ListItem.Right className='flex items-center gap-2.5'>
                                <IconButton
                                    icon={X}
                                    size='sm'
                                    variant='text'
                                    iconSize={18}
                                    iconStrokeWidth={2}
                                    onClick={() => handleRemoveAssignee(option.id)}
                                    disabled={disabled}
                                />
                            </ListItem.Right>
                        </ListItem>
                    ))}
                </div>
            )}
        </div>
    );
};

AssigneeSelector.displayName = ASSIGNEE_SELECTOR_NAME;
