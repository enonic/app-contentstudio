import {Checkbox, Combobox, ComboboxRootProps, Listbox, useCombobox} from '@enonic/ui';
import {useState, ReactElement, useEffect, useMemo, useCallback} from 'react';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {CircleUserRound} from 'lucide-react';
import {useStore} from '@nanostores/preact';
import {$principals, loadPrincipals} from '../../store/principals.store';
import {ItemLabel} from '../ItemLabel';
import {useDebouncedCallback} from '../../utils/hooks/useDebouncedCallback';

const PRINCIPAL_SELECTOR_NAME = 'PrincipalSelector';
const DEFAULT_DEBOUNCE = 500;

type PrincipalSelectorProps = {
    selection: readonly string[];
    onSelectionChange: (selection: string[]) => void;
    selectionMode: ComboboxRootProps['selectionMode'];
    allowedTypes: PrincipalType[];
    placeholder?: string;
    emptyLabel?: string;
    closeOnBlur?: boolean;
    className?: string;
};

export const PrincipalSelector = (props: PrincipalSelectorProps): ReactElement => {
    const {principals} = useStore($principals);
    const [searchValue, setSearchValue] = useState('');
    const {selection, onSelectionChange, selectionMode, allowedTypes, placeholder, emptyLabel, closeOnBlur, className} = props;
    const allowedTypesKey = allowedTypes.join(','); // Serialize array for stable comparison in useEffect dependencies

    const allowedPrincipals = useMemo(() => {
        return principals.filter((principal) => allowedTypes.includes(principal.getType()));
    }, [principals, allowedTypesKey]);

    const filtered = useMemo(() => {
        if (!searchValue) return allowedPrincipals;

        return allowedPrincipals.filter((principal) => principal.getDisplayName().toLowerCase().includes(searchValue.toLowerCase()));
    }, [allowedPrincipals, searchValue]);

    const debouncedLoadPrincipals = useDebouncedCallback((searchValue: string) => {
        void loadPrincipals(searchValue);
    }, DEFAULT_DEBOUNCE);

    useEffect(() => {
        void debouncedLoadPrincipals(searchValue);
    }, [searchValue]);

    // Handlers
    const handleOnSelectionChange = useCallback((selection: string[]) => {
        onSelectionChange(selection.map(decodeFromValidDomId));
    }, []);

    return (
        <Combobox.Root
            data-component={PRINCIPAL_SELECTOR_NAME}
            value={searchValue}
            onChange={setSearchValue}
            selection={selection}
            onSelectionChange={handleOnSelectionChange}
            selectionMode={selectionMode}
            closeOnBlur={closeOnBlur}
        >
            <Combobox.Content className={className}>
                <Combobox.Control>
                    <Combobox.Search>
                        <Combobox.SearchIcon />
                        <Combobox.Input placeholder={placeholder} />
                        {selectionMode === 'staged' && <Combobox.Apply />}
                        <Combobox.Toggle />
                    </Combobox.Search>
                </Combobox.Control>
                <Combobox.Portal>
                    <Combobox.Popup>
                        <PrincipalSelectorList items={filtered} selectionMode={selectionMode} emptyLabel={emptyLabel} />
                    </Combobox.Popup>
                </Combobox.Portal>
            </Combobox.Content>
        </Combobox.Root>
    );
};

PrincipalSelector.displayName = PRINCIPAL_SELECTOR_NAME;

type PrincipalSelectorListProps = {
    items: Principal[];
    selectionMode: ComboboxRootProps['selectionMode'];
    emptyLabel?: string;
};

const PrincipalSelectorList = (props: PrincipalSelectorListProps): ReactElement => {
    const {items, selectionMode, emptyLabel} = props;
    const {selection, onSelectionChange} = useCombobox();
    const selectionArray = useMemo(() => Array.from(selection).map(encodeToValidDomId), [selection]);

    const handleOnCheckedChange = useCallback(
        (key: string) => {
            const newSelection = selectionArray.includes(key) ? selectionArray.filter((v) => v !== key) : [...selectionArray, key];

            onSelectionChange(newSelection);
        },
        [selectionArray, onSelectionChange]
    );

    return (
        <Listbox
            selectionMode={selectionMode === 'single' ? 'single' : 'multiple'}
            selection={selectionArray}
            onSelectionChange={onSelectionChange}
        >
            <Listbox.Content className="max-h-60 rounded-sm">
                {items.map((principal) => {
                    const key = encodeToValidDomId(principal.getKey().toString());

                    return (
                        <Listbox.Item key={key} value={key}>
                            <div className="flex-1">
                                <ItemLabel
                                    icon={<CircleUserRound strokeWidth={1.5} />}
                                    primary={principal.getDisplayName()}
                                    secondary={principal.getKey().toPath()}
                                />
                            </div>

                            <Checkbox
                                tabIndex={-1}
                                checked={selectionArray.includes(key)}
                                onCheckedChange={() => handleOnCheckedChange(key)}
                            />
                        </Listbox.Item>
                    );
                })}

                {items.length === 0 && <div className="px-4 py-3 text-sm text-subtle">{emptyLabel}</div>}
            </Listbox.Content>
        </Listbox>
    );
};

//
// * Utilities
//

const encodeToValidDomId = (key: string): string => {
    return key.replaceAll(':', '_');
};

const decodeFromValidDomId = (key: string): string => {
    return key.replaceAll('_', ':');
};
