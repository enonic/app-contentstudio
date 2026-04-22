import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {type ReactElement, useMemo} from 'react';
import {FormItemRenderer} from '../../../FormItemRenderer';

type RadioSelectedOptionBodyProps = {
    optionSet: FormOptionSet;
    occurrencePropertySet: PropertySet;
    selectedNames: string[];
};

export const RadioSelectedOptionBody = ({
    optionSet,
    occurrencePropertySet,
    selectedNames,
}: RadioSelectedOptionBodyProps): ReactElement | null => {
    const selectedOption = useMemo(
        () => optionSet.getOptions().find((o) => selectedNames.includes(o.getName())),
        [optionSet, selectedNames]
    );

    if (!selectedOption) return null;

    const formItems = selectedOption.getFormItems();
    if (formItems.length === 0) return null;

    const optionDataSet = occurrencePropertySet.getPropertyArray(selectedOption.getName())?.getSet(0);
    if (!optionDataSet) return null;

    return (
        <div className="flex flex-col gap-7.5">
            {formItems.map((formItem) => (
                <FormItemRenderer key={formItem.getName()} formItem={formItem} propertySet={optionDataSet} />
            ))}
        </div>
    );
};

RadioSelectedOptionBody.displayName = 'RadioSelectedOptionBody';
