import {computed, map} from 'nanostores';
import {GetWidgetsByInterfaceRequest} from '../../../app/resource/GetWidgetsByInterfaceRequest';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';

export const WIDGET_AUTO_DESCRIPTOR = 'preview-automatic';

type WidgetsStore = {
    widgets: Widget[];
    activeWidgetId: string | undefined;
};

export const $liveviewWidgets = map<WidgetsStore>({
    widgets: [],
    activeWidgetId: undefined,
});

export const $activeWidget = computed($liveviewWidgets, (store) => {
    return store.widgets.find((w) => getWidgetKey(w) === store.activeWidgetId);
});

export const $autoModeWidgets = computed($liveviewWidgets, (store) => {
    return store.widgets.filter(
        (item) =>
            item.getWidgetDescriptorKey().getName() !== WIDGET_AUTO_DESCRIPTOR &&
            item.getConfig().getProperty('auto') === 'true'
    );
});

export function setActiveWidget(widget: Widget | undefined): void {
    const existsInStore = $liveviewWidgets.get().widgets.some((p) => getWidgetKey(p) === getWidgetKey(widget));
    if (!existsInStore) return;
    $liveviewWidgets.setKey('activeWidgetId', getWidgetKey(widget));
}

//
// * Utilities
//

function getWidgetKey(widget: Widget | undefined): string | undefined {
    return widget?.getWidgetDescriptorKey().toString();
}

//
// * Internal
//

const WIDGET_INTERFACE = 'contentstudio.liveview';

async function loadWidgets(): Promise<void> {
    try {
        const request = new GetWidgetsByInterfaceRequest(WIDGET_INTERFACE);
        const widgets = await request.sendAndParse();

        $liveviewWidgets.setKey('widgets', sortWidgets(widgets));

        updateActiveWidget();
    } catch (error) {
        console.error(error);
    }
}

function updateActiveWidget(): void {
    if ($activeWidget.get()) return;

    const {widgets} = $liveviewWidgets.get();

    setActiveWidget(widgets[0]);
}

function sortWidgets(widgets: Widget[]): Widget[] {
    return widgets.sort((a, b) => {
        const orderA = a.getConfig().getProperty('order');
        const orderB = b.getConfig().getProperty('order');
        return (parseInt(orderA) ?? 999) - (parseInt(orderB) ?? 999);
    });
}

//
// * Initialization
//

void loadWidgets();
