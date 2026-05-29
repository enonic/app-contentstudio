import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {initBuiltInTypes} from '@enonic/lib-admin-ui/form2';
import {beforeAll, describe, expect, it} from 'vitest';
import {seedFormDefaults} from './seedFormDefaults';

type Json = Record<string, unknown>;

// Recursive factory mirroring how the server JSON is materialized into a Form.
const factory = {
    createFormItem: (json: Json): FormItem => {
        if (json.Input) return Input.fromJson(json.Input as Parameters<typeof Input.fromJson>[0]);
        if (json.FieldSet) return new FieldSet(json.FieldSet as ConstructorParameters<typeof FieldSet>[0], factory);
        if (json.FormItemSet) return new FormItemSet(json.FormItemSet as ConstructorParameters<typeof FormItemSet>[0], factory);
        if (json.FormOptionSet) return new FormOptionSet(json.FormOptionSet as ConstructorParameters<typeof FormOptionSet>[0], factory);
        if (json.FormOptionSetOption) {
            return new FormOptionSetOption(json.FormOptionSetOption as ConstructorParameters<typeof FormOptionSetOption>[0], factory);
        }
        return null as never;
    },
};

function inputJson(name: string, inputType: string, min: number, max: number, config: Json = {}): Json {
    return {Input: {name, inputType, label: name, occurrences: {minimum: min, maximum: max}, config, helpText: ''}};
}

function formOf(...items: Json[]): ReturnType<FormBuilder['build']> {
    const builder = new FormBuilder();
    for (const item of items) {
        builder.addFormItem(factory.createFormItem(item));
    }
    return builder.build();
}

function seed(...items: Json[]): PropertyTree {
    const tree = new PropertyTree();
    seedFormDefaults(formOf(...items), tree.getRoot());
    return tree;
}

describe('seedFormDefaults', () => {
    beforeAll(() => {
        initBuiltInTypes();
    });

    it('does nothing for an empty form', () => {
        const tree = new PropertyTree();
        expect(() => seedFormDefaults(new FormBuilder().build(), tree.getRoot())).not.toThrow();
    });

    it('seeds a single Checkbox with its configured default', () => {
        const tree = seed(inputJson('agree', 'Checkbox', 0, 1, {default: [{value: 'checked'}]}));

        const arr = tree.getRoot().getPropertyArray('agree');
        expect(arr?.getSize()).toBe(1);
        expect(arr?.get(0)?.getValue().getBoolean()).toBe(true);
    });

    it('seeds a single input occurrence even without a default value', () => {
        const tree = seed(inputJson('title', 'TextLine', 0, 1));

        const arr = tree.getRoot().getPropertyArray('title');
        // Single-occurrence input still materializes one (null) value.
        expect(arr?.getSize()).toBe(1);
        expect(arr?.get(0)?.getValue().isNull()).toBe(true);
    });

    it('seeds minimum occurrences for a list input', () => {
        const tree = seed(inputJson('tags', 'TextLine', 3, 5));
        expect(tree.getRoot().getPropertyArray('tags')?.getSize()).toBe(3);
    });

    it('does not add values for internal-mode inputs (selectors)', () => {
        const tree = seed(inputJson('ref', 'ComboBox', 1, 1));
        // Array is materialized but left empty — selectors aren't auto-seeded.
        expect(tree.getRoot().getPropertyArray('ref')?.getSize()).toBe(0);
    });

    it('does not seed or crash on unregistered input types', () => {
        const tree = new PropertyTree();
        const form = formOf(inputJson('weird', 'NoSuchType', 1, 1));

        expect(() => seedFormDefaults(form, tree.getRoot())).not.toThrow();
        expect(tree.getRoot().getPropertyArray('weird') == null).toBe(true);
    });

    it('recurses into FieldSet children on the same property set', () => {
        const tree = seed({
            FieldSet: {name: 'fs', label: 'FS', items: [inputJson('agree', 'Checkbox', 0, 1, {default: [{value: 'checked'}]})]},
        });

        // FieldSet is a layout grouping — child lands on the root, not nested.
        expect(tree.getRoot().getPropertyArray('agree')?.get(0)?.getValue().getBoolean()).toBe(true);
    });

    it('seeds minimum item-set occurrences and their child defaults', () => {
        const tree = seed({
            FormItemSet: {
                name: 'items',
                label: 'Items',
                occurrences: {minimum: 2, maximum: 0},
                helpText: '',
                items: [inputJson('flag', 'Checkbox', 0, 1, {default: [{value: 'checked'}]})],
            },
        });

        const arr = tree.getRoot().getPropertyArray('items');
        expect(arr?.getSize()).toBe(2);
        expect(arr?.getSet(0)?.getPropertyArray('flag')?.get(0)?.getValue().getBoolean()).toBe(true);
        expect(arr?.getSet(1)?.getPropertyArray('flag')?.get(0)?.getValue().getBoolean()).toBe(true);
    });

    it('does not seed an optional item set (min 0)', () => {
        const tree = seed({
            FormItemSet: {name: 'items', label: 'Items', occurrences: {minimum: 0, maximum: 0}, helpText: '', items: []},
        });

        const arr = tree.getRoot().getPropertyArray('items');
        expect(arr == null || arr.getSize() === 0).toBe(true);
    });

    it('seeds a locked-single radio option set: selects the default option and seeds its children', () => {
        const tree = seed({
            FormOptionSet: {
                name: 'opts',
                label: 'Options',
                expanded: false,
                occurrences: {minimum: 1, maximum: 1},
                multiselection: {minimum: 1, maximum: 1},
                helpText: '',
                options: [
                    {
                        name: 'optA',
                        label: 'Option A',
                        defaultOption: true,
                        items: [inputJson('flag', 'Checkbox', 0, 1, {default: [{value: 'checked'}]})],
                    },
                    {name: 'optB', label: 'Option B', defaultOption: false, items: []},
                ],
            },
        });

        const arr = tree.getRoot().getPropertyArray('opts');
        expect(arr?.getSize()).toBe(1);

        const occurrence = arr?.getSet(0);
        expect(occurrence?.getPropertyArray('_selected')?.get(0)?.getValue().getString()).toBe('optA');
        expect(occurrence?.getPropertyArray('optA')?.getSet(0)?.getPropertyArray('flag')?.get(0)?.getValue().getBoolean()).toBe(true);
        // Non-selected option is not materialized.
        expect(occurrence?.getPropertyArray('optB') == null).toBe(true);
    });

    it('does not seed occurrences for a non-locked radio option set', () => {
        const tree = seed({
            FormOptionSet: {
                name: 'opts',
                label: 'Options',
                expanded: false,
                occurrences: {minimum: 0, maximum: 0},
                multiselection: {minimum: 1, maximum: 1},
                helpText: '',
                options: [{name: 'optA', label: 'A', defaultOption: true, items: []}],
            },
        });

        const arr = tree.getRoot().getPropertyArray('opts');
        expect(arr == null || arr.getSize() === 0).toBe(true);
    });
});
