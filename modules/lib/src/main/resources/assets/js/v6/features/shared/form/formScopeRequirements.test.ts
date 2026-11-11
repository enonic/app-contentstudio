import { inputTypeRegistry, registerBuiltInTypes } from '@enonic/input-types';
import { PropertyTree } from '@enonic/input-types/data';
import { Form, FormItemSet, Input, InputTypeName, Occurrences } from '@enonic/input-types/schema';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Project } from '../../../../app/settings/data/project/Project';
import { hasCreatableTypeInputs, hasScopeDisabledInputs, isFormValidInScope } from './formScopeRequirements';
import { ContentSelectorDescriptor } from './input-types/content-selector/ContentSelectorDescriptor';
import { ImageUploaderDescriptor } from './input-types/image-uploader/ImageUploaderDescriptor';

const project = { getName: () => 'layer' } as unknown as Project;

const input = (name: string, type: string, minimum = 0): Input =>
    Input.create()
        .setName(name)
        .setInputType(new InputTypeName(type))
        .setLabel(name)
        .setOccurrences(Occurrences.minmax(minimum, 1))
        .build();
const required = (name: string, type: string): Input => input(name, type, 1);

describe('hasScopeDisabledInputs', () => {
    it('should be true for a project-bound input in a scope without a project', () => {
        const form = new Form([input('title', 'TextLine'), input('related', 'ContentSelector')]);

        expect(hasScopeDisabledInputs(form, { project: null, content: null })).toBe(true);
    });

    it('should be false for a project-bound input in a scope with a project', () => {
        const form = new Form([input('related', 'ContentSelector')]);

        expect(hasScopeDisabledInputs(form, { project, content: null })).toBe(false);
    });

    it('should be true for a content-bound input in a scope with a project but no content', () => {
        const form = new Form([input('hero', 'ImageUploader')]);

        expect(hasScopeDisabledInputs(form, { project, content: null })).toBe(true);
    });

    it('should find an input nested in an item set', () => {
        const nested = new FormItemSet({
            name: 'block',
            label: 'Block',
            occurrences: Occurrences.minmax(0, 5),
            items: [input('image', 'ImageSelector')],
        });
        const form = new Form([input('title', 'TextLine'), nested]);

        expect(hasScopeDisabledInputs(form, { project: null, content: null })).toBe(true);
    });

    it('should be false for a form without scope-bound inputs in an empty scope', () => {
        const form = new Form([input('title', 'TextLine'), input('body', 'HtmlArea')]);

        expect(hasScopeDisabledInputs(form, { project: null, content: null })).toBe(false);
    });

    it('should be false when the scope leaves both keys to the stores', () => {
        const form = new Form([input('hero', 'ImageUploader')]);

        expect(hasScopeDisabledInputs(form, {})).toBe(false);
    });
});

describe('hasCreatableTypeInputs', () => {
    it('should be true for a content selector, also nested in an item set', () => {
        expect(hasCreatableTypeInputs(new Form([input('related', 'ContentSelector')]))).toBe(true);

        const nested = new FormItemSet({
            name: 'links',
            label: 'Links',
            occurrences: Occurrences.minmax(0, 5),
            items: [input('related', 'ContentSelector')],
        });
        expect(hasCreatableTypeInputs(new Form([input('title', 'TextLine'), nested]))).toBe(true);
    });

    it('should be false for selectors that take only media, and for plain inputs', () => {
        const form = new Form([
            input('title', 'TextLine'),
            input('hero', 'ImageSelector'),
            input('files', 'MediaSelector'),
        ]);

        expect(hasCreatableTypeInputs(form)).toBe(false);
    });
});

describe('isFormValidInScope', () => {
    beforeAll(() => {
        registerBuiltInTypes();
        inputTypeRegistry.registerType({ mode: 'internal', descriptor: ContentSelectorDescriptor }, true);
        inputTypeRegistry.registerType({ mode: 'internal', descriptor: ImageUploaderDescriptor }, true);
    });

    it('should not count a required project-bound input while creating, so a change to a plain input validates', () => {
        const form = new Form([input('title', 'TextLine'), required('related', 'ContentSelector')]);
        const set = new PropertyTree().getRoot();
        set.setString('title', 0, 'hello');

        expect(isFormValidInScope(form, set, { project: null, content: null })).toBe(true);
        expect(isFormValidInScope(form, set, { project, content: null })).toBe(false);
    });

    it('should not count a required content-bound input in a project config', () => {
        const form = new Form([required('hero', 'ImageUploader')]);
        const set = new PropertyTree().getRoot();

        expect(isFormValidInScope(form, set, { project, content: null })).toBe(true);
        expect(isFormValidInScope(form, set, {})).toBe(false);
    });

    it('should still fail on a required plain input', () => {
        const form = new Form([required('title', 'TextLine'), required('related', 'ContentSelector')]);
        const set = new PropertyTree().getRoot();

        expect(isFormValidInScope(form, set, { project: null, content: null })).toBe(false);
    });
});
