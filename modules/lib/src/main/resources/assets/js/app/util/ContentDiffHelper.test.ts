import { PropertyTree } from '@enonic/lib-admin-ui/data/PropertyTree';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { describe, expect, it } from 'vitest';
import { ContentDiffHelper } from './ContentDiffHelper';

describe('ContentDiffHelper.dataEquivalent', () => {
    it('treats a null property as equal to an absent property', () => {
        const persisted = new PropertyTree();
        persisted.addString('title', 'Original');

        const rendered = persisted.copy();
        rendered.getRoot().addProperty('details', ValueTypes.STRING.newNullValue());

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(true);
        expect(ContentDiffHelper.dataEquivalent(rendered, persisted)).toBe(true);
    });

    it('treats null properties inside a nested set as equal to absent ones', () => {
        const persisted = new PropertyTree();
        persisted.addPropertySet('menu-item');

        const rendered = persisted.copy();
        const renderedSet = rendered.getRoot().getPropertySet('menu-item');
        renderedSet.addProperty('menuItem', ValueTypes.BOOLEAN.newNullValue());
        renderedSet.addProperty('menuName', ValueTypes.STRING.newNullValue());

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(true);
    });

    it('treats a null property as equal to an absent one when siblings in the same item-set differ in shape', () => {
        const persisted = new PropertyTree();
        const oldVersion = persisted.addPropertySet('version');
        oldVersion.addString('versionNumber', '4.5.0');
        const newVersion = persisted.addPropertySet('version');
        newVersion.addString('versionNumber', '4.6.0');
        newVersion.addString('sha512', 'abc');

        const rendered = persisted.copy();
        rendered.getRoot().getPropertySet('version', 0).addProperty('sha512', ValueTypes.STRING.newNullValue());

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(true);
    });

    it('detects a changed value', () => {
        const persisted = new PropertyTree();
        persisted.addString('title', 'Original');

        const rendered = new PropertyTree();
        rendered.addString('title', 'Changed');

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(false);
    });

    it('detects a null property replacing a real value', () => {
        const persisted = new PropertyTree();
        persisted.addString('details', 'Something');

        const rendered = new PropertyTree();
        rendered.getRoot().addProperty('details', ValueTypes.STRING.newNullValue());

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(false);
    });

    it('does not treat an empty string as absent', () => {
        const persisted = new PropertyTree();

        const rendered = new PropertyTree();
        rendered.addString('details', '');

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(false);
    });

    it('does not treat a false boolean as absent', () => {
        const persisted = new PropertyTree();

        const rendered = new PropertyTree();
        rendered.getRoot().addProperty('flag', ValueTypes.BOOLEAN.newValue('false'));

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(false);
    });

    it('keeps null properties on changed paths significant', () => {
        const persisted = new PropertyTree();
        persisted.addString('title', 'a');

        const rendered = persisted.copy();
        rendered.getRoot().addProperty('details', ValueTypes.STRING.newNullValue());

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(true);
        expect(ContentDiffHelper.dataEquivalent(persisted, rendered, ['details'])).toBe(false);
        expect(ContentDiffHelper.dataEquivalent(persisted, rendered, ['details[1]'])).toBe(false);
    });

    it('keeps a null occurrence alongside real values significant', () => {
        const persisted = new PropertyTree();
        persisted.addString('title', 'a');

        const rendered = persisted.copy();
        rendered.getRoot().addProperty('title', ValueTypes.STRING.newNullValue());

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(false);
        expect(ContentDiffHelper.dataEquivalent(rendered, persisted)).toBe(false);
    });

    it('detects an added empty set occurrence', () => {
        const persisted = new PropertyTree();
        persisted.addString('title', 'Original');

        const rendered = persisted.copy();
        rendered.addPropertySet('version');

        expect(ContentDiffHelper.dataEquivalent(persisted, rendered)).toBe(false);
    });
});
