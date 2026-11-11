import type { Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { Router } from '../../../../app/Router';
import { UrlAction } from '../../../../app/UrlAction';
import { $noProjectMode } from '../../../entities/project/projects.store';
import { i18n } from '../../../shared/i18n';
import {
    $activeWidget,
    $sidebarWidgets,
    getSettingsWidget,
    isContentBrowseWidget,
    isSettingsWidget,
    setActiveWidget,
} from './sidebarWidgets.store';

//
// * Sidebar Widgets Service
//
// Keeps the URL hash and the document title in step with the active sidebar
// widget, and pins the settings widget while there is no project to browse.
// Started by the browse app only: the wizard has no sidebar.
//

let unsubscribers: (() => void)[] = [];

const updateUrl = (widget: Readonly<Extension>): void => {
    if (isContentBrowseWidget(widget)) {
        Router.get().setHash(UrlAction.BROWSE);
        return;
    }

    const key = widget.getDescriptorKey();
    const appName = key.getApplicationKey().getName().split('.').pop();
    Router.get().setHash(`widget/${appName}/${key.getName()}`);
};

const updateTitle = (widget: Readonly<Extension>): void => {
    const prefix = i18n('admin.tool.displayName');
    const postfix =
        isContentBrowseWidget(widget) || !widget.getDisplayName()
            ? i18n('app.admin.tool.title')
            : widget.getDisplayName();

    document.title = `${prefix} - ${postfix}`;
};

const pinSettingsWidget = (): void => {
    if (!$noProjectMode.get()) return;

    const settingsWidget = getSettingsWidget();
    if (settingsWidget && !isSettingsWidget($activeWidget.get())) {
        setActiveWidget(settingsWidget);
    }
};

export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        $activeWidget.subscribe((widget) => {
            const noProjectMode = $noProjectMode.get();

            if (widget == null || (noProjectMode && !isSettingsWidget(widget))) {
                pinSettingsWidget();
                return;
            }

            if (!noProjectMode) {
                updateUrl(widget);
            }
            updateTitle(widget);
        }),
        $sidebarWidgets.subscribe(pinSettingsWidget),
        $noProjectMode.subscribe((enabled, wasEnabled) => {
            if (enabled) {
                pinSettingsWidget();
                return;
            }

            // The hash was frozen while there was no project; catch it up.
            if (wasEnabled) {
                const widget = $activeWidget.get();
                if (widget) updateUrl(widget);
            }
        }),
    ];
};

export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};

export const isRunning = (): boolean => unsubscribers.length > 0;
