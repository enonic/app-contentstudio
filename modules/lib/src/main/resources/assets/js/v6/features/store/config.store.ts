import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import type {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';
import {map} from 'nanostores';
import {parseBoolean, parseString} from '../utils/format/values';

type ConfigStore = {
    // App
    appId: string;
    // Session
    user?: Principal;
    // Flags
    excludeDependencies: boolean;
    allowContentUpdate: boolean;
    defaultPublishFromTime?: string;
};

type ConfigJson = {
    appId: unknown;
    user: unknown;
    excludeDependencies?: unknown;
    allowContentUpdate?: unknown;
    defaultPublishFromTime?: unknown;
};

export const $config = map<ConfigStore>();

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
        } satisfies ConfigStore;
    } catch (error) {
        console.error('Unable to parse config script content.', error);
        return;
    }
}
