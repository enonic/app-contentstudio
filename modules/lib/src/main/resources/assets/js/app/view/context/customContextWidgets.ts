import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import type Q from 'q';
import {GetExtensionsByInterfaceRequest} from '../../resource/GetExtensionsByInterfaceRequest';
import {type ContextView} from './ContextView';
import {ExtensionView} from './ExtensionView';

const CONTEXT_PANEL_INTERFACE = 'contentstudio.contextpanel';

const EXTENSION_EVENT_TYPES: ApplicationEventType[] = [
    ApplicationEventType.INSTALLED,
    ApplicationEventType.UNINSTALLED,
    ApplicationEventType.STARTED,
    ApplicationEventType.STOPPED,
    ApplicationEventType.UPDATED,
];

export function loadCustomContextWidgets(contextView: ContextView): Q.Promise<void> {
    return fetchCustomExtensions().then((extensions: Extension[]) => {
        extensions.forEach(extension => {
            contextView.addWidget(buildExtensionView(contextView, extension));
        });
    }).catch(reason => {
        showError(reason?.message || i18n('notify.widget.error'));
    });
}

export function watchCustomContextWidgets(contextView: ContextView): void {
    const debouncedHandlersByKey: Record<string, (key: string, type: ApplicationEventType) => void> = {};

    const handler = (event: ApplicationEvent) => {
        const type = event.getEventType();
        if (!EXTENSION_EVENT_TYPES.includes(type)) return;

        const key = event.getApplicationKey().getName();

        debouncedHandlersByKey[key] ??= AppHelper.debounce(
            (k: string, t: ApplicationEventType) => handleExtensionUpdate(contextView, k, t),
            1000,
        );
        debouncedHandlersByKey[key](key, type);
    };

    ApplicationEvent.on(handler);
    contextView.onRemoved(() => ApplicationEvent.un(handler));
}

function handleExtensionUpdate(contextView: ContextView, key: string, type: ApplicationEventType): void {
    if (isRemoveEvent(type)) {
        removeWidgetsByApplicationKey(contextView, key);
        return;
    }

    void fetchExtensionByApplicationKey(key).then(extension => {
        if (!extension) return;

        const view = buildExtensionView(contextView, extension);
        const extensionKey = extension.getDescriptorKey().toString();

        if (contextView.getWidgetByKey(extensionKey)) {
            contextView.replaceWidgetByKey(extensionKey, view);
        } else {
            contextView.addWidget(view);
        }
    });
}

function isRemoveEvent(type: ApplicationEventType): boolean {
    return type === ApplicationEventType.UNINSTALLED || type === ApplicationEventType.STOPPED;
}

function removeWidgetsByApplicationKey(contextView: ContextView, applicationKey: string): void {
    contextView.getWidgets()
        .filter(widget => widget.getExtensionKey()?.startsWith(`${applicationKey}:`))
        .forEach(widget => contextView.removeWidgetByKey(widget.getExtensionKey()));
}

function buildExtensionView(contextView: ContextView, extension: Extension): ExtensionView {
    return ExtensionView.create()
        .setName(extension.getDisplayName())
        .setContextView(contextView)
        .setExtension(extension)
        .build();
}

function fetchCustomExtensions(): Q.Promise<Extension[]> {
    return new GetExtensionsByInterfaceRequest(CONTEXT_PANEL_INTERFACE).sendAndParse();
}

function fetchExtensionByApplicationKey(applicationKey: string): Q.Promise<Extension | null> {
    return fetchCustomExtensions().then((extensions: Extension[]) => {
        return extensions.find(ext => ext.getDescriptorKey().getApplicationKey().getName() === applicationKey) ?? null;
    }).catch(reason => {
        showError(reason?.message || i18n('notify.widget.error'));
        return null;
    });
}
