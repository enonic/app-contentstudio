import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {type ReactElement, useMemo} from 'react';
import {FormItemRenderer} from '../../../FormItemRenderer';
import {useOptionSetSelection} from '../useOptionSetSelection';

type RadioSelectedOptionBodyProps = {
    optionSet: FormOptionSet;
    occurrencePropertySet: PropertySet;
};

export const RadioSelectedOptionBody = ({optionSet, occurrencePropertySet}: RadioSelectedOptionBodyProps): ReactElement | null => {
    const {selectedNames} = useOptionSetSelection(optionSet, occurrencePropertySet);
    const selectedOption = useMemo(
        () => optionSet.getOptions().find((o) => selectedNames.includes(o.getName())),
        [optionSet, selectedNames]
    );
    const optionName = selectedOption?.getName();
    const formItems = selectedOption?.getFormItems();
    const optionDataSet = occurrencePropertySet.getPropertyArray(optionName)?.getSet(0);

    if (!selectedOption || !formItems || formItems.length === 0 || !optionDataSet) return null;

    return (
        <div className="flex flex-col gap-7.5">
            {formItems.map((formItem) => (
                <FormItemRenderer key={formItem.getName()} formItem={formItem} propertySet={optionDataSet} />
            ))}
        </div>
    );
};

RadioSelectedOptionBody.displayName = 'RadioSelectedOptionBody';
