import { PropertyTree, ValueTypes } from '@enonic/input-types/data';
import { afterEach, describe, expect, it } from 'vitest';
import { setAiValueAtPath } from './ai.bridge';
import { $aiDataTree } from './ai.store';

describe('setAiValueAtPath', () => {
    afterEach(() => {
        $aiDataTree.set(null);
    });

    it('writes an AI string into a date field as a date', () => {
        const tree = new PropertyTree();
        const prop = tree.getRoot().addProperty('published', ValueTypes.LOCAL_DATE.newValue('2000-01-01'));
        $aiDataTree.set(tree);

        expect(setAiValueAtPath({ kind: 'data', field: 'published' }, '2020-01-02')).toBe(true);

        expect(prop.getValue().getType()).toBe(ValueTypes.LOCAL_DATE);
        expect(prop.getLocalDate()?.toString()).toBe('2020-01-02');
    });

    it('leaves a date field empty when the AI string is not a date, without throwing', () => {
        const tree = new PropertyTree();
        const prop = tree.getRoot().addProperty('published', ValueTypes.LOCAL_DATE.newValue('2000-01-01'));
        $aiDataTree.set(tree);

        expect(setAiValueAtPath({ kind: 'data', field: 'published' }, 'next week')).toBe(true);

        expect(prop.getValue().isNull()).toBe(true);
    });

    it('writes an AI string into a text field as it is', () => {
        const tree = new PropertyTree();
        const prop = tree.getRoot().addString('title', 'old');
        $aiDataTree.set(tree);

        setAiValueAtPath({ kind: 'data', field: 'title' }, 'new');

        expect(prop.getString()).toBe('new');
    });
});
