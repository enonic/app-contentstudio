import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import type {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';
import {map} from 'nanostores';
import {parseBoolean, parseString} from '../utils/format/values';

type ConfigAiServices = {
    aiContentOperatorWsServiceUrl: string;
    aiTranslatorLicenseServiceUrl: string;
    aiTranslatorWsServiceUrl: string;
};

type ConfigStore = {
    // App
    appId: string;
    // Session
    user?: Principal;
    // Flags
    excludeDependencies: boolean;
    allowContentUpdate: boolean;
    defaultPublishFromTime?: string;
    // AI
    aiEnabled: boolean;
    sharedSocketUrl: string;
    services: ConfigAiServices;
};

type ConfigJson = {
    appId: unknown;
    user: unknown;
    excludeDependencies?: unknown;
    allowContentUpdate?: unknown;
    defaultPublishFromTime?: unknown;
    aiEnabled?: unknown;
    sharedSocketUrl?: unknown;
    services?: {
        aiContentOperatorWsServiceUrl?: unknown;
        aiTranslatorLicenseServiceUrl?: unknown;
        aiTranslatorWsServiceUrl?: unknown;
    };
};

const DEFAULT_CONFIG: Readonly<ConfigStore> = {
    appId: '',
    user: undefined,
    excludeDependencies: false,
    allowContentUpdate: false,
    defaultPublishFromTime: undefined,
    aiEnabled: false,
    sharedSocketUrl: '',
    services: {
        aiContentOperatorWsServiceUrl: '',
        aiTranslatorLicenseServiceUrl: '',
        aiTranslatorWsServiceUrl: '',
    },
};

export const $config = map<ConfigStore>(structuredClone(DEFAULT_CONFIG));

export function initConfig(scriptId: string): void {
    const scriptElement = document.getElementById(scriptId);
    if (!scriptElement) {
        console.error(`Unable to locate config script #${scriptId}.`);
        return;
    }

    const config = parseConfig(scriptElement.textContent ?? '');
    if (config) {
        $config.set(config);
    }
}

//
// * Utilities
//

function parseConfig(content: string): ConfigStore | undefined {
    try {
        const config = JSON.parse(content) as ConfigJson;

        return {
            appId: parseString(config.appId),
            user: config.user ? Principal.fromJson(config.user as PrincipalJson) : undefined,
            excludeDependencies: parseBoolean(config.excludeDependencies),
            allowContentUpdate: parseBoolean(config.allowContentUpdate),
            defaultPublishFromTime: parseString(config.defaultPublishFromTime),
            aiEnabled: parseBoolean(config.aiEnabled),
            sharedSocketUrl: parseString(config.sharedSocketUrl),
            services: {
                aiContentOperatorWsServiceUrl: parseString(config.services?.aiContentOperatorWsServiceUrl),
                aiTranslatorLicenseServiceUrl: parseString(config.services?.aiTranslatorLicenseServiceUrl),
                aiTranslatorWsServiceUrl: parseString(config.services?.aiTranslatorWsServiceUrl),
            },
        } satisfies ConfigStore;
    } catch (error) {
        console.error('Unable to parse config script content.', error);
        return;
    }
}
