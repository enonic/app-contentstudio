import type { FormJson } from '@enonic/ui-types';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentType } from '../../../app/inputtype/schema/ContentType';
import type { ContentTypeJson } from '../../../app/resource/json/ContentTypeJson';
import { createContentSchema } from './ai.commands';
import { $aiContentType, $aiWizardBridge } from './ai.store';

const form: FormJson = [
    {
        formItemType: 'Input',
        name: 'title',
        label: 'Title',
        inputType: 'TextLine',
        occurrences: { minimum: 1, maximum: 1 },
    },
    {
        formItemType: 'ItemSet',
        name: 'address',
        label: 'Address',
        occurrences: { minimum: 0, maximum: 1 },
        items: [
            {
                formItemType: 'Input',
                name: 'city',
                label: 'City',
                inputType: 'TextLine',
                occurrences: { minimum: 0, maximum: 1 },
            },
        ],
    },
];

describe('createContentSchema', () => {
    afterEach(() => {
        $aiContentType.set(null);
        $aiWizardBridge.set(null);
    });

    it('sends the form as XP serializes it, an array of items typed by formItemType', () => {
        $aiContentType.set(
            ContentType.fromJson({
                name: 'com.enonic.app.test:article',
                title: 'Article',
                displayName: 'Article',
                form,
            } as unknown as ContentTypeJson),
        );

        const schema = createContentSchema();

        expect(schema?.name).toBe('Article');
        expect(Array.isArray(schema?.form)).toBe(true);
        expect(schema?.form).toMatchObject([
            { formItemType: 'Input', name: 'title', inputType: 'TextLine' },
            { formItemType: 'ItemSet', name: 'address', items: [{ formItemType: 'Input', name: 'city' }] },
        ]);
        expect(schema).not.toHaveProperty('form.formItems');
    });
});
