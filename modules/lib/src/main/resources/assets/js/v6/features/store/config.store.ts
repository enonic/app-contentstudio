import {map} from 'nanostores';

type ConfigStore = {
    appId: string;
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

    try {
        return JSON.parse(content) as ConfigStore;
    } catch (error) {
        console.error('Unable to parse config script content.', error);
        return;
    }
}
