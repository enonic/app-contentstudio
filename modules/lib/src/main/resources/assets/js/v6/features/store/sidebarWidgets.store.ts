import {computed, map} from 'nanostores';
import {GetWidgetsByInterfaceRequest} from '../../../app/resource/GetWidgetsByInterfaceRequest';
import {Widget, WidgetConfig} from '@enonic/lib-admin-ui/content/Widget';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UrlAction} from '../../../app/UrlAction';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';

type WidgetsStore = {
    widgets: Readonly<Widget>[];
    activeWidgetId: string | undefined;
};

export const $sidebarWidgets = map<WidgetsStore>({
    widgets: [],
    activeWidgetId: undefined,
});

export function setActiveWidget(widget: Readonly<Widget> | undefined): void {
    $sidebarWidgets.setKey('activeWidgetId', getWidgetKey(widget));
}

export const $activeWidget = computed($sidebarWidgets, (store) => {
    return store.widgets.find((w) => getWidgetKey(w) === store.activeWidgetId);
});

//
// * Utilities
//

export function getWidgetKey(widget: Readonly<Widget> | undefined): string | undefined {
    return widget?.getWidgetDescriptorKey().toString();
}

export function isDefaultWidget(widget: Readonly<Widget>): boolean {
    const {widgets} = $sidebarWidgets.get();
    const firstWidget = widgets[0];
    return firstWidget != null && getWidgetKey(firstWidget) === getWidgetKey(widget);
}

export function isMainWidget(widget: Readonly<Widget>): boolean {
    return getWidgetKey(widget)?.endsWith('studio:main') ?? false;
}

// Internal

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
        const request = new GetWidgetsByInterfaceRequest(WIDGET_INTERFACE);
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
    const url = window.location.href;
    const {widgets} = $sidebarWidgets.get();

    const {activeWidgetId} = $sidebarWidgets.get();
    const hasActiveWidget = widgets.some((w) => getWidgetKey(w) === activeWidgetId);

    if (hasActiveWidget) {
        return;
    }

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

function sortWidgets(widgets: Readonly<Widget>[]): Readonly<Widget>[] {
    const MAIN_APP_ENDING: string = 'studio:main';
    const ARCHIVE_APP_ENDING: string = 'plus:archive';
    const SETTINGS_APP_ENDING: string = 'studio:settings';

    const mainWidget = widgets.find((w) => w.getWidgetDescriptorKey().toString().endsWith(MAIN_APP_ENDING));
    const archiveWidget = widgets.find((w) => w.getWidgetDescriptorKey().toString().endsWith(ARCHIVE_APP_ENDING));
    const settingsWidget = widgets.find((w) => w.getWidgetDescriptorKey().toString().endsWith(SETTINGS_APP_ENDING));
    const defaultWidgets = widgets.filter((w) => {
        const widgetKey = getWidgetKey(w);
        return !widgetKey.endsWith(MAIN_APP_ENDING) &&
            !widgetKey.endsWith(ARCHIVE_APP_ENDING) &&
            !widgetKey.endsWith(SETTINGS_APP_ENDING);
    });
    const sortedDefaultWidgets = defaultWidgets.sort((wa, wb) => {
        return wa.getWidgetDescriptorKey().toString().localeCompare(wb.getWidgetDescriptorKey().toString());
    });

    return [mainWidget, archiveWidget, ...sortedDefaultWidgets, settingsWidget].filter(Boolean);
}

function createStudioWidget(): Readonly<Widget> {
    return Widget.create()
        .setWidgetDescriptorKey(`${CONFIG.getString('appId')}:main`)
        .setDisplayName(i18n('app.admin.widget.main'))
        .setUrl(UrlAction.BROWSE)
        .setConfig(new WidgetConfig().setProperty('context', 'project'))
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
        const filteredWidgets = widgets.filter(w => getWidgetKey(w) !== appKey);

        $sidebarWidgets.setKey('widgets', filteredWidgets);
    }
});
