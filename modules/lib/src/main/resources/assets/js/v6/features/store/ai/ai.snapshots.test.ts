import {describe, expect, it, beforeEach} from 'vitest';
import {$config} from '../config.store';
import {$aiInstructions} from './ai.store';
import {buildPluginConfig} from './ai.snapshots';

describe('buildPluginConfig', () => {
    beforeEach(() => {
        $config.set({
            appId: '',
            user: undefined,
            excludeDependencies: false,
            allowContentUpdate: false,
            defaultPublishFromTime: undefined,
            aiEnabled: true,
            sharedSocketUrl: 'wss://shared',
            services: {
                aiContentOperatorWsServiceUrl: 'wss://operator',
                aiTranslatorLicenseServiceUrl: 'https://license',
                aiTranslatorWsServiceUrl: 'wss://translator',
            },
        });
        $aiInstructions.set({translator: 'translate well', contentOperator: undefined});
    });

    it('builds the translator config from CS config and instructions', () => {
        expect(buildPluginConfig('ai.translator')).toEqual({
            wsServiceUrl: 'wss://translator',
            licenseServiceUrl: 'https://license',
            sharedSocketUrl: 'wss://shared',
            instructions: 'translate well',
        });
    });

    it('falls back to an empty instructions string when none are set', () => {
        $aiInstructions.set(null);
        expect(buildPluginConfig('ai.translator').instructions).toBe('');
    });
});
