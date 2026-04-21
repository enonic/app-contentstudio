import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {InputField} from '@enonic/lib-admin-ui/form2';
import {type ReactElement} from 'react';
import {instanceOf} from '../../utils/object/instanceOf';
import {FieldSetView} from './FieldSetView';
import {useFormRender} from './FormRenderContext';
import {ItemSetView} from './sets/item-set';
import {OptionSetView} from './sets/option-set';

type FormItemRendererProps = {
    formItem: FormItem;
    propertySet: PropertySet;
};

const FORM_ITEM_RENDERER_NAME = 'FormItemRenderer';

export const FormItemRenderer = ({formItem, propertySet}: FormItemRendererProps): ReactElement => {
    const {enabled} = useFormRender();

    if (instanceOf(formItem, Input)) {
        return <InputField input={formItem} propertySet={propertySet} enabled={enabled} />;
    }
    if (instanceOf(formItem, FieldSet)) {
        return <FieldSetView fieldSet={formItem} propertySet={propertySet} />;
    }
    if (instanceOf(formItem, FormItemSet)) {
        return <ItemSetView itemSet={formItem} propertySet={propertySet} />;
    }
    if (instanceOf(formItem, FormOptionSet)) {
        return <OptionSetView optionSet={formItem} propertySet={propertySet} />;
    }
    return (
        <div
            data-component={FORM_ITEM_RENDERER_NAME}
            className="rounded border border-dashed border-bdr-subtle px-3 py-2 text-xs text-subtle"
        >
            {formItem.constructor.name}: {formItem.getName()} — unknown form item type
        </div>
    );
};

FormItemRenderer.displayName = FORM_ITEM_RENDERER_NAME;
