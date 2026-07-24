import { atom } from 'nanostores';

// Session-only, like the legacy stashed size; 0 means "not resized yet".
export const $floatingContextWidth = atom<number>(0);

export function setFloatingContextWidth(width: number): void {
    $floatingContextWidth.set(width);
}
