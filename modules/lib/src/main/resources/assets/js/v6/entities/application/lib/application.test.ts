import { Application as LegacyApplication } from '@enonic/lib-admin-ui/application/Application';
import { type ApplicationJson as LegacyApplicationJson } from '@enonic/lib-admin-ui/application/json/ApplicationJson';
import { describe, expect, it } from 'vitest';
import { type ApplicationJson, parseApplication } from './application';

const json = {
    key: 'com.enonic.app.demo',
    displayName: 'Demo',
    description: 'Demo app',
    state: 'stopped',
    iconUrl: '/icon/demo',
    config: [
        {
            Input: {
                name: 'title',
                inputType: 'TextLine',
                label: 'Title',
                occurrences: { minimum: 0, maximum: 1 },
            },
        },
    ],
} as unknown as ApplicationJson;

describe('parseApplication', () => {
    it('should read the same values the legacy class returns', () => {
        const application = parseApplication(json);
        const legacy = LegacyApplication.fromJson(json as unknown as LegacyApplicationJson);

        expect(application.key).toBe(legacy.getApplicationKey().toString());
        expect(application.displayName).toBe(legacy.getDisplayName());
        expect(application.description).toBe(legacy.getDescription());
        expect(application.state).toBe(legacy.getState());
        expect(application.state === 'stopped').toBe(legacy.isStopped());
        expect(application.iconUrl).toBe(legacy.getIconUrl());
        expect(application.form?.toJson()).toEqual(legacy.getForm().toJson());
    });

    it('should leave the form undefined when the application has no config', () => {
        expect(parseApplication({ ...json, config: undefined }).form).toBeUndefined();
    });
});
