import {map} from 'nanostores';
import {parseBoolean, parseString} from '../utils/format/values';

type ConfigStore = {
    appId: string;
    excludeDependencies: boolean;
    allowContentUpdate: boolean;
    defaultPublishFromTime?: string;
};

type ConfigJson = {
    appId: unknown;
    excludeDependencies?: unknown;
    allowContentUpdate?: unknown;
    defaultPublishFromTime?: unknown;
};

export const $config = map<ConfigStore>(loadConfig());

//
// * Utilities
//

function loadConfig(): ConfigStore | undefined {
    const {currentScript} = document;
    if (!currentScript) {
        console.error('"currentScript" not supported. You either using legacy browser or ES modules.');
        return;
    }

    const configScriptId = currentScript.getAttribute('data-config-script-id');
    if (!configScriptId) {
        console.error('Unable to locate config script id. Make sure to add "data-config-script-id" attribute to the script tag.');
        return;
    }

    const scriptElement = document.getElementById(configScriptId);

    if (!scriptElement) {
        console.error('Unable to locate config script element.');
        return;
    }

    const content = scriptElement.innerText;

    return parseConfig(content);
}

function parseConfig(content: string): ConfigStore | undefined {
    try {
        const config = JSON.parse(content) as ConfigJson;

        return {
            appId: parseString(config.appId),
            excludeDependencies: parseBoolean(config.excludeDependencies),
            allowContentUpdate: parseBoolean(config.allowContentUpdate),
            defaultPublishFromTime: parseString(config.defaultPublishFromTime),
        } satisfies ConfigStore;
    } catch (error) {
        console.error('Unable to parse config script content.', error);
        return;
    }
}
