import {type PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {type FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {type ReactElement} from 'react';
import {FormInputView} from './FormInputView';
import {FormUnsupportedView} from './FormUnsupportedView';

export type FormItemViewProps = {
    formItem: FormItem;
    parentPath?: PropertyPath;
};

export type FormFieldSetViewProps = {
    fieldSet: FieldSet;
    parentPath?: PropertyPath;
};

export const FormFieldSetView = ({fieldSet, parentPath}: FormFieldSetViewProps): ReactElement => {
    return (
        <fieldset className="flex flex-col gap-5">
            {fieldSet.getLabel() && (
                <span className="text-base font-normal uppercase leading-3.5 tracking-[0.96px]">{fieldSet.getLabel()}</span>
            )}
            {fieldSet.getFormItems().map(item => (
                <div className='pl-5 border border-transparent border-l-bdr-soft'>
                    <FormItemView
                        key={item.getName()}
                        formItem={item}
                        parentPath={parentPath}
                    />
                </div>

            ))}
        </fieldset>
    );
};

FormFieldSetView.displayName = 'FormFieldSetView';

export const FormItemView = ({formItem, parentPath}: FormItemViewProps): ReactElement | null => {
    if (formItem instanceof Input) {
        return <FormInputView input={formItem} parentPath={parentPath} />;
    }
    if (formItem instanceof FieldSet) {
        return <FormFieldSetView fieldSet={formItem} parentPath={parentPath} />;
    }
    if (formItem instanceof FormItemSet) {
        return <FormUnsupportedView name={formItem.getName()} type="FormItemSet" />;
    }
    if (formItem instanceof FormOptionSet) {
        return <FormUnsupportedView name={formItem.getName()} type="FormOptionSet" />;
    }
    return null;
};

FormItemView.displayName = 'FormItemView';
