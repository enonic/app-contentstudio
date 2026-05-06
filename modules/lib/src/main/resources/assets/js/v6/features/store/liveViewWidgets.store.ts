import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {computed, map} from 'nanostores';
import {GetExtensionsByInterfaceRequest} from '../../../app/resource/GetExtensionsByInterfaceRequest';
import {$contentType} from './wizardContent.store';

export const WIDGET_AUTO_DESCRIPTOR = 'preview-automatic';

type WidgetsStore = {
    widgets: Extension[];
    activeWidgetId: string | undefined;
};

export const $liveViewWidgets = map<WidgetsStore>({
    widgets: [],
    activeWidgetId: undefined,
});

export const $activeWidget = computed($liveViewWidgets, (store) => {
    return store.widgets.find((w) => getWidgetKey(w) === store.activeWidgetId);
});

export const $autoModeWidgets = computed($liveViewWidgets, (store) => {
    return store.widgets.filter(
        (item) => item.getDescriptorKey().getName() !== WIDGET_AUTO_DESCRIPTOR && item.getConfig().getProperty('auto') === 'true'
    );
});

export const $isLiveViewImageEditorActive = computed([$activeWidget, $contentType], (widget, contentType) => {
    return widget?.getDescriptorKey().getName() === WIDGET_AUTO_DESCRIPTOR && contentType?.getContentTypeName().isImage() === true;
});

export function setActiveWidget(widget: Extension | undefined): void {
    const existsInStore = $liveViewWidgets.get().widgets.some((p) => getWidgetKey(p) === getWidgetKey(widget));
    if (!existsInStore) return;
    $liveViewWidgets.setKey('activeWidgetId', getWidgetKey(widget));
}

//
// * Utilities
//

function getWidgetKey(widget: Extension | undefined): string | undefined {
    return widget?.getDescriptorKey().toString();
}

//
// * Internal
//

const WIDGET_INTERFACE = 'contentstudio.liveview';

async function loadWidgets(): Promise<void> {
    try {
        const request = new GetExtensionsByInterfaceRequest(WIDGET_INTERFACE);
        const widgets = await request.sendAndParse();

        $liveViewWidgets.setKey('widgets', sortWidgets(widgets));

        updateActiveWidget();
    } catch (error) {
        console.error(error);
    }
}

function updateActiveWidget(): void {
    if ($activeWidget.get()) return;

    const {widgets} = $liveViewWidgets.get();

    setActiveWidget(widgets[0]);
}

function sortWidgets(widgets: Extension[]): Extension[] {
    return widgets.sort((a, b) => {
        const orderA = a.getConfig().getProperty('order');
        const orderB = b.getConfig().getProperty('order');
        return (parseInt(orderA) ?? Number.MAX_SAFE_INTEGER) - (parseInt(orderB) ?? Number.MAX_SAFE_INTEGER);
    });
}

//
// * Initialization
//

void loadWidgets();
