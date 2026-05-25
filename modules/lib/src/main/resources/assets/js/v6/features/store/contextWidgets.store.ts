import {atom, computed} from 'nanostores';

export const $isWidgetRenderable = atom<boolean>(false);

export const $isContextOpen = atom<boolean>(false);

export function setContextOpen(isOpen: boolean): void {
    $isContextOpen.set(isOpen);
}

export const $activeWidgetId = atom<string | undefined>(undefined);

export function setActiveWidgetId(widgetId: string | undefined): void {
    $activeWidgetId.set(widgetId);
}

export type RegisteredWidget = {
    name: string;
    applicationKey: string;
    key: string;
};

export const $registeredWidgets = atom<readonly RegisteredWidget[]>([]);

export function setRegisteredWidgets(widgets: readonly RegisteredWidget[]): void {
    $registeredWidgets.set(widgets);
}

export const $registeredWidgetNames = computed($registeredWidgets, widgets =>
    new Set(widgets.map(w => w.name)),
);
