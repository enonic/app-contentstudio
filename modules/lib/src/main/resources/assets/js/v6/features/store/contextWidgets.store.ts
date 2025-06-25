import {atom} from 'nanostores';

export const $isWidgetRenderable = atom<boolean>(false);

export const $isContextOpen = atom<boolean>(false);

export function setContextOpen(isOpen: boolean): void {
    $isContextOpen.set(isOpen);
}
