import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import type {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {FieldError} from '@enonic/lib-admin-ui/form2';
import {Checkbox} from '@enonic/ui';
import {type ReactElement, useMemo} from 'react';
import {FormItemRenderer} from '../../../FormItemRenderer';

type MultiSelectOptionsBodyProps = {
    enabled: boolean;
    optionSet: FormOptionSet;
    occurrencePropertySet: PropertySet;
    selectedNames: string[];
    onToggle: (name: string) => void;
    error?: string;
};

export const MultiSelectOptionsBody = ({
    enabled,
    optionSet,
    occurrencePropertySet,
    selectedNames,
    onToggle,
    error,
}: MultiSelectOptionsBodyProps): ReactElement => {
    const multiselection = optionSet.getMultiselection();
    const isRadio = optionSet.isRadioSelection();
    const options: FormOptionSetOption[] = useMemo(() => optionSet.getOptions(), [optionSet]);
    const isAtMax = !isRadio && multiselection.getMaximum() > 0 && selectedNames.length >= multiselection.getMaximum();

    return (
        <div className="flex flex-col gap-6">
            {options.map((option) => {
                const optionName = option.getName();
                const checked = selectedNames.includes(optionName);
                const formItems = option.getFormItems();
                const optionDataSet = occurrencePropertySet.getPropertyArray(optionName)?.getSet(0);

                return (
                    <div className="flex flex-col gap-7.5" key={optionName}>
                        <Checkbox
                            checked={checked}
                            onCheckedChange={() => onToggle(optionName)}
                            disabled={!enabled || (isAtMax && !checked)}
                            label={option.getLabel() || optionName}
                        />
                        {checked && formItems.length > 0 && optionDataSet && (
                            <div className="flex flex-col gap-7.5">
                                {formItems.map((formItem) => (
                                    <FormItemRenderer key={formItem.getName()} formItem={formItem} propertySet={optionDataSet} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            {error && <FieldError message={error} />}
        </div>
    );
};

MultiSelectOptionsBody.displayName = 'MultiSelectOptionsBody';
