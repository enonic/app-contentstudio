import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FieldError, useI18n, useValidationVisibility} from '@enonic/lib-admin-ui/form2';
import {type ReactElement, useCallback, useMemo, useState} from 'react';
import {FormItemRenderer} from '../FormItemRenderer';
import {OptionSelector} from './OptionSelector';
import {useOptionSetSelection} from './useOptionSetSelection';

type OptionSetOccurrenceViewProps = {
    optionSet: FormOptionSet;
    occurrencePropertySet: PropertySet;
    enabled: boolean;
};

export const OptionSetOccurrenceView = ({
    optionSet,
    occurrencePropertySet,
    enabled,
}: OptionSetOccurrenceViewProps): ReactElement => {
    const t = useI18n();
    const visibility = useValidationVisibility();
    const [interacted, setInteracted] = useState(false);
    const multiselection = optionSet.getMultiselection();

    const {selectedNames, isSelected, select, deselect, toggle} = useOptionSetSelection(
        optionSet,
        occurrencePropertySet,
    );

    const showErrors = visibility === 'all' || (visibility === 'interactive' && interacted);

    const multiselectionError = useMemo(() => {
        if (!showErrors) return undefined;
        const count = selectedNames.length;
        const min = multiselection.getMinimum();
        const max = multiselection.getMaximum();

        if (multiselection.minimumBreached(count)) {
            return min === 1
                ? t('field.optionset.breaks.min.one')
                : t('field.optionset.breaks.min.many', min);
        }
        if (multiselection.maximumBreached(count)) {
            return max === 1
                ? t('field.optionset.breaks.max.one')
                : t('field.optionset.breaks.max.many', max);
        }
        return undefined;
    }, [showErrors, selectedNames, multiselection, t]);

    const handleSelect = useCallback((name: string) => {
        setInteracted(true);
        select(name);
    }, [select]);

    const handleDeselect = useCallback((name: string) => {
        setInteracted(true);
        deselect(name);
    }, [deselect]);

    const handleToggle = useCallback((name: string) => {
        setInteracted(true);
        toggle(name);
    }, [toggle]);

    // Render nested form items for selected options
    const selectedOptions = useMemo(() => {
        return optionSet.getOptions().filter(o => selectedNames.includes(o.getName()));
    }, [optionSet, selectedNames]);

    return (
        <div className="flex flex-col gap-4" data-component="OptionSetOccurrenceView">
            <OptionSelector
                optionSet={optionSet}
                selectedNames={selectedNames}
                isSelected={isSelected}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
                onToggle={handleToggle}
                enabled={enabled}
            />
            {multiselectionError != null && <FieldError message={multiselectionError} />}
            {selectedOptions.map(option => {
                const optionName = option.getName();
                const formItems = option.getFormItems();
                if (formItems.length === 0) return null;

                const optionDataSet = occurrencePropertySet
                    .getPropertyArray(optionName)
                    ?.getSet(0);

                if (optionDataSet == null) return null;

                return (
                    <div
                        key={optionName}
                        className="flex flex-col gap-7.5 border-l border-bdr-soft pl-5"
                    >
                        {formItems.map(formItem => (
                            <FormItemRenderer
                                key={formItem.getName()}
                                formItem={formItem}
                                propertySet={optionDataSet}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

OptionSetOccurrenceView.displayName = 'OptionSetOccurrenceView';
