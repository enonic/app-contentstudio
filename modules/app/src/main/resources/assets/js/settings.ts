import {Body} from 'lib-admin-ui/dom/Body';
import {Element} from 'lib-admin-ui/dom/Element';
import {ElementEvent} from 'lib-admin-ui/dom/ElementEvent';
import {SettingsAppContainer} from 'lib-contentstudio/app/settings/SettingsAppContainer';
import {CONFIG} from 'lib-admin-ui/util/Config';

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
    c.show();

    widgetElem.onShown(() => {
        c.show(); // need to toggle key bindings
    });

    widgetElem.onHidden(() => {
        c.hide(); // need to toggle key bindings
    });
};

const init = async (configUri: string, elemId: string): Promise<void> => {
    await CONFIG.init(configUri);

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
        throw 'Legacy browsers are not supported';
    }

    const configUri: string = currentScript.getAttribute('configServiceUrl');
    const elemId: string = currentScript.getAttribute('elemId');

    if (!configUri || !elemId) {
        throw 'Missing attributes on inject script';
    }

    await init(configUri, elemId);
})(document.currentScript);
