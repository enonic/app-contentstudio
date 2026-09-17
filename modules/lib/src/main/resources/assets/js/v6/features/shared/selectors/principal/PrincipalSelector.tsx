import { Combobox, IconButton, ListItem, Listbox, cn } from '@enonic/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createDebounce } from '../../../../shared/lib/timing/createDebounce';
import { useComboboxCollapse } from '../shared/useComboboxCollapse';
import { PrincipalOptionItem } from './PrincipalOptionItem';
import { PrincipalOptionRow } from './PrincipalOptionRow';
import { PrincipalOptionsContent } from './PrincipalOptionsContent';
import type { PrincipalOption } from './principal.types';

export type PrincipalSelectorProps = {
    /** Accessible name for the search input and the options listbox. */
    ariaLabel: string;
    options: PrincipalOption[];
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    /** Called alongside onSelectionChange when a staged selection is applied. */
    onAppliedSelectionChange?: (selection: readonly string[]) => void;
    /** Renders a visible label above the combobox. Omit where the caller supplies its own. */
    label?: string;
    /** 'single' collapses the combobox once a listed option is selected. */
    selectionMode?: 'single' | 'staged';
    /** Replaces the default option row. Must render the whole item content. */
    renderOption?: (option: PrincipalOption) => ReactNode;
    /** Set false where the caller renders its own list of the current selection. */
    showSelection?: boolean;
    selectedOptions?: PrincipalOption[];
    selectedListClassName?: string;
    listClassName?: string;
    applyLabel?: string;
    disabled?: boolean;
    closeOnBlur?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    filterOptions?: boolean;
    onSearchChange?: (value: string) => void;
    debounceMs?: number;
    className?: string;
};

const PRINCIPAL_SELECTOR_NAME = 'PrincipalSelector';
const DEFAULT_DEBOUNCE_MS = 200;

const normalizeQuery = (query: string): string => query.trim().toLowerCase();

const matchesQuery = (option: PrincipalOption, normalizedQuery: string): boolean => {
    if (!normalizedQuery) {
        return true;
    }

    return (
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.description?.toLowerCase().includes(normalizedQuery) === true
    );
};

export const PrincipalSelector = ({
    ariaLabel,
    options,
    selection,
    onSelectionChange,
    onAppliedSelectionChange,
    label,
    selectionMode = 'staged',
    renderOption,
    showSelection = true,
    selectedOptions,
    selectedListClassName,
    listClassName = 'max-h-100',
    applyLabel,
    disabled = false,
    closeOnBlur,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    filterOptions,
    onSearchChange,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    className,
}: PrincipalSelectorProps): ReactElement => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    // Null until this instance has searched. The option source can outlive the selector — the issue
    // dialog unmounts it on tab switch — so a fresh mount must re-sync rather than trust stale options.
    const lastQueryRef = useRef<string | null>(null);
    const baseId = useId();
    const inputId = `${PRINCIPAL_SELECTOR_NAME}-${baseId}-input`;

    const selectedIds = selection ?? [];
    const SELECTED_IDS_KEY_SEPARATOR = '\0';
    const selectedIdsKey = selectedIds.join(SELECTED_IDS_KEY_SEPARATOR);
    const shouldFilter = filterOptions ?? !onSearchChange;

    // Single selection replaces the combobox with the caller's own rendering of the chosen option.
    const hideCombobox = selectionMode === 'single' && selectedIds.some((id) => options.some((o) => o.id === id));
    const { rootRef, inputRef } = useComboboxCollapse(hideCombobox);

    const optionLookup = useMemo(() => {
        const merged = [...options, ...(selectedOptions ?? [])];
        return new Map<string, PrincipalOption>(merged.map((option) => [option.id, option]));
    }, [options, selectedOptions]);

    const selectedOptionList = useMemo(() => {
        return selectedIds.map((id) => optionLookup.get(id)).filter((option): option is PrincipalOption => !!option);
    }, [selectedIdsKey, optionLookup]);

    const visibleOptions = useMemo(() => {
        if (!open || !shouldFilter) {
            return options;
        }

        const normalizedQuery = normalizeQuery(inputValue);
        if (!normalizedQuery) {
            return options;
        }

        return options.filter((option) => matchesQuery(option, normalizedQuery));
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
        }
    }, [open]);

    useEffect(() => {
        if (!open || lastQueryRef.current === inputValue) {
            return;
        }

        lastQueryRef.current = inputValue;
        debouncedSearch?.(inputValue);
    }, [open, debouncedSearch, inputValue]);

    useEffect(() => {
        if (!open) {
            debouncedSearch?.cancel();
        }
    }, [open, debouncedSearch]);

    useEffect(() => {
        return () => {
            debouncedSearch?.cancel();
        };
    }, [debouncedSearch]);

    const showSelectedOptions = showSelection && selectedOptionList.length > 0;

    const handleRemove = (id: string): void => {
        onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    };

    return (
        <div
            ref={rootRef}
            tabIndex={-1}
            data-component={PRINCIPAL_SELECTOR_NAME}
            className={cn('flex min-h-0 flex-col gap-2 focus:outline-none', className)}
        >
            {label && (
                <label htmlFor={hideCombobox ? undefined : inputId} className="font-semibold">
                    {label}
                </label>
            )}
            {!hideCombobox && (
                <Combobox.Root
                    open={open}
                    onOpenChange={setOpen}
                    value={inputValue}
                    onChange={setInputValue}
                    selectionMode={selectionMode}
                    selection={selectedIds}
                    onSelectionChange={(next) => {
                        const mapped = [...next];
                        onSelectionChange(mapped);
                        onAppliedSelectionChange?.(mapped);
                    }}
                    closeOnBlur={closeOnBlur}
                    disabled={disabled}
                >
                    <Combobox.Content>
                        <Combobox.Control>
                            <Combobox.Search>
                                <Combobox.SearchIcon />
                                <Combobox.Input
                                    ref={inputRef}
                                    id={inputId}
                                    placeholder={searchPlaceholder ?? placeholder}
                                    aria-label={ariaLabel}
                                />
                                {selectionMode === 'staged' && <Combobox.Apply label={applyLabel} />}
                                <Combobox.Toggle />
                            </Combobox.Search>
                        </Combobox.Control>

                        <Combobox.Portal>
                            <Combobox.Popup>
                                <PrincipalOptionsContent
                                    label={ariaLabel}
                                    emptyLabel={emptyLabel}
                                    hasOptions={visibleOptions.length > 0}
                                    className={listClassName}
                                >
                                    {visibleOptions.map((option) => (
                                        <Listbox.Item key={option.id} value={option.id} disabled={option.disabled}>
                                            {renderOption ? (
                                                renderOption(option)
                                            ) : (
                                                <PrincipalOptionItem option={option} value={option.id} />
                                            )}
                                        </Listbox.Item>
                                    ))}
                                </PrincipalOptionsContent>
                            </Combobox.Popup>
                        </Combobox.Portal>
                    </Combobox.Content>
                </Combobox.Root>
            )}
            {showSelectedOptions && (
                <div className={cn('flex flex-col gap-1.5', selectedListClassName)}>
                    {selectedOptionList.map((option) => (
                        <ListItem key={option.id} className="h-12 py-0 px-2.5">
                            <ListItem.Content className="flex">
                                <div className="flex flex-1 items-center gap-x-2.5">
                                    <PrincipalOptionRow option={option} />
                                </div>
                            </ListItem.Content>
                            <ListItem.Right className="flex items-center gap-2.5">
                                <IconButton
                                    icon={X}
                                    size="sm"
                                    variant="text"
                                    iconSize={18}
                                    iconStrokeWidth={2}
                                    onClick={() => handleRemove(option.id)}
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

PrincipalSelector.displayName = PRINCIPAL_SELECTOR_NAME;
