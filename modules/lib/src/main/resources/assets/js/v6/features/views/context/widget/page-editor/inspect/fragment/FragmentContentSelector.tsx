import {Combobox, Listbox} from '@enonic/ui';
import {FileChartPie} from 'lucide-react';
import type {ReactElement} from 'react';
import {useI18n} from '../../../../../../hooks/useI18n';
import {useFragmentContentSelector} from './hooks/useFragmentContentSelector';

const FRAGMENT_CONTENT_SELECTOR_NAME = 'FragmentContentSelector';

export const FragmentContentSelector = (): ReactElement | null => {
    const {
        filteredOptions,
        selectedOption,
        searchValue,
        setSearchValue,
        selection,
        handleSelectionChange,
        isLoading,
        isEmpty,
        disabled,
    } = useFragmentContentSelector();

    const label = useI18n('field.fragment');
    const searchPlaceholder = useI18n('field.option.placeholder');

    if (isLoading) return null;

    if (isEmpty) {
        return <p className="text-subtle font-semibold leading-5.5 truncate">{label}</p>;
    }

    return (
        <div className="flex flex-col gap-2.5" data-component={FRAGMENT_CONTENT_SELECTOR_NAME}>
            <span className="font-semibold">{label}</span>
            <Combobox.Root
                value={searchValue}
                onChange={setSearchValue}
                selection={selection}
                onSelectionChange={handleSelectionChange}
                disabled={disabled}
            >
                <Combobox.Content>
                    <Combobox.Control>
                        <Combobox.Search>
                            {selectedOption && (
                                <Combobox.Value className="gap-2 w-full">
                                    <FileChartPie className="size-4 shrink-0" strokeWidth={1.75} />
                                    <span className="leading-5.5 font-semibold truncate">
                                        {selectedOption.label}
                                    </span>
                                </Combobox.Value>
                            )}
                            <Combobox.Input placeholder={searchPlaceholder} />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>
                    <Combobox.Popup>
                        <Listbox.Content className="max-h-60 rounded-sm">
                            {filteredOptions.map(option => (
                                <Listbox.Item key={option.key} value={option.key}>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="leading-5.5 font-semibold truncate group-data-[tone=inverse]:text-alt">
                                            {option.label}
                                        </span>
                                        <small className="leading-4.5 text-sm text-subtle truncate group-data-[tone=inverse]:text-alt">
                                            {option.description}
                                        </small>
                                    </div>
                                </Listbox.Item>
                            ))}
                        </Listbox.Content>
                    </Combobox.Popup>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

FragmentContentSelector.displayName = FRAGMENT_CONTENT_SELECTOR_NAME;
