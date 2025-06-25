import {Checkbox, Combobox, ComboboxRootProps, Listbox, useCombobox} from '@enonic/ui';
import {useState, ReactElement, useMemo, useCallback} from 'react';
import {useStore} from '@nanostores/preact';
import {ItemLabel} from '../ItemLabel';
import {$applications} from '../../store/applications.store';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationIcon} from '../icons/ApplicationIcon';

const APPLICATION_SELECTOR_NAME = 'ApplicationSelector';

type ApplicationSelectorProps = {
    selection: readonly string[];
    onSelectionChange: (selection: string[]) => void;
    selectionMode: ComboboxRootProps['selectionMode'];
    placeholder?: string;
    emptyLabel?: string;
    closeOnBlur?: boolean;
    className?: string;
};

export const ApplicationSelector = (props: ApplicationSelectorProps): ReactElement => {
    const {applications} = useStore($applications);
    const [searchValue, setSearchValue] = useState('');
    const {selection, onSelectionChange, selectionMode, placeholder, emptyLabel, closeOnBlur, className} = props;

    const filtered = useMemo(() => {
        if (!searchValue) return applications;

        return applications.filter((application) => application.getDisplayName().toLowerCase().includes(searchValue.toLowerCase()));
    }, [applications, searchValue]);

    return (
        <Combobox.Root
            data-component={APPLICATION_SELECTOR_NAME}
            value={searchValue}
            onChange={setSearchValue}
            selection={selection}
            onSelectionChange={onSelectionChange}
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
                        <ApplicationSelectorList items={filtered} selectionMode={selectionMode} emptyLabel={emptyLabel} />
                    </Combobox.Popup>
                </Combobox.Portal>
            </Combobox.Content>
        </Combobox.Root>
    );
};

ApplicationSelector.displayName = APPLICATION_SELECTOR_NAME;

type ApplicationSelectorListProps = {
    items: Application[];
    selectionMode: ComboboxRootProps['selectionMode'];
    emptyLabel?: string;
};

const ApplicationSelectorList = (props: ApplicationSelectorListProps): ReactElement => {
    const {items, selectionMode, emptyLabel} = props;
    const {selection, onSelectionChange} = useCombobox();
    const selectionArray = useMemo(() => Array.from(selection), [selection]);

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
                {items.map((application) => {
                    const key = application.getApplicationKey().toString();
                    const name = application.getDisplayName();
                    const description = application.getDescription();

                    return (
                        <Listbox.Item key={key} value={key}>
                            <div className="flex-1">
                                <ItemLabel icon={<ApplicationIcon application={application} />} primary={name} secondary={description} />
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
