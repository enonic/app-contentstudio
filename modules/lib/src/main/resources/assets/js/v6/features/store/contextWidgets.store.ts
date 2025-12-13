import {atom} from 'nanostores';

export const $isWidgetRenderable = atom<boolean>(false);

export const $isContextOpen = atom<boolean>(false);

export function setContextOpen(isOpen: boolean): void {
    $isContextOpen.set(isOpen);
}

export const $activeWidgetId = atom<string | undefined>(undefined);

export function setActiveWidgetId(widgetId: string | undefined): void {
    $activeWidgetId.set(widgetId);
}
