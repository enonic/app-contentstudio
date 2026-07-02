import { cn, Combobox } from '@enonic/ui';
import { FileChartPie } from 'lucide-react';
import type { ReactElement } from 'react';
import { useI18n } from '../../../../../../../shared/lib/hooks/useI18n';
import { SelectorPopup } from '../SelectorPopup';
import { useFragmentContentSelector } from './hooks/useFragmentContentSelector';

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
    const notFoundLabel = useI18n('field.fragments.notFound');
    const noMatchingLabel = useI18n('field.option.noitems');

    if (isLoading) return null;

    if (isEmpty) {
        return (
            <div className="flex flex-col gap-2" data-component={FRAGMENT_CONTENT_SELECTOR_NAME}>
                <span className="font-semibold">{label}</span>
                <small className="text-sm leading-4.5 text-subtle truncate w-full group-data-[tone=inverse]:text-alt">
                    {notFoundLabel}
                </small>
            </div>
        );
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
                    <SelectorPopup options={filteredOptions} emptyLabel={noMatchingLabel}>
                        {(option) => (
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
                        )}
                    </SelectorPopup>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

FragmentContentSelector.displayName = FRAGMENT_CONTENT_SELECTOR_NAME;
