import {computed, map} from 'nanostores';
import {GetWidgetsByInterfaceRequest} from '../../../app/resource/GetWidgetsByInterfaceRequest';
import {Widget, WidgetConfig} from '@enonic/lib-admin-ui/content/Widget';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UrlAction} from '../../../app/UrlAction';

interface WidgetsStore {
    items: Widget[];
    activeWidgetId: string | null;
    isLoading: boolean;
    error: string | null;
}

export const $sidebarWidgets = map<WidgetsStore>({
    items: [],
    activeWidgetId: null,
    isLoading: false,
    error: null,
});

export async function loadWidgets(): Promise<void> {
    $sidebarWidgets.setKey('isLoading', true);

    try {
        const request = new GetWidgetsByInterfaceRequest('contentstudio.menuitem');
        const response = await request.sendAndParse();
        const widgets = [createStudioWidget(), ...response];
        const sortedWidgets = sortWidgets(widgets);

        $sidebarWidgets.setKey('items', sortedWidgets);
        setInitialActiveWidget();
    } catch (error) {
        $sidebarWidgets.setKey('error', error.message);
    } finally {
        $sidebarWidgets.setKey('isLoading', false);
    }
}

export function setActiveWidget(widget: Widget): void {
    $sidebarWidgets.setKey('activeWidgetId', widget.getWidgetDescriptorKey().toString());
}

export const $activeWidget = computed($sidebarWidgets, (widgets) => {
    return widgets.items.find((w) => w?.getWidgetDescriptorKey().toString() === widgets.activeWidgetId);
});

function setInitialActiveWidget(): void {
    const url = window.location.href;
    const widgets = $sidebarWidgets.get().items;

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

    const isMainWidget = (widget: Widget): boolean => {
        return widget.getWidgetDescriptorKey().toString().endsWith(MAIN_APP_ENDING);
    };

    const isArchiveWidget = (widget: Widget): boolean => {
        return widget.getWidgetDescriptorKey().toString().endsWith(ARCHIVE_APP_ENDING);
    };

    const isSettingsWidget = (widget: Widget): boolean => {
        return widget.getWidgetDescriptorKey().toString().endsWith(SETTINGS_APP_ENDING);
    };

    const isDefaultWidget = (widget: Widget): boolean => {
        const widgetKey = widget.getWidgetDescriptorKey().toString();
        return [
            widgetKey.endsWith(MAIN_APP_ENDING),
            widgetKey.endsWith(ARCHIVE_APP_ENDING),
            widgetKey.endsWith(SETTINGS_APP_ENDING),
        ].every((widgetStatus) => widgetStatus === false);
    };
    const mainWidget = widgets.find(isMainWidget);
    const archiveWidget = widgets.find(isArchiveWidget);
    const settingsWidget = widgets.find(isSettingsWidget);
    const defaultWidgets = widgets.filter(isDefaultWidget);
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
