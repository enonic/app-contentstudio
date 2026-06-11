import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {FormBuilder, type Form} from '@enonic/lib-admin-ui/form/Form';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {initBuiltInTypes} from '@enonic/lib-admin-ui/form2';
import {beforeAll, describe, expect, it} from 'vitest';
import {resolveDisplayNameExpression} from './displayNameExpression.utils';

type Json = Record<string, unknown>;

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

function inputJson(name: string, inputType: string): Json {
    return {Input: {name, inputType, label: name, occurrences: {minimum: 0, maximum: 1}, config: {}, helpText: ''}};
}

function formOf(...items: Json[]): Form {
    const builder = new FormBuilder();
    for (const item of items) {
        builder.addFormItem(factory.createFormItem(item));
    }
    return builder.build();
}

function treeOf(values: Record<string, string>): PropertyTree {
    const tree = new PropertyTree();
    for (const [path, value] of Object.entries(values)) {
        tree.setStringByPath(PropertyPath.fromString(path), value);
    }
    return tree;
}

describe('resolveDisplayNameExpression', () => {
    beforeAll(() => {
        initBuiltInTypes();
    });

    it('should substitute placeholders with the matching form values', () => {
        const form = formOf(inputJson('firstName', 'TextLine'), inputJson('lastName', 'TextLine'));
        const data = treeOf({firstName: 'John', lastName: 'Smith'});

        const result = resolveDisplayNameExpression('${firstName} ${lastName}', form, data);

        expect(result).toBe('John Smith');
    });

    it('should pad single quotes in values', () => {
        const form = formOf(inputJson('firstName', 'TextLine'), inputJson('lastName', 'TextLine'));
        const data = treeOf({firstName: 'John', lastName: "O'Brien"});

        const result = resolveDisplayNameExpression('${firstName} ${lastName}', form, data);

        expect(result).toBe("John O 'Brien");
    });

    it('should drop placeholders for empty fields and collapse whitespace', () => {
        const form = formOf(inputJson('firstName', 'TextLine'), inputJson('lastName', 'TextLine'));
        const data = treeOf({firstName: 'John'});

        const result = resolveDisplayNameExpression('${firstName} ${lastName}', form, data);

        expect(result).toBe('John');
    });

    it('should ignore values of excluded input types such as htmlarea', () => {
        const form = formOf(inputJson('title', 'TextLine'), inputJson('body', 'HtmlArea'));
        const data = treeOf({title: 'Hello', body: 'rich text'});

        const result = resolveDisplayNameExpression('${title} ${body}', form, data);

        expect(result).toBe('Hello');
    });

    it('should strip HTML tags and line breaks from values', () => {
        const form = formOf(inputJson('title', 'TextLine'));
        const data = treeOf({title: '<b>Bold</b>\nline'});

        const result = resolveDisplayNameExpression('${title}', form, data);

        expect(result).toBe('Boldline');
    });

    it('should resolve nested field paths using underscore-joined names', () => {
        const form = formOf({
            FormItemSet: {
                name: 'address',
                label: 'address',
                occurrences: {minimum: 1, maximum: 1},
                items: [inputJson('city', 'TextLine')],
            },
        });
        const data = treeOf({'address.city': 'Oslo'});

        const result = resolveDisplayNameExpression('${address.city}', form, data);

        expect(result).toBe('Oslo');
    });
});
