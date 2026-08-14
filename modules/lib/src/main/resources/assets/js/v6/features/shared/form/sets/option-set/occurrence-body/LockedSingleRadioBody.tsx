import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import type { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import { FieldError } from '@enonic/lib-admin-ui/form2';
import { RadioGroup } from '@enonic/ui';
import { type KeyboardEvent, type ReactElement, useMemo } from 'react';
import { FormItemRenderer } from '../../../FormItemRenderer';

type LockedSingleRadioBodyProps = {
    enabled: boolean;
    optionSet: FormOptionSet;
    occurrencePropertySet: PropertySet;
    selectedNames: string[];
    onSelect: (name: string) => void;
    error?: string;
};

export const LockedSingleRadioBody = ({
    enabled,
    optionSet,
    occurrencePropertySet,
    selectedNames,
    onSelect,
    error,
}: LockedSingleRadioBodyProps): ReactElement => {
    const options = useMemo(() => optionSet.getOptions(), [optionSet]);
    const selectedName = selectedNames[0] ?? '';

    // Keep keyboard navigation cohesive with multi selection: passing onKeyDown to
    // RadioGroup.Root replaces its built-in roving arrow navigation (Tab-only), which
    // would otherwise also swallow keys typed in the nested option inputs (#11276).
    // Arrows stay inert on the radio items; nested inputs keep native caret movement.
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
        const isArrowKey =
            e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight';
        if (!isArrowKey) return;

        if (e.target instanceof Element && e.target.closest('[role="radio"]') != null) {
            e.preventDefault();
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <RadioGroup.Root
                name={`${optionSet.getName()}-radio`}
                value={selectedName}
                onValueChange={onSelect}
                onKeyDown={handleKeyDown}
                className="flex flex-col gap-6 p-0 has-focus-visible:ring-0"
            >
                {options.map((option) => {
                    const optionName = option.getName();
                    const formItems = option.getFormItems();
                    const optionDataSet = occurrencePropertySet.getPropertyArray(optionName)?.getSet(0);
                    const isChecked = selectedName === optionName;

                    return (
                        <div className="flex flex-col gap-7.5" key={optionName}>
                            <RadioGroup.Item value={optionName} disabled={!enabled} tabIndex={enabled ? 0 : -1}>
                                <RadioGroup.Indicator />
                                <span>{option.getLabel() || optionName}</span>
                            </RadioGroup.Item>
                            {isChecked && formItems.length > 0 && optionDataSet && (
                                <div className="ml-1.5 flex flex-col gap-7.5 border-l border-l-bdr-soft pl-5">
                                    {formItems.map((formItem) => (
                                        <FormItemRenderer
                                            key={formItem.getName()}
                                            formItem={formItem}
                                            propertySet={optionDataSet}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </RadioGroup.Root>
            {error && <FieldError message={error} />}
        </div>
    );
};

LockedSingleRadioBody.displayName = 'LockedSingleRadioBody';
