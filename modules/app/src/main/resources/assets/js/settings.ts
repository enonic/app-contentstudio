import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementEvent} from '@enonic/lib-admin-ui/dom/ElementEvent';
import {SettingsAppContainer} from 'lib-contentstudio/app/settings/SettingsAppContainer';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {ProjectConfigContext} from 'lib-contentstudio/app/settings/data/project/ProjectConfigContext';
import * as Q from 'q';

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

const init = async (configUri: string, elemId: string): Promise<void> => {
    await CONFIG.init(configUri);
    await ProjectConfigContext.get().init();

    const body: Body = Body.get();
    const widgetEl: Element = body.findChildById(elemId, true);

    if (widgetEl) {
        appendHtml(widgetEl);
    } else {
        waitForWidgetElemAttached(elemId);
    }
};

void (async (currentScript: HTMLOrSVGScriptElement) => {
    if (!currentScript) {
        throw Error('Legacy browsers are not supported');
    }

    const configUri: string = currentScript.getAttribute('data-config-service-url');
    const elemId: string = currentScript.getAttribute('data-widget-id');

    if (!configUri || !elemId) {
        throw Error('Missing attributes on inject script');
    }

    await init(configUri, elemId);
})(document.currentScript);
