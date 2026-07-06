import { Principal } from '@enonic/lib-admin-ui/security/Principal';
import type { PrincipalJson } from '@enonic/lib-admin-ui/security/PrincipalJson';
import { map } from 'nanostores';
import { parseBoolean, parseString } from '../lib/format/values';

type ConfigServices = {
    contentUrl: string;
    stylesUrl: string;
    importContentUrl: string;
    aiContentOperatorWsServiceUrl: string;
    aiTranslatorLicenseServiceUrl: string;
    aiTranslatorWsServiceUrl: string;
};

type ConfigStore = {
    // App
    appId: string;
    appVersion: string;
    adminUrl: string;
    // Session
    user?: Principal;
    // Flags
    excludeDependencies: boolean;
    allowContentUpdate: boolean;
    allowPathTransliteration: boolean;
    enableTextComponent: boolean;
    defaultPublishFromTime?: string;
    requiredPublishFrom: boolean;
    // AI
    aiEnabled: boolean;
    sharedSocketUrl: string;
    // Services
    extensionApiUrl: string;
    services: ConfigServices;
};

type ConfigJson = {
    appId: unknown;
    appVersion: unknown;
    adminUrl?: unknown;
    user: unknown;
    excludeDependencies?: unknown;
    allowContentUpdate?: unknown;
    allowPathTransliteration?: unknown;
    enableTextComponent?: unknown;
    defaultPublishFromTime?: unknown;
    requiredPublishFrom?: unknown;
    aiEnabled?: unknown;
    sharedSocketUrl?: unknown;
    extensionApiUrl?: unknown;
    services?: {
        contentUrl?: unknown;
        stylesUrl?: unknown;
        importContentUrl?: unknown;
        aiContentOperatorWsServiceUrl?: unknown;
        aiTranslatorLicenseServiceUrl?: unknown;
        aiTranslatorWsServiceUrl?: unknown;
    };
};

const DEFAULT_CONFIG: Readonly<ConfigStore> = {
    appId: '',
    appVersion: '',
    adminUrl: '/admin',
    user: undefined,
    excludeDependencies: true,
    allowContentUpdate: false,
    allowPathTransliteration: true,
    enableTextComponent: false,
    defaultPublishFromTime: undefined,
    requiredPublishFrom: false,
    aiEnabled: false,
    sharedSocketUrl: '',
    extensionApiUrl: '',
    services: {
        contentUrl: '',
        stylesUrl: '',
        importContentUrl: '',
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
            appVersion: parseString(config.appVersion),
            adminUrl: parseString(config.adminUrl) || DEFAULT_CONFIG.adminUrl,
            user: config.user ? Principal.fromJson(config.user as PrincipalJson) : undefined,
            excludeDependencies: parseBoolean(config.excludeDependencies),
            allowContentUpdate: parseBoolean(config.allowContentUpdate),
            allowPathTransliteration: parseBoolean(config.allowPathTransliteration),
            enableTextComponent: parseBoolean(config.enableTextComponent),
            defaultPublishFromTime: parseString(config.defaultPublishFromTime),
            requiredPublishFrom: parseBoolean(config.requiredPublishFrom),
            aiEnabled: parseBoolean(config.aiEnabled),
            sharedSocketUrl: parseString(config.sharedSocketUrl),
            extensionApiUrl: parseString(config.extensionApiUrl),
            services: {
                contentUrl: parseString(config.services?.contentUrl),
                stylesUrl: parseString(config.services?.stylesUrl),
                importContentUrl: parseString(config.services?.importContentUrl),
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
