import type {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {type ReactElement} from 'react';
import {FormItemRenderer} from './FormItemRenderer';

type FieldSetViewProps = {
    fieldSet: FieldSet;
    propertySet: PropertySet;
};

export const FieldSetView = ({fieldSet, propertySet}: FieldSetViewProps): ReactElement => {
    return (
        <fieldset className="flex flex-col gap-7.5">
            {fieldSet.getLabel() && (
                <span className="text-base font-normal uppercase leading-3.5 tracking-[0.96px]">{fieldSet.getLabel()}</span>
            )}
            {fieldSet.getFormItems().map(item => (
                <div key={item.getName()} className="pl-5 border border-transparent border-l-bdr-soft">
                    <FormItemRenderer formItem={item} propertySet={propertySet} />
                </div>
            ))}
        </fieldset>
    );
};

FieldSetView.displayName = 'FieldSetView';
