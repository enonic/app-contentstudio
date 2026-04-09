import {useStore} from '@nanostores/preact';
import {useCallback, useMemo, useState} from 'react';
import {DescriptorKey} from '../../../../../../../../../app/page/DescriptorKey';
import {DescriptorBasedComponent} from '../../../../../../../../../app/page/region/DescriptorBasedComponent';
import {useI18n} from '../../../../../../../hooks/useI18n';
import {$inspectedItem, requestSetComponentDescriptor} from '../../../../../../../store/page-editor';
import {
    $isComponentInspectionLoading,
    $layoutDescriptorOptions,
    $partDescriptorOptions,
    $selectedComponentDescriptorKey,
} from '../../../../../../../store/component-inspection';

export type ComponentOption = {
    key: string;
    label: string;
    description: string;
};

type UseComponentDescriptorSelectorResult = {
    filteredOptions: ComponentOption[];
    selectedOption: ComponentOption | undefined;
    searchValue: string | undefined;
    setSearchValue: (value: string | undefined) => void;
    selection: string[];
    handleSelectionChange: (selection: readonly string[]) => void;
    isLoading: boolean;
    isEmpty: boolean;
};

export function useComponentDescriptorSelector(componentType: 'part' | 'layout'): UseComponentDescriptorSelectorResult {
    const item = useStore($inspectedItem);
    const partDescriptors = useStore($partDescriptorOptions);
    const layoutDescriptors = useStore($layoutDescriptorOptions);
    const selectedKey = useStore($selectedComponentDescriptorKey);
    const isLoading = useStore($isComponentInspectionLoading);

    const noDescriptionLabel = useI18n('text.noDescription');

    const [searchValue, setSearchValue] = useState<string | undefined>();

    const descriptors = componentType === 'part' ? partDescriptors : layoutDescriptors;

    const options = useMemo((): ComponentOption[] => {
        return descriptors.map(d => ({
            key: d.getKey().toString(),
            label: d.getDisplayName(),
            description: d.getDescription() || noDescriptionLabel,
        }));
    }, [descriptors, noDescriptionLabel]);

    const filteredOptions = useMemo(() => {
        if (!searchValue) return options;
        const lower = searchValue.toLowerCase();
        return options.filter(o =>
            o.label.toLowerCase().includes(lower) ||
            o.key.toLowerCase().includes(lower),
        );
    }, [searchValue, options]);

    const selectedOption = useMemo(
        () => options.find(o => o.key === selectedKey),
        [options, selectedKey],
    );

    const handleSelectionChange = useCallback(
        (selection: readonly string[]): void => {
            if (selection.length === 0) return;

            const newKey = selection[0];
            if (newKey === selectedKey) return;

            setSearchValue(undefined);

            if (item instanceof DescriptorBasedComponent) {
                requestSetComponentDescriptor(item.getPath(), DescriptorKey.fromString(newKey));
            }
        },
        [selectedKey, item],
    );

    const selection = selectedKey ? [selectedKey] : [];
    const isEmpty = options.length === 0;

    return {
        filteredOptions,
        selectedOption,
        searchValue,
        setSearchValue,
        selection,
        handleSelectionChange,
        isLoading,
        isEmpty,
    };
}
