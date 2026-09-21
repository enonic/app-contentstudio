import type { PropertyArrayJson } from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import { PropertyTree } from '@enonic/lib-admin-ui/data/PropertyTree';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { FormBuilder } from '@enonic/lib-admin-ui/form/Form';
import type { FormItem } from '@enonic/lib-admin-ui/form/FormItem';
import { Input } from '@enonic/lib-admin-ui/form/Input';
import { FieldSet } from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import { FormItemSet } from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import { FormOptionSetOption } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import { initBuiltInTypes } from '@enonic/lib-admin-ui/form2';
import { beforeAll, describe, expect, it } from 'vitest';
import { normalizeFormValueTypes } from './normalizeFormValueTypes';

type Json = Record<string, unknown>;

const factory = {
    createFormItem: (json: Json): FormItem => {
        if (json.Input) return Input.fromJson(json.Input as Parameters<typeof Input.fromJson>[0]);
        if (json.FieldSet) return new FieldSet(json.FieldSet as ConstructorParameters<typeof FieldSet>[0], factory);
        if (json.FormItemSet)
            return new FormItemSet(json.FormItemSet as ConstructorParameters<typeof FormItemSet>[0], factory);
        if (json.FormOptionSet)
            return new FormOptionSet(json.FormOptionSet as ConstructorParameters<typeof FormOptionSet>[0], factory);
        if (json.FormOptionSetOption) {
            return new FormOptionSetOption(
                json.FormOptionSetOption as ConstructorParameters<typeof FormOptionSetOption>[0],
                factory,
            );
        }
        return null as never;
    },
};

function inputJson(name: string, inputType: string, config: Json = {}): Json {
    return { Input: { name, inputType, label: name, occurrences: { minimum: 0, maximum: 1 }, config, helpText: '' } };
}

function formOf(...items: Json[]): ReturnType<FormBuilder['build']> {
    const builder = new FormBuilder();
    for (const item of items) {
        builder.addFormItem(factory.createFormItem(item));
    }
    return builder.build();
}

function stringArray(name: string, ...values: string[]): PropertyArrayJson {
    return { name, type: 'String', values: values.map((v) => ({ v })) };
}

describe('normalizeFormValueTypes', () => {
    beforeAll(() => {
        initBuiltInTypes();
    });

    it('should convert a Long input stored as String to a Long property', () => {
        const tree = PropertyTree.fromJson([stringArray('size', '5')]);

        normalizeFormValueTypes(formOf(inputJson('size', 'Long')), tree.getRoot());

        const arr = tree.getRoot().getPropertyArray('size');
        expect(arr?.getType()).toBe(ValueTypes.LONG);
        expect(arr?.get(0)?.getValue().getLong()).toBe(5);
        expect(tree.toJson()).toEqual([{ name: 'size', type: 'Long', values: [{ v: 5 }] }]);
    });

    it('should leave values that already match the input type untouched', () => {
        const tree = PropertyTree.fromJson([stringArray('headline', 'Latest comments')]);
        const before = tree.toJson();

        normalizeFormValueTypes(formOf(inputJson('headline', 'TextLine')), tree.getRoot());

        expect(tree.toJson()).toEqual(before);
    });

    it('should ignore inputs without stored data and data without inputs', () => {
        const tree = PropertyTree.fromJson([stringArray('headling', 'Latest comments')]);
        const before = tree.toJson();

        normalizeFormValueTypes(formOf(inputJson('headline', 'TextLine'), inputJson('size', 'Long')), tree.getRoot());

        expect(tree.toJson()).toEqual(before);
    });

    it('should recurse into field sets, item sets and selected option-set options', () => {
        const tree = PropertyTree.fromJson([
            stringArray('count', '1'),
            {
                name: 'items',
                type: 'PropertySet',
                values: [{ set: [stringArray('size', '2')] }, { set: [stringArray('size', '3')] }],
            },
            {
                name: 'opts',
                type: 'PropertySet',
                values: [
                    {
                        set: [
                            stringArray('_selected', 'optA'),
                            { name: 'optA', type: 'PropertySet', values: [{ set: [stringArray('size', '4')] }] },
                        ],
                    },
                ],
            },
        ]);

        const form = formOf(
            { FieldSet: { name: 'fs', label: 'FS', items: [inputJson('count', 'Long')] } },
            {
                FormItemSet: {
                    name: 'items',
                    label: 'Items',
                    occurrences: { minimum: 0, maximum: 0 },
                    helpText: '',
                    items: [inputJson('size', 'Long')],
                },
            },
            {
                FormOptionSet: {
                    name: 'opts',
                    label: 'Options',
                    expanded: false,
                    occurrences: { minimum: 0, maximum: 1 },
                    multiselection: { minimum: 0, maximum: 1 },
                    helpText: '',
                    options: [
                        { name: 'optA', label: 'Option A', defaultOption: false, items: [inputJson('size', 'Long')] },
                    ],
                },
            },
        );

        normalizeFormValueTypes(form, tree.getRoot());

        const root = tree.getRoot();
        expect(root.getPropertyArray('count')?.get(0)?.getValue().getLong()).toBe(1);
        const items = root.getPropertyArray('items');
        expect(items?.getSet(0)?.getPropertyArray('size')?.getType()).toBe(ValueTypes.LONG);
        expect(items?.getSet(0)?.getPropertyArray('size')?.get(0)?.getValue().getLong()).toBe(2);
        expect(items?.getSet(1)?.getPropertyArray('size')?.get(0)?.getValue().getLong()).toBe(3);
        const optA = root.getPropertyArray('opts')?.getSet(0)?.getPropertyArray('optA')?.getSet(0);
        expect(optA?.getPropertyArray('size')?.get(0)?.getValue().getLong()).toBe(4);
        expect(root.getPropertyArray('opts')?.getSet(0)?.getPropertyArray('_selected')?.getType()).toBe(
            ValueTypes.STRING,
        );
    });
});
