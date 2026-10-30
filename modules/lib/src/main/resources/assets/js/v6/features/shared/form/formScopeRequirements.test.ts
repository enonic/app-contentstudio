import { Form, FormItemSet, Input, InputTypeName, Occurrences } from '@enonic/input-types/schema';
import { describe, expect, it } from 'vitest';
import type { Project } from '../../../../app/settings/data/project/Project';
import { hasScopeDisabledInputs } from './formScopeRequirements';

const project = { getName: () => 'layer' } as unknown as Project;

const input = (name: string, type: string): Input =>
    Input.create()
        .setName(name)
        .setInputType(new InputTypeName(type))
        .setLabel(name)
        .setOccurrences(Occurrences.minmax(0, 1))
        .build();

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
