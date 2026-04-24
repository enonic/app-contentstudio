import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FieldError} from '@enonic/lib-admin-ui/form2';
import {RadioGroup} from '@enonic/ui';
import {type KeyboardEvent, type ReactElement, useMemo} from 'react';
import {FormItemRenderer} from '../../../FormItemRenderer';

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

    // Keep keyboard navigation cohesive with multi selection: disable RadioGroup's arrow
    // navigation (Tab-only), and stop Space from being swallowed by the group handler so
    // the button's native activation still selects the item.
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        if (e.key === ' ') {
            e.stopPropagation();
            return;
        }
    };

    return (
        <div className="flex flex-col gap-6" onKeyDownCapture={handleKeyDown}>
            <RadioGroup.Root
                name={`${optionSet.getName()}-radio`}
                value={selectedName}
                onValueChange={onSelect}
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
                                <div className="flex flex-col gap-7.5">
                                    {formItems.map((formItem) => (
                                        <FormItemRenderer key={formItem.getName()} formItem={formItem} propertySet={optionDataSet} />
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
