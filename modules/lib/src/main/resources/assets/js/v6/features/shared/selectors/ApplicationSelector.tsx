import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {Checkbox, cn, Combobox, type ComboboxRootProps, Listbox, useCombobox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useId, useMemo, useState} from 'react';
import {$applications} from '../../store/applications.store';
import {ApplicationIcon} from '../icons/ApplicationIcon';
import {ItemLabel} from '../ItemLabel';

const APPLICATION_SELECTOR_NAME = 'ApplicationSelector';

type ApplicationSelectorProps = {
    label?: string;
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
    const baseId = useId();
    const inputId = `${APPLICATION_SELECTOR_NAME}-${baseId}-input`;
    const [searchValue, setSearchValue] = useState('');
    const {label, selection, onSelectionChange, selectionMode, placeholder, emptyLabel, closeOnBlur, className} = props;

    const filtered = useMemo(() => {
        if (!searchValue) return applications;

        return applications.filter((application) => application.getDisplayName().toLowerCase().includes(searchValue.toLowerCase()));
    }, [applications, searchValue]);

    return (
        <div data-component={APPLICATION_SELECTOR_NAME} className={cn('flex flex-col gap-2', className)}>
            {label && <label htmlFor={inputId} className="font-semibold">{label}</label>}
            <Combobox.Root
                value={searchValue}
                onChange={setSearchValue}
                selection={selection}
                onSelectionChange={onSelectionChange}
                selectionMode={selectionMode}
                closeOnBlur={closeOnBlur}
                contentType="listbox"
            >
                <Combobox.Content>
                    <Combobox.Control>
                        <Combobox.Search>
                            <Combobox.SearchIcon />
                            <Combobox.Input id={inputId} placeholder={placeholder} />
                            {selectionMode === 'staged' && <Combobox.Apply />}
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>
                    <Combobox.Portal>
                        <Combobox.Popup>
                            <ApplicationSelectorList items={filtered} emptyLabel={emptyLabel} />
                        </Combobox.Popup>
                    </Combobox.Portal>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

ApplicationSelector.displayName = APPLICATION_SELECTOR_NAME;

type ApplicationSelectorListProps = {
    items: Application[];
    emptyLabel?: string;
};

const ApplicationSelectorList = (props: ApplicationSelectorListProps): ReactElement => {
    const {items, emptyLabel} = props;
    const {selection, selectionMode} = useCombobox();

    return (
        <Combobox.ListContent className="max-h-60 rounded-sm">
            {items.map((application) => {
                const key = application.getApplicationKey().toString();
                const name = application.getDisplayName();
                const description = application.getDescription();

                return (
                    <Listbox.Item key={key} value={key}>
                        <ItemLabel
                            className="flex-1"
                            icon={<ApplicationIcon application={application} />}
                            primary={name}
                            secondary={description}
                        />
                        {selectionMode !== 'single' && (
                            <Checkbox tabIndex={-1} checked={selection.has(key)} onClick={(event) => event.preventDefault()} />
                        )}
                    </Listbox.Item>
                );
            })}

            {items.length === 0 && <div className="px-4 py-3 text-sm text-subtle">{emptyLabel}</div>}
        </Combobox.ListContent>
    );
};
