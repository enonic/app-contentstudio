import type {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {type ReactElement} from 'react';
import {FormItemRenderer} from './FormItemRenderer';

type FieldSetViewProps = {
    fieldSet: FieldSet;
    propertySet: PropertySet;
};

export const FieldSetView = ({fieldSet, propertySet}: FieldSetViewProps): ReactElement => {
    const formItems = fieldSet.getFormItems();

    return (
        <fieldset className="flex flex-col">
            {fieldSet.getLabel() && (
                <span className="mb-7.5 text-base font-normal uppercase leading-3.5 tracking-[0.96px]">{fieldSet.getLabel()}</span>
            )}
            {formItems.length > 0 && (
                <div className="flex flex-col gap-7.5 border-l border-l-bdr-soft pl-5">
                    {formItems.map(item => (
                        <FormItemRenderer key={item.getName()} formItem={item} propertySet={propertySet} />
                    ))}
                </div>
            )}
        </fieldset>
    );
};

FieldSetView.displayName = 'FieldSetView';
