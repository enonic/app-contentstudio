import {cn, Combobox, Listbox} from '@enonic/ui';
import {Box, Columns2} from 'lucide-react';
import type {ReactElement} from 'react';
import {useI18n} from '../../../../../../hooks/useI18n';
import {useComponentDescriptorSelector} from './hooks/useComponentDescriptorSelector';

const COMPONENT_TYPE_ICON = {
    part: Box,
    layout: Columns2,
} as const;

type ComponentDescriptorSelectorProps = {
    componentType: 'part' | 'layout';
};

const COMPONENT_DESCRIPTOR_SELECTOR_NAME = 'ComponentDescriptorSelector';

export const ComponentDescriptorSelector = ({componentType}: ComponentDescriptorSelectorProps): ReactElement | null => {
    const {
        filteredOptions,
        selectedOption,
        searchValue,
        setSearchValue,
        selection,
        handleSelectionChange,
        isLoading,
        isEmpty,
    } = useComponentDescriptorSelector(componentType);

    const label = useI18n(componentType === 'part' ? 'field.part' : 'field.layout');
    const searchPlaceholder = useI18n('field.option.placeholder');

    const Icon = COMPONENT_TYPE_ICON[componentType];

    if (isLoading) return null;

    if (isEmpty) {
        return <p className="text-sm text-subtle">{label}</p>;
    }

    return (
        <div className="flex flex-col gap-2.5" data-component={COMPONENT_DESCRIPTOR_SELECTOR_NAME}>
            <span className="font-semibold">{label}</span>
            <Combobox.Root
                value={searchValue}
                onChange={setSearchValue}
                selection={selection}
                onSelectionChange={handleSelectionChange}
            >
                <Combobox.Content>
                    <Combobox.Control>
                        <Combobox.Search>
                            {selectedOption && (
                                <Combobox.Value className="gap-2 w-full">
                                    <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="leading-5.5 font-semibold truncate">
                                            {selectedOption.label}
                                        </span>
                                        {selectedOption.isInvalid && (
                                            <small className="leading-4 text-xs truncate text-error">
                                                {selectedOption.description}
                                            </small>
                                        )}
                                    </div>
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
                                        <small
                                            className={cn(
                                                'leading-4.5 text-sm truncate group-data-[tone=inverse]:text-alt',
                                                option.isInvalid ? 'text-error' : 'text-subtle',
                                            )}
                                        >
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

ComponentDescriptorSelector.displayName = COMPONENT_DESCRIPTOR_SELECTOR_NAME;
