import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {type ReactElement} from 'react';
import {instanceOf} from '../../utils/object/instanceOf';
import {FieldSetView} from './FieldSetView';
import {InputField} from './InputField';
import {ItemSetView} from './ItemSetView';
import {OptionSetView} from './OptionSetView';

type FormItemRendererProps = {
    formItem: FormItem;
    propertySet: PropertySet;
};

export const FormItemRenderer = ({formItem, propertySet}: FormItemRendererProps): ReactElement => {
    if (instanceOf(formItem, Input)) {
        return <InputField input={formItem} propertySet={propertySet} />;
    }
    if (instanceOf(formItem, FieldSet)) {
        return <FieldSetView fieldSet={formItem} propertySet={propertySet} />;
    }
    if (instanceOf(formItem, FormItemSet)) {
        return <ItemSetView name={formItem.getName()} />;
    }
    if (instanceOf(formItem, FormOptionSet)) {
        return <OptionSetView name={formItem.getName()} />;
    }
    return (
        <div className="rounded border border-dashed border-bdr-subtle px-3 py-2 text-xs text-subtle">
            {formItem.constructor.name}: {formItem.getName()} — unknown form item type
        </div>
    );
};

FormItemRenderer.displayName = 'FormItemRenderer';
