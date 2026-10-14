import { PropertyPath, PropertyTree } from '@enonic/input-types/data';
import { Form, formItemsFromJson } from '@enonic/input-types/schema';
import type { FormItemJson } from '@enonic/ui-types';
import { registerBuiltInTypes } from '@enonic/input-types';
import { getValuesAsString } from '@enonic/lib-admin-ui/util/PropertySetValues';
import { ValueTypes } from '@enonic/input-types/data';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolveDisplayNameExpression } from './displayNameExpression.utils';

function inputJson(name: string, inputType: string): FormItemJson {
    return {
        formItemType: 'Input',
        name,
        inputType,
        label: name,
        occurrences: { minimum: 0, maximum: 1 },
        config: {},
        helpText: '',
    };
}

function formOf(...items: FormItemJson[]): Form {
    return new Form(formItemsFromJson(items));
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
        registerBuiltInTypes();
    });

    it('should substitute placeholders with the matching form values', () => {
        const form = formOf(inputJson('firstName', 'TextLine'), inputJson('lastName', 'TextLine'));
        const data = treeOf({ firstName: 'John', lastName: 'Smith' });

        const result = resolveDisplayNameExpression('${firstName} ${lastName}', form, data);

        expect(result).toBe('John Smith');
    });

    it('should pad single quotes in values', () => {
        const form = formOf(inputJson('firstName', 'TextLine'), inputJson('lastName', 'TextLine'));
        const data = treeOf({ firstName: 'John', lastName: "O'Brien" });

        const result = resolveDisplayNameExpression('${firstName} ${lastName}', form, data);

        expect(result).toBe("John O 'Brien");
    });

    it('should drop placeholders for empty fields and collapse whitespace', () => {
        const form = formOf(inputJson('firstName', 'TextLine'), inputJson('lastName', 'TextLine'));
        const data = treeOf({ firstName: 'John' });

        const result = resolveDisplayNameExpression('${firstName} ${lastName}', form, data);

        expect(result).toBe('John');
    });

    it('should ignore values of excluded input types such as htmlarea', () => {
        const form = formOf(inputJson('title', 'TextLine'), inputJson('body', 'HtmlArea'));
        const data = treeOf({ title: 'Hello', body: 'rich text' });

        const result = resolveDisplayNameExpression('${title} ${body}', form, data);

        expect(result).toBe('Hello');
    });

    it('should strip HTML tags and line breaks from values', () => {
        const form = formOf(inputJson('title', 'TextLine'));
        const data = treeOf({ title: '<b>Bold</b>\nline' });

        const result = resolveDisplayNameExpression('${title}', form, data);

        expect(result).toBe('Boldline');
    });

    it('should resolve nested field paths using underscore-joined names', () => {
        const form = formOf({
            formItemType: 'ItemSet',
            name: 'address',
            label: 'address',
            occurrences: { minimum: 1, maximum: 1 },
            items: [inputJson('city', 'TextLine')],
        });
        const data = treeOf({ 'address.city': 'Oslo' });

        const result = resolveDisplayNameExpression('${address.city}', form, data);

        expect(result).toBe('Oslo');
    });
});

describe('getValuesAsString', () => {
    it('reads the first occurrence of every field, through nested sets, with its data path', () => {
        const tree = new PropertyTree();
        tree.getRoot().addStrings('tags', ['first', 'second']);
        tree.getRoot().addPropertySet('address').addString('city', 'Oslo');

        expect(getValuesAsString(tree.getRoot())).toEqual([
            { name: 'tags', value: 'first', path: 'tags' },
            { name: 'city', value: 'Oslo', path: 'address.city' },
        ]);
    });

    it("leaves out an option set's _selected array and gives an empty value for a null", () => {
        const tree = new PropertyTree();
        const optionSet = tree.getRoot().addPropertySet('options');
        optionSet.addStrings('_selected', ['one']);
        optionSet.addProperty('note', ValueTypes.STRING.newNullValue());

        expect(getValuesAsString(tree.getRoot())).toEqual([{ name: 'note', value: '', path: 'options.note' }]);
    });
});
