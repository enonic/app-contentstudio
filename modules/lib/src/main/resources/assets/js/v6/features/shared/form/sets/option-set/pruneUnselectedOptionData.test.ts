import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {describe, expect, it} from 'vitest';
import {pruneUnselectedOptionData} from './pruneUnselectedOptionData';

function optionWithText(occurrence: PropertySet, name: string, text: string): PropertySet {
    const option = occurrence.addPropertySet(name);
    option.addString('text', text);
    return option;
}

describe('pruneUnselectedOptionData', () => {
    it('removes data of unselected options and keeps selected ones', () => {
        const tree = new PropertyTree();
        const occurrence = tree.getRoot().addPropertySet('myOptionSet');
        occurrence.addString('_selected', 'opt1');
        optionWithText(occurrence, 'opt1', 'keep');
        optionWithText(occurrence, 'opt2', 'drop');

        pruneUnselectedOptionData(tree.getRoot());

        expect(occurrence.getPropertyArray('opt1')).not.toBeNull();
        expect(occurrence.getPropertyArray('opt2')).toBeUndefined();
        expect(occurrence.getPropertyArray('_selected')).not.toBeNull();
    });

    it('keeps all options when every option is selected', () => {
        const tree = new PropertyTree();
        const occurrence = tree.getRoot().addPropertySet('myOptionSet');
        occurrence.addString('_selected', 'opt1');
        occurrence.addString('_selected', 'opt2');
        optionWithText(occurrence, 'opt1', 'a');
        optionWithText(occurrence, 'opt2', 'b');

        pruneUnselectedOptionData(tree.getRoot());

        expect(occurrence.getPropertyArray('opt1')).not.toBeNull();
        expect(occurrence.getPropertyArray('opt2')).not.toBeNull();
    });

    it('prunes nested option sets inside a selected option', () => {
        const tree = new PropertyTree();
        const outer = tree.getRoot().addPropertySet('outer');
        outer.addString('_selected', 'opt1');
        const opt1 = outer.addPropertySet('opt1');

        const inner = opt1.addPropertySet('inner');
        inner.addString('_selected', 'inner1');
        optionWithText(inner, 'inner1', 'keep');
        optionWithText(inner, 'inner2', 'drop');

        pruneUnselectedOptionData(tree.getRoot());

        expect(outer.getPropertyArray('opt1')).not.toBeNull();
        expect(inner.getPropertyArray('inner1')).not.toBeNull();
        expect(inner.getPropertyArray('inner2')).toBeUndefined();
    });

    it('does not touch sets without a _selected array', () => {
        const tree = new PropertyTree();
        const plain = tree.getRoot().addPropertySet('plain');
        plain.addString('text', 'value');
        const child = plain.addPropertySet('child');
        child.addString('text', 'nested');

        pruneUnselectedOptionData(tree.getRoot());

        expect(plain.getPropertyArray('text')).not.toBeNull();
        expect(plain.getPropertyArray('child')).not.toBeNull();
        expect(child.getPropertyArray('text')).not.toBeNull();
    });
});
