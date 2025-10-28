import {computed, map} from 'nanostores';
import {GetWidgetsByInterfaceRequest} from '../../../app/resource/GetWidgetsByInterfaceRequest';
import {Widget, WidgetConfig} from '@enonic/lib-admin-ui/content/Widget';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UrlAction} from '../../../app/UrlAction';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';

let isLoading = false;
let needsReload = false;

interface WidgetsStore {
    widgets: Widget[];
    activeWidgetId: string | null;
}

export const $sidebarWidgets = map<WidgetsStore>({
    widgets: [],
    activeWidgetId: null,
});

async function loadWidgets(): Promise<void> {
    if (isLoading) {
        needsReload = true;
        return;
    }

    isLoading = true;

    try {
        const request = new GetWidgetsByInterfaceRequest('contentstudio.menuitem');
        const response = await request.sendAndParse();
        const widgets = [createStudioWidget(), ...response];
        const sortedWidgets = sortWidgets(widgets);

        $sidebarWidgets.setKey('widgets', sortedWidgets);
        setInitialActiveWidget();
    } catch (error) {
        console.error(error);
    } finally {
        isLoading = false;
    }

    if (needsReload) {
        needsReload = false;
        return loadWidgets();
    }
}

export function isDefaultWidget(widget: Widget): boolean {
    return (
        widget.getWidgetDescriptorKey().toString() ===
        $sidebarWidgets.get().widgets?.[0].getWidgetDescriptorKey().toString()
    );
}

export function setActiveWidget(widget: Widget): void {
    $sidebarWidgets.setKey('activeWidgetId', widget.getWidgetDescriptorKey().toString());
}

export const $activeWidget = computed($sidebarWidgets, (store) => {
    return store.widgets.find((w) => w?.getWidgetDescriptorKey().toString() === store.activeWidgetId);
});

function setInitialActiveWidget(): void {
    const url = window.location.href;
    const widgets = $sidebarWidgets.get().widgets;

    const widgetMatchingUrl = widgets.find((w) => url.endsWith(`/${w.getWidgetDescriptorKey().getName()}`));

    if (widgetMatchingUrl) {
        setActiveWidget(widgetMatchingUrl);
        return;
    }

    setActiveWidget(widgets?.[0]);
}

function sortWidgets(widgets: Widget[]): Widget[] {
    const MAIN_APP_ENDING: string = 'studio:main';
    const ARCHIVE_APP_ENDING: string = 'plus:archive';
    const SETTINGS_APP_ENDING: string = 'studio:settings';

    const mainWidget = widgets.find((w) => w.getWidgetDescriptorKey().toString().endsWith(MAIN_APP_ENDING));
    const archiveWidget = widgets.find((w) => w.getWidgetDescriptorKey().toString().endsWith(ARCHIVE_APP_ENDING));
    const settingsWidget = widgets.find((w) => w.getWidgetDescriptorKey().toString().endsWith(SETTINGS_APP_ENDING));
    const defaultWidgets = widgets.filter((w) => {
        const widgetKey = w.getWidgetDescriptorKey().toString();
        return [
            widgetKey.endsWith(MAIN_APP_ENDING),
            widgetKey.endsWith(ARCHIVE_APP_ENDING),
            widgetKey.endsWith(SETTINGS_APP_ENDING),
        ].every((widgetStatus) => widgetStatus === false);
    });
    const sortedDefaultWidgets = defaultWidgets.sort((wa, wb) => {
        return wa.getWidgetDescriptorKey().toString().localeCompare(wb.getWidgetDescriptorKey().toString());
    });

    return [mainWidget, archiveWidget, ...sortedDefaultWidgets, settingsWidget].filter(Boolean);
}

function createStudioWidget(): Widget {
    return Widget.create()
        .setWidgetDescriptorKey(`${CONFIG.getString('appId')}:main`)
        .setDisplayName(i18n('app.admin.widget.main'))
        .setUrl(UrlAction.BROWSE)
        .setConfig(new WidgetConfig().setProperty('context', 'project'))
        .build();
}

//
// * Fetching
//
(function () {
    loadWidgets();

    ApplicationEvent.on((event: ApplicationEvent) => {
        const stoppedOrUninstalledEvent =
            ApplicationEventType.STOPPED === event.getEventType() ||
            ApplicationEventType.UNINSTALLED === event.getEventType();

        const startedOrInstalledEvent =
            ApplicationEventType.STARTED === event.getEventType() ||
            ApplicationEventType.INSTALLED === event.getEventType();

        if (startedOrInstalledEvent) {
            loadWidgets();
            setInitialActiveWidget();
        }

        if (stoppedOrUninstalledEvent) {
            const appKey = event.getApplicationKey().toString();
            const currentWidgets = $sidebarWidgets.get().widgets;
            const filteredWidgets = currentWidgets.filter(
                (w) => appKey !== w.getWidgetDescriptorKey().getApplicationKey().toString()
            );

            $sidebarWidgets.setKey('widgets', filteredWidgets);
        }
    });
})();
