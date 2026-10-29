import { ApplicationEvent, ApplicationEventType } from '@enonic/lib-admin-ui/application/ApplicationEvent';
import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import type { Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import { FolderInput, History, Link, List, SquareChartGantt } from 'lucide-react';
import { fetchExtensions } from '../../../entities/extension';
import { $isWizard } from '../../../shared/app-state/app.store';
import { $config } from '../../../shared/config/config.store';
import { i18n } from '../../../shared/i18n';
import { getAppName } from '../../../shared/lib/cms/app/app';
import { DEPENDENCIES_WIDGET_NAME, getDependenciesWidgetKey } from '../../../shared/lib/widget/dependencies';
import { DETAILS_WIDGET_NAME, getDetailsWidgetKey } from '../../../shared/lib/widget/details';
import { getImportContentWidgetKey, IMPORT_CONTENT_WIDGET_NAME } from '../../../shared/lib/widget/import-content';
import { getPageEditorWidgetKey, PAGE_EDITOR_WIDGET_NAME } from '../../../shared/lib/widget/pageEditor';
import { getVersionsWidgetKey, VERSIONS_WIDGET_NAME } from '../../../shared/lib/widget/versions/versions';
import type { ContextWidget } from './contextWidget.types';
import { addContextWidget, removeContextWidgetsByApplication, setContextWidgets } from './contextWidgets.store';

const CONTEXT_PANEL_INTERFACE = 'contentstudio.contextpanel';
const RELOAD_DEBOUNCE_MS = 1000;
const RELOAD_EVENT_TYPES = new Set([
    ApplicationEventType.INSTALLED,
    ApplicationEventType.STARTED,
    ApplicationEventType.UPDATED,
]);
const REMOVE_EVENT_TYPES = new Set([ApplicationEventType.UNINSTALLED, ApplicationEventType.STOPPED]);

let isStarted = false;
let reloadTimer: number | undefined;

export const start = (): void => {
    if (isStarted) return;
    isStarted = true;

    setContextWidgets(createDefaultWidgets($isWizard.get()), getDetailsWidgetKey());
    void loadCustomWidgets();
    ApplicationEvent.on(handleApplicationEvent);
};

export const stop = (): void => {
    if (!isStarted) return;
    isStarted = false;

    window.clearTimeout(reloadTimer);
    ApplicationEvent.un(handleApplicationEvent);
    setContextWidgets([]);
};

//
// * Default widgets
//

function createDefaultWidgets(editorMode: boolean): ContextWidget[] {
    const applicationKey = getAppName();

    const details: ContextWidget = {
        key: getDetailsWidgetKey(),
        name: DETAILS_WIDGET_NAME,
        applicationKey,
        title: i18n('field.contextPanel.details'),
        description: i18n('field.contextPanel.details.description'),
        icon: List,
        requiresContent: true,
    };
    const pageEditor: ContextWidget = {
        key: getPageEditorWidgetKey(),
        name: PAGE_EDITOR_WIDGET_NAME,
        applicationKey,
        title: i18n('field.contextPanel.pageEditor'),
        description: i18n('field.contextPanel.pageEditor.description'),
        icon: SquareChartGantt,
        requiresContent: true,
    };
    const versions: ContextWidget = {
        key: getVersionsWidgetKey(),
        name: VERSIONS_WIDGET_NAME,
        applicationKey,
        title: i18n('field.contextPanel.versionHistory'),
        description: i18n('field.contextPanel.versionHistory.description'),
        icon: History,
        requiresContent: true,
    };
    const dependencies: ContextWidget = {
        key: getDependenciesWidgetKey(),
        name: DEPENDENCIES_WIDGET_NAME,
        applicationKey,
        title: i18n('field.contextPanel.dependencies'),
        description: i18n('field.contextPanel.dependencies.description'),
        icon: Link,
        requiresContent: true,
    };
    const importContent: ContextWidget = {
        key: getImportContentWidgetKey(),
        name: IMPORT_CONTENT_WIDGET_NAME,
        applicationKey,
        title: i18n('widget.import.name'),
        description: i18n('widget.import.description'),
        icon: FolderInput,
        requiresContent: false,
    };

    const widgets = editorMode ? [details, pageEditor, versions, dependencies] : [details, versions, dependencies];
    if (AuthHelper.isContentAdmin()) widgets.push(importContent);

    return widgets;
}

//
// * Custom widgets
//

async function loadCustomWidgets(): Promise<void> {
    const result = await fetchExtensions(CONTEXT_PANEL_INTERFACE);
    if (!isStarted) return;

    result.match(
        (extensions) => extensions.forEach((extension) => addContextWidget(toContextWidget(extension))),
        (error) => showError(error.message || i18n('notify.widget.error')),
    );
}

function handleApplicationEvent(event: ApplicationEvent): void {
    const type = event.getEventType();

    if (REMOVE_EVENT_TYPES.has(type)) {
        removeContextWidgetsByApplication(event.getApplicationKey().toString());
        return;
    }

    if (!RELOAD_EVENT_TYPES.has(type)) return;

    window.clearTimeout(reloadTimer);
    reloadTimer = window.setTimeout(() => void loadCustomWidgets(), RELOAD_DEBOUNCE_MS);
}

function toContextWidget(extension: Extension): ContextWidget {
    const descriptorKey = extension.getDescriptorKey();
    const baseUrl = $config.get().extensionApiUrl.replace(/\/+$/, '');
    const url = extension.getUrl();
    const iconUrl = extension.getIconUrl();

    return {
        key: descriptorKey.toString(),
        name: descriptorKey.getName(),
        applicationKey: descriptorKey.getApplicationKey().toString(),
        title: extension.getTitle(),
        description: extension.getDescription() || i18n('field.contextPanel.noDescription'),
        iconUrl: iconUrl ? `${baseUrl}${iconUrl}` : undefined,
        url: url ? `${baseUrl}/${url}` : undefined,
        renderOnResize: extension.getConfig()?.getProperty('render-on-resize') === 'true',
        requiresContent: !url,
    };
}
