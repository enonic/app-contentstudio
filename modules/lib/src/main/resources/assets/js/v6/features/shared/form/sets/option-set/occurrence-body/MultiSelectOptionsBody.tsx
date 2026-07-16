import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import type {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {FieldError, useValidationVisibility, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {Checkbox} from '@enonic/ui';
import {type ReactElement, useCallback, useMemo, useState} from 'react';
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

    // Tracks options selected during this editing session so their form items
    // start in 'interactive' mode — errors only surface after the user touches a field.
    const [freshlySelected, setFreshlySelected] = useState<Set<string>>(new Set());
    const parentVisibility = useValidationVisibility();

    const handleToggle = useCallback(
        (name: string) => {
            const isCurrentlySelected = selectedNames.includes(name);
            if (!isCurrentlySelected) {
                setFreshlySelected((prev) => new Set([...prev, name]));
            } else {
                setFreshlySelected((prev) => {
                    const next = new Set(prev);
                    next.delete(name);
                    return next;
                });
            }
            onToggle(name);
        },
        [selectedNames, onToggle],
    );

    return (
        <div className="flex flex-col gap-6">
            {options.map((option) => {
                const optionName = option.getName();
                const checked = selectedNames.includes(optionName);
                const formItems = option.getFormItems();
                const optionDataSet = occurrencePropertySet.getPropertyArray(optionName)?.getSet(0);
                const optionVisibility = freshlySelected.has(optionName) ? 'interactive' : parentVisibility;

                return (
                    <div className="flex flex-col gap-7.5" key={optionName}>
                        <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggle(optionName)}
                            disabled={!enabled || (isAtMax && !checked)}
                            label={option.getLabel() || optionName}
                        />
                        {checked && formItems.length > 0 && optionDataSet && (
                            <ValidationVisibilityProvider visibility={optionVisibility}>
                                <div className="ml-1.75 flex flex-col gap-7.5 border-l border-l-bdr-soft pl-5">
                                    {formItems.map((formItem) => (
                                        <FormItemRenderer key={formItem.getName()} formItem={formItem} propertySet={optionDataSet} />
                                    ))}
                                </div>
                            </ValidationVisibilityProvider>
                        )}
                    </div>
                );
            })}
            {error && <FieldError message={error} />}
        </div>
    );
};

MultiSelectOptionsBody.displayName = 'MultiSelectOptionsBody';
