import { afterEach, describe, expect, it } from 'vitest';
import type { ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { resolveAiPluginConfig, updateAiAppConfigs } from './ai.commands';
import { $aiAssignedPlugins, $aiInstructions } from './ai.store';

const OPERATOR = 'com.enonic.app.ai.contentoperator';
const TRANSLATOR = 'com.enonic.app.ai.translator';

function fakeConfig(appKey: string, instructions?: string): ApplicationConfig {
    return {
        getApplicationKey: () => ({ getName: () => appKey }),
        getConfig: () => ({ getString: () => instructions }),
    } as unknown as ApplicationConfig;
}

describe('resolveAiPluginConfig', () => {
    it('prefers the site config when the app is added to the site', () => {
        const site = fakeConfig(OPERATOR, 'site');
        const project = fakeConfig(OPERATOR, 'project');
        expect(resolveAiPluginConfig([site], [project], 'ai.contentOperator')).toBe(site);
    });

    it('uses the project config when the app is not added to the site', () => {
        const project = fakeConfig(OPERATOR, 'project');
        expect(resolveAiPluginConfig([fakeConfig('com.example.other')], [project], 'ai.contentOperator')).toBe(project);
    });

    it('uses the project config for content outside any site', () => {
        const project = fakeConfig(TRANSLATOR);
        expect(resolveAiPluginConfig(undefined, [project], 'ai.translator')).toBe(project);
    });

    it('is undefined when neither the site nor the project has the app', () => {
        expect(
            resolveAiPluginConfig([fakeConfig(TRANSLATOR)], [fakeConfig(TRANSLATOR)], 'ai.contentOperator'),
        ).toBeUndefined();
        expect(resolveAiPluginConfig(undefined, [], 'ai.translator')).toBeUndefined();
    });
});

describe('updateAiAppConfigs', () => {
    afterEach(() => {
        $aiInstructions.set(null);
        $aiAssignedPlugins.setKey('ai.translator', false);
        $aiAssignedPlugins.setKey('ai.contentOperator', false);
    });

    it('leaves an installed app unassigned until it is added to a site or project', () => {
        updateAiAppConfigs(undefined, []);

        expect($aiAssignedPlugins.get()).toEqual({ 'ai.translator': false, 'ai.contentOperator': false });
        expect($aiInstructions.get()).toEqual({ translator: undefined, contentOperator: undefined });
    });

    it('assigns a project-level app to content inside a site that lacks it', () => {
        updateAiAppConfigs([fakeConfig('com.example.other')], [fakeConfig(OPERATOR, 'from project')]);

        expect($aiAssignedPlugins.get()['ai.contentOperator']).toBe(true);
        expect($aiInstructions.get()?.contentOperator).toBe('from project');
    });

    it('assigns a project-level app to content outside any site', () => {
        updateAiAppConfigs(undefined, [fakeConfig(TRANSLATOR, 'from project')]);

        expect($aiAssignedPlugins.get()['ai.translator']).toBe(true);
        expect($aiInstructions.get()?.translator).toBe('from project');
    });

    it('assigns a site-level app only through that site', () => {
        updateAiAppConfigs([fakeConfig(TRANSLATOR, 'from site')], []);
        expect($aiAssignedPlugins.get()['ai.translator']).toBe(true);
        expect($aiInstructions.get()?.translator).toBe('from site');

        updateAiAppConfigs(undefined, []);
        expect($aiAssignedPlugins.get()['ai.translator']).toBe(false);
        expect($aiInstructions.get()?.translator).toBeUndefined();
    });

    it('reads instructions from the site and ignores the project when the site has the app', () => {
        updateAiAppConfigs([fakeConfig(OPERATOR, '')], [fakeConfig(OPERATOR, 'from project')]);

        expect($aiInstructions.get()?.contentOperator).toBe('');
    });

    it('reads instructions from the project when the site lacks the app', () => {
        updateAiAppConfigs([fakeConfig(TRANSLATOR, 'site translator')], [fakeConfig(OPERATOR, 'from project')]);

        expect($aiInstructions.get()).toEqual({ translator: 'site translator', contentOperator: 'from project' });
    });

    it('clears instructions when the app is removed', () => {
        updateAiAppConfigs([fakeConfig(OPERATOR, 'from site')], []);
        updateAiAppConfigs([], []);

        expect($aiAssignedPlugins.get()['ai.contentOperator']).toBe(false);
        expect($aiInstructions.get()?.contentOperator).toBeUndefined();
    });

    it('treats both plugins the same way', () => {
        updateAiAppConfigs([fakeConfig(OPERATOR, 'op site'), fakeConfig(TRANSLATOR, 'tr site')], []);

        expect($aiAssignedPlugins.get()).toEqual({ 'ai.translator': true, 'ai.contentOperator': true });
        expect($aiInstructions.get()).toEqual({ translator: 'tr site', contentOperator: 'op site' });
    });
});
