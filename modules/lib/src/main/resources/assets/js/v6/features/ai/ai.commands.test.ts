import { afterEach, describe, expect, it } from 'vitest';
import type { ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { isAiPluginAssigned, updateAiInstructions } from './ai.commands';
import { $aiAssignedPlugins, $aiInstructions } from './ai.store';

function fakeConfig(appKey: string, instructions?: string): ApplicationConfig {
    return {
        getApplicationKey: () => ({ getName: () => appKey }),
        getConfig: () => ({ getString: () => instructions }),
    } as unknown as ApplicationConfig;
}

describe('isAiPluginAssigned', () => {
    it('is true when the plugin app is among the configs', () => {
        const configs = [fakeConfig('com.example.other'), fakeConfig('com.enonic.app.ai.translator')];
        expect(isAiPluginAssigned(configs, 'ai.translator')).toBe(true);
        expect(isAiPluginAssigned(configs, 'ai.contentOperator')).toBe(false);
    });

    it('is false for an empty config list', () => {
        expect(isAiPluginAssigned([], 'ai.translator')).toBe(false);
    });
});

describe('updateAiInstructions', () => {
    afterEach(() => {
        $aiInstructions.set(null);
        $aiAssignedPlugins.setKey('ai.translator', false);
        $aiAssignedPlugins.setKey('ai.contentOperator', false);
    });

    it('marks plugins assigned according to the configs', () => {
        updateAiInstructions([fakeConfig('com.enonic.app.ai.contentoperator', 'be brief')]);

        expect($aiAssignedPlugins.get()).toEqual({ 'ai.translator': false, 'ai.contentOperator': true });
        expect($aiInstructions.get()).toEqual({ translator: undefined, contentOperator: 'be brief' });
    });

    it('clears an assignment when the app is removed from the configs', () => {
        updateAiInstructions([fakeConfig('com.enonic.app.ai.translator')]);
        expect($aiAssignedPlugins.get()['ai.translator']).toBe(true);

        updateAiInstructions([]);
        expect($aiAssignedPlugins.get()['ai.translator']).toBe(false);
    });
});
