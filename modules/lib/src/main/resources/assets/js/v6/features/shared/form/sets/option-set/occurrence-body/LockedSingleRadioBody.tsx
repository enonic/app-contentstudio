import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FieldError} from '@enonic/lib-admin-ui/form2';
import {RadioGroup} from '@enonic/ui';
import {type ReactElement, useMemo} from 'react';
import {FormItemRenderer} from '../../../FormItemRenderer';
import {useOptionSetSelection} from '../useOptionSetSelection';

type LockedSingleRadioBodyProps = {
    enabled: boolean;
    optionSet: FormOptionSet;
    occurrencePropertySet: PropertySet;
    error?: string;
};

export const LockedSingleRadioBody = ({enabled, optionSet, occurrencePropertySet, error}: LockedSingleRadioBodyProps): ReactElement => {
    const {selectedNames, select} = useOptionSetSelection(optionSet, occurrencePropertySet);
    const options = useMemo(() => optionSet.getOptions(), [optionSet]);
    const selectedName = selectedNames[0] ?? '';

    return (
        <div className="flex flex-col gap-6">
            <RadioGroup.Root
                name={`${optionSet.getName()}-radio`}
                value={selectedName}
                onValueChange={select}
                className="flex flex-col gap-6 p-0"
            >
                {options.map((option) => {
                    const optionName = option.getName();
                    const formItems = option.getFormItems();
                    const optionDataSet = occurrencePropertySet.getPropertyArray(optionName)?.getSet(0);
                    const isChecked = selectedName === optionName;

                    return (
                        <div className="flex flex-col gap-7.5" key={optionName}>
                            <RadioGroup.Item value={optionName} disabled={!enabled}>
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
