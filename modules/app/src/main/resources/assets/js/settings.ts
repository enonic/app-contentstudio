import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { Principal } from '@enonic/lib-admin-ui/security/Principal';
import { PrincipalJson } from '@enonic/lib-admin-ui/security/PrincipalJson';
import { CONFIG, ConfigObject } from '@enonic/lib-admin-ui/util/Config';
import { ProjectConfigContext } from '@enonic/lib-contentstudio/app/settings/data/project/ProjectConfigContext';
import { mountSettingsApp } from '@enonic/lib-contentstudio/v6/app/settingsApp';
import { initLanguages } from '@enonic/lib-contentstudio/v6/entities/language/languages.store';
import { initPrincipals } from '@enonic/lib-contentstudio/v6/entities/principal/principals.store';
import { initProjects } from '@enonic/lib-contentstudio/v6/entities/project/projects.store';
import { initConfig } from '@enonic/lib-contentstudio/v6/shared/config/config.store';
import { setPhrases } from '@enonic/lib-contentstudio/v6/shared/i18n';
import type { Phrases } from '@enonic/ui-utils';

// The widget script may run before the widget element is attached to the page.
const whenHostAttached = (elemId: string, callback: (host: HTMLElement) => void): void => {
    const host = document.getElementById(elemId);
    if (host) {
        callback(host);
        return;
    }

    const observer = new MutationObserver(() => {
        const attached = document.getElementById(elemId);
        if (!attached) return;

        observer.disconnect();
        callback(attached);
    });

    observer.observe(document.body, { childList: true, subtree: true });
};

const init = async (configScriptId: string, elemId: string): Promise<void> => {
    CONFIG.setConfig(JSON.parse(document.getElementById(configScriptId).innerText) as ConfigObject);
    initConfig(configScriptId);
    const phrases: Phrases = JSON.parse(CONFIG.getString('phrasesAsJson'));
    setPhrases(phrases);
    initProjects();
    void initLanguages();
    initPrincipals();
    AuthContext.init(
        Principal.fromJson(CONFIG.get('user') as PrincipalJson),
        (CONFIG.get('principals') as PrincipalJson[]).map(Principal.fromJson),
    );
    await ProjectConfigContext.get().init();

    whenHostAttached(elemId, mountSettingsApp);
};

(() => {
    if (!document.currentScript) {
        throw Error('Legacy browsers are not supported');
    }

    const configScriptId = document.currentScript.getAttribute('data-config-script-id');
    const elemId: string = document.currentScript.getAttribute('data-widget-id');

    if (!configScriptId || !elemId) {
        throw Error('Missing attributes on inject script');
    }

    init(configScriptId, elemId).catch(DefaultErrorHandler.handle);
})();
