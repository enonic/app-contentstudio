import type { Principal } from '@enonic/lib-admin-ui/security/Principal';
import type { PrincipalType } from '@enonic/lib-admin-ui/security/PrincipalType';
import { Checkbox, cn, Combobox, Listbox, useCombobox, type ComboboxRootProps } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { useEffect, useId, useMemo, useState, type ReactElement } from 'react';
import { $principals, loadPrincipals } from '../../../entities/principal';
import { useDebouncedCallback } from '../../../shared/lib/hooks/useDebouncedCallback';
import { PrincipalLabel } from '../../../shared/ui/PrincipalLabel';
import { useComboboxCollapse } from './shared/useComboboxCollapse';

const PRINCIPAL_SELECTOR_NAME = 'PrincipalSelector';
const DEFAULT_DEBOUNCE = 500;

type PrincipalSelectorProps = {
    selection: readonly string[];
    onSelectionChange: (selection: string[]) => void;
    selectionMode: ComboboxRootProps['selectionMode'];
    allowedTypes: PrincipalType[];
    customFilter?: (principal: Principal) => boolean;
    label?: string;
    placeholder?: string;
    emptyLabel?: string;
    closeOnBlur?: boolean;
    disabled?: boolean;
    className?: string;
};

export const PrincipalSelector = ({
    selection,
    onSelectionChange,
    selectionMode,
    allowedTypes,
    customFilter = (_: Principal) => true,
    label,
    placeholder,
    emptyLabel,
    closeOnBlur,
    disabled,
    className,
}: PrincipalSelectorProps): ReactElement => {
    const { principals } = useStore($principals);
    const baseId = useId();
    const inputId = `${PRINCIPAL_SELECTOR_NAME}-${baseId}-input`;
    const [searchValue, setSearchValue] = useState('');
    const allowedTypesKey = allowedTypes.join(','); // Serialize array for stable comparison in useEffect dependencies

    const hideCombobox =
        selectionMode === 'single' &&
        selection.some((key) => principals.some((principal) => principal.getKey().toString() === key));
    const { rootRef, inputRef } = useComboboxCollapse(hideCombobox);

    const allowedPrincipals = useMemo(() => {
        return principals.filter((principal) => allowedTypes.includes(principal.getType()) && customFilter(principal));
    }, [principals, allowedTypesKey]);

    const filtered = useMemo(() => {
        if (!searchValue) return allowedPrincipals;

        return allowedPrincipals.filter((principal) =>
            principal.getDisplayName().toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [allowedPrincipals, searchValue]);

    const debouncedLoadPrincipals = useDebouncedCallback((searchValue: string) => {
        void loadPrincipals(searchValue);
    }, DEFAULT_DEBOUNCE);

    useEffect(() => {
        void debouncedLoadPrincipals(searchValue);
    }, [searchValue, debouncedLoadPrincipals]);

    const handleSelectionChange = (next: readonly string[]): void => {
        if (selectionMode === 'single') {
            setSearchValue('');
        }
        onSelectionChange([...next]);
    };

    return (
        <div
            ref={rootRef}
            tabIndex={-1}
            data-component={PRINCIPAL_SELECTOR_NAME}
            className={cn('flex flex-col gap-2 focus:outline-none', className)}
        >
            {label && (
                <label htmlFor={hideCombobox ? undefined : inputId} className="font-semibold">
                    {label}
                </label>
            )}
            {!hideCombobox && (
                <Combobox.Root
                    value={searchValue}
                    onChange={setSearchValue}
                    selection={selection}
                    onSelectionChange={handleSelectionChange}
                    selectionMode={selectionMode}
                    closeOnBlur={closeOnBlur}
                    disabled={disabled}
                    contentType="listbox"
                >
                    <Combobox.Content>
                        <Combobox.Control>
                            <Combobox.Search>
                                <Combobox.SearchIcon />
                                <Combobox.Input ref={inputRef} id={inputId} placeholder={placeholder} />
                                {selectionMode === 'staged' && <Combobox.Apply />}
                                <Combobox.Toggle />
                            </Combobox.Search>
                        </Combobox.Control>
                        <Combobox.Portal>
                            <Combobox.Popup>
                                <PrincipalSelectorList
                                    items={filtered}
                                    selectionMode={selectionMode}
                                    emptyLabel={emptyLabel}
                                />
                            </Combobox.Popup>
                        </Combobox.Portal>
                    </Combobox.Content>
                </Combobox.Root>
            )}
        </div>
    );
};

PrincipalSelector.displayName = PRINCIPAL_SELECTOR_NAME;

type PrincipalSelectorListProps = {
    items: Principal[];
    selectionMode: ComboboxRootProps['selectionMode'];
    emptyLabel?: string;
};

const PrincipalSelectorList = (props: PrincipalSelectorListProps): ReactElement => {
    const { items, selectionMode, emptyLabel } = props;
    const { selection } = useCombobox();

    return (
        <Combobox.ListContent className="max-h-60 rounded-sm">
            {items.map((principal) => {
                const key = principal.getKey().toString();

                return (
                    <Listbox.Item key={key} value={key}>
                        <PrincipalLabel principal={principal} className="flex-1" />
                        {selectionMode !== 'single' && (
                            <Checkbox
                                tabIndex={-1}
                                checked={selection.has(key)}
                                onClick={(event) => event.preventDefault()}
                            />
                        )}
                    </Listbox.Item>
                );
            })}

            {items.length === 0 && <div className="px-4 py-3 text-sm text-subtle">{emptyLabel}</div>}
        </Combobox.ListContent>
    );
};
