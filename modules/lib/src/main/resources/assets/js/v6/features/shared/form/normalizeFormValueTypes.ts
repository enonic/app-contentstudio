import type { PropertyArray } from '@enonic/lib-admin-ui/data/PropertyArray';
import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import { ValueTypeConverter } from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import type { Form } from '@enonic/lib-admin-ui/form/Form';
import type { FormItem } from '@enonic/lib-admin-ui/form/FormItem';
import { Input } from '@enonic/lib-admin-ui/form/Input';
import { FieldSet } from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import { FormItemSet } from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import { InputTypeRegistry } from '@enonic/lib-admin-ui/form2';
import { instanceOf } from '../../../shared/lib/object/instanceOf';

export function normalizeFormValueTypes(form: Form, root: PropertySet): void {
    normalizeFormItems(form.getFormItems(), root);
}

function normalizeFormItems(items: FormItem[], propertySet: PropertySet): void {
    for (const item of items) {
        normalizeFormItem(item, propertySet);
    }
}

function normalizeFormItem(item: FormItem, propertySet: PropertySet): void {
    if (instanceOf(item, Input)) {
        normalizeInput(item, propertySet);
        return;
    }
    if (instanceOf(item, FieldSet)) {
        normalizeFormItems(item.getFormItems(), propertySet);
        return;
    }
    if (instanceOf(item, FormItemSet)) {
        forEachSet(propertySet.getPropertyArray(item.getName()), (occurrence) => {
            normalizeFormItems(item.getFormItems(), occurrence);
        });
        return;
    }
    if (instanceOf(item, FormOptionSet)) {
        normalizeOptionSet(item, propertySet);
    }
}

function normalizeInput(input: Input, propertySet: PropertySet): void {
    const propertyArray = propertySet.getPropertyArray(input.getName());
    if (propertyArray == null) return;

    const valueType = InputTypeRegistry.getDefinition(input.getInputType().getName())?.descriptor.getValueType();
    if (valueType == null || valueType.equals(propertyArray.getType())) return;

    ValueTypeConverter.convertArrayValues(propertyArray, valueType);
}

function normalizeOptionSet(optionSet: FormOptionSet, propertySet: PropertySet): void {
    forEachSet(propertySet.getPropertyArray(optionSet.getName()), (occurrence) => {
        for (const option of optionSet.getOptions()) {
            forEachSet(occurrence.getPropertyArray(option.getName()), (optionData) => {
                normalizeFormItems(option.getFormItems(), optionData);
            });
        }
    });
}

function forEachSet(propertyArray: PropertyArray | undefined, callback: (set: PropertySet) => void): void {
    if (propertyArray == null || !propertyArray.getType().equals(ValueTypes.DATA)) return;

    const size = propertyArray.getSize();
    for (let i = 0; i < size; i++) {
        const set = propertyArray.getSet(i);
        if (set != null) callback(set);
    }
}
