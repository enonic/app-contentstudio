import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementEvent} from '@enonic/lib-admin-ui/dom/ElementEvent';
import {SettingsAppContainer} from 'lib-contentstudio/app/settings/SettingsAppContainer';
import {CONFIG, ConfigObject} from '@enonic/lib-admin-ui/util/Config';
import {ProjectConfigContext} from 'lib-contentstudio/app/settings/data/project/ProjectConfigContext';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

const waitForWidgetElemAttached = (elemId: string): void => {
    const body: Body = Body.get();

    const handler = (event: ElementEvent) => {
        if (event.getElement().getId() === elemId) {
            body.unDescendantAdded();
            appendHtml(event.getElement());
        }
    };

    body.onDescendantAdded(handler);
};

const appendHtml = (widgetElem: Element): void => {
    const c: SettingsAppContainer = new SettingsAppContainer();
    widgetElem.appendChild(c);
};

const init = async (configScriptId: string, elemId: string): Promise<void> => {
    CONFIG.setConfig(JSON.parse(document.getElementById(configScriptId).innerText) as ConfigObject);
    AuthContext.init(Principal.fromJson(CONFIG.get('user') as PrincipalJson),
        (CONFIG.get('principals') as PrincipalJson[]).map(Principal.fromJson));
    await ProjectConfigContext.get().init();

    const body: Body = Body.get();
    const widgetEl: Element = body.findChildById(elemId, true);

    if (widgetEl) {
        appendHtml(widgetEl);
    } else {
        waitForWidgetElemAttached(elemId);
    }
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
