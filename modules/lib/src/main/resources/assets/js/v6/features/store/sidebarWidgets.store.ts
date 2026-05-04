import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {Extension, ExtensionConfig} from '@enonic/lib-admin-ui/extension/Extension';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {GetExtensionsByInterfaceRequest} from '../../../app/resource/GetExtensionsByInterfaceRequest';
import {UrlAction} from '../../../app/UrlAction';
import {$noProjectMode} from './projects.store';

type WidgetsStore = {
    widgets: Readonly<Extension>[];
    activeWidgetId: string | undefined;
};

export const $sidebarWidgets = map<WidgetsStore>({
    widgets: [],
    activeWidgetId: undefined,
});

export const $activeWidget = computed($sidebarWidgets, (store) => {
    return store.widgets.find((w) => getWidgetKey(w) === store.activeWidgetId);
});

export function setActiveWidget(widget: Readonly<Extension> | undefined): void {
    const existsInStore = $sidebarWidgets.get().widgets.some((p) => getWidgetKey(p) === getWidgetKey(widget));
    if (!existsInStore) return;
    $sidebarWidgets.setKey('activeWidgetId', getWidgetKey(widget));
}

//
// * Utilities
//

export function getWidgetKey(widget: Readonly<Extension> | undefined): string | undefined {
    return widget?.getDescriptorKey().toString();
}

export function isDefaultWidget(widget: Readonly<Extension>): boolean {
    const {widgets} = $sidebarWidgets.get();
    const firstWidget = widgets[0];
    return firstWidget != null && getWidgetKey(firstWidget) === getWidgetKey(widget);
}

export function isMainWidget(widget: Readonly<Extension> | undefined): boolean {
    return getWidgetKey(widget)?.endsWith('studio:main') ?? false;
}

export function isSettingsWidget(widget: Readonly<Extension> | undefined): boolean {
    return getWidgetKey(widget)?.endsWith('studio:settings') ?? false;
}

export function getSettingsWidget(widgets: Readonly<Extension>[] = $sidebarWidgets.get().widgets): Readonly<Extension> | undefined {
    return widgets.find((widget) => isSettingsWidget(widget));
}

//
// * Internal
//

const WIDGET_INTERFACE = 'contentstudio.menuitem';
let isLoading = false;
let needsReload = false;

async function loadWidgets(): Promise<void> {
    if (isLoading) {
        needsReload = true;
        return;
    }

    isLoading = true;

    try {
        const request = new GetExtensionsByInterfaceRequest(WIDGET_INTERFACE);
        const response = await request.sendAndParse();
        const widgets = [createStudioWidget(), ...response];

        $sidebarWidgets.setKey('widgets', sortWidgets(widgets));

        updateActiveWidget();
    } catch (error) {
        console.error(error);
    } finally {
        isLoading = false;
    }

    if (needsReload) {
        needsReload = false;
        await loadWidgets();
    }
}

function updateActiveWidget(): void {
    if ($activeWidget.get()) return;

    const {widgets} = $sidebarWidgets.get();

    if ($noProjectMode.get()) {
        setActiveWidget(getSettingsWidget(widgets));
        return;
    }

    const url = window.location.href;

    const widgetMatchingUrl = widgets.find((w) => {
        const widgetKey = getWidgetKey(w);
        const widgetName = widgetKey?.split(':').pop();
        return widgetName && url.endsWith(`/${widgetName}`);
    });

    if (widgetMatchingUrl) {
        setActiveWidget(widgetMatchingUrl);
        return;
    }

    setActiveWidget(widgets[0]);
}

function sortWidgets(widgets: Readonly<Extension>[]): Readonly<Extension>[] {
    const MAIN_APP_ENDING: string = 'studio:main';
    const ARCHIVE_APP_ENDING: string = 'plus:archive';
    const SETTINGS_APP_ENDING: string = 'studio:settings';

    const mainWidget = widgets.find((w) => w.getDescriptorKey().toString().endsWith(MAIN_APP_ENDING));
    const archiveWidget = widgets.find((w) => w.getDescriptorKey().toString().endsWith(ARCHIVE_APP_ENDING));
    const settingsWidget = widgets.find((w) => w.getDescriptorKey().toString().endsWith(SETTINGS_APP_ENDING));
    const defaultWidgets = widgets.filter((w) => {
        const widgetKey = getWidgetKey(w);
        return (
            !widgetKey.endsWith(MAIN_APP_ENDING) &&
            !widgetKey.endsWith(ARCHIVE_APP_ENDING) &&
            !widgetKey.endsWith(SETTINGS_APP_ENDING)
        );
    });
    const sortedDefaultWidgets = defaultWidgets.sort((wa, wb) => {
        return wa.getDescriptorKey().toString().localeCompare(wb.getDescriptorKey().toString());
    });

    return [mainWidget, archiveWidget, ...sortedDefaultWidgets, settingsWidget].filter(Boolean);
}

function createStudioWidget(): Readonly<Extension> {
    return Extension.create()
        .setExtensionDescriptorKey(`${CONFIG.getString('appId')}:main`)
        .setDisplayName(i18n('app.admin.widget.main'))
        .setUrl(UrlAction.BROWSE)
        .setConfig(new ExtensionConfig().setProperty('context', 'project'))
        .build();
}

//
// * Initialization
//

void loadWidgets();

ApplicationEvent.on((event: ApplicationEvent) => {
    const stoppedOrUninstalledEvent =
        ApplicationEventType.STOPPED === event.getEventType() ||
        ApplicationEventType.UNINSTALLED === event.getEventType();

    const startedOrInstalledEvent =
        ApplicationEventType.STARTED === event.getEventType() ||
        ApplicationEventType.INSTALLED === event.getEventType();

    if (startedOrInstalledEvent) {
        loadWidgets();
    } else if (stoppedOrUninstalledEvent) {
        const {widgets} = $sidebarWidgets.get();
        const appKey = String(event.getApplicationKey());
        const filteredWidgets = widgets.filter((w) => getWidgetKey(w) !== appKey);

        $sidebarWidgets.setKey('widgets', filteredWidgets);
    }
});
