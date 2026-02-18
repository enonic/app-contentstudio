import {Selector, cn} from '@enonic/ui';
import {type ReactElement, useMemo} from 'react';
import {buildKey} from '../../utils/format/keys';

export type SortElementSelectorOption = {
    id: string;
    label: string;
    disabled?: boolean;
};

export type SortElementSelectorProps = {
    options: SortElementSelectorOption[];
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    label?: string;
    disabled?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    className?: string;
};

const SORT_ELEMENT_SELECTOR_NAME = 'SortElementSelector';

const toInternalValue = (id: string, index: number): string => buildKey(SORT_ELEMENT_SELECTOR_NAME, id, String(index));

export const SortElementSelector = ({
                                        label,
                                        options,
                                        selection,
                                        onSelectionChange,
                                        disabled = false,
                                        placeholder,
                                        emptyLabel,
                                        className,
                                    }: SortElementSelectorProps): ReactElement => {
    const selectedValue = selection[0];
    const mappedOptions = useMemo(
        () => options.map((option, index) => ({...option, internalValue: toInternalValue(option.id, index)})),
        [options]
    );

    const internalToExternalValueMap = useMemo(
        () => new Map(mappedOptions.map((option) => [option.internalValue, option.id])),
        [mappedOptions]
    );
    const externalToInternalValueMap = useMemo(
        () => new Map(mappedOptions.map((option) => [option.id, option.internalValue])),
        [mappedOptions]
    );
    const mappedOptionMap = useMemo(
        () => new Map(mappedOptions.map((option) => [option.internalValue, option])),
        [mappedOptions]
    );
    const selectedInternalValue = selectedValue ? externalToInternalValueMap.get(selectedValue) : undefined;

    const handleValueChange = (value: string): void => {
        const selectedOptionId = internalToExternalValueMap.get(value);
        if (!selectedOptionId) {
            return;
        }
        onSelectionChange([selectedOptionId]);
    };

    return (
        <div data-component={SORT_ELEMENT_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {label && <span className='text-md font-semibold text-subtle'>{label}</span>}
            <Selector.Root
                value={selectedInternalValue}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <Selector.Trigger aria-label={label}>
                    <Selector.Value placeholder={placeholder}>
                        {(value) => mappedOptionMap.get(value)?.label ?? value}
                    </Selector.Value>
                    <Selector.Icon />
                </Selector.Trigger>
                <Selector.Content
                    onPointerDown={event => event.stopPropagation()}
                >
                    <Selector.Viewport className='max-h-none overflow-visible p-1 flex flex-col items-start gap-1'>
                        {mappedOptions.length === 0 && emptyLabel ? (
                            <div className='w-full px-4 py-1 text-sm text-subtle'>{emptyLabel}</div>
                        ) : (
                            mappedOptions.map((option) => (
                                <Selector.Item
                                    key={option.id}
                                    value={option.internalValue}
                                    textValue={option.label}
                                    disabled={option.disabled}
                                    className='flex w-full shrink-0 items-center gap-2.5 self-stretch px-4 py-1'
                                >
                                    <Selector.ItemText className='text-md font-semibold leading-5.5 group-data-[tone=inverse]:text-alt'>
                                        {option.label}
                                    </Selector.ItemText>
                                </Selector.Item>
                            ))
                        )}
                    </Selector.Viewport>
                </Selector.Content>
            </Selector.Root>
        </div>
    );
};

SortElementSelector.displayName = SORT_ELEMENT_SELECTOR_NAME;
