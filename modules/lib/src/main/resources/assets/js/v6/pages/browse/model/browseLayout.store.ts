import { atom } from 'nanostores';

// Fullscreen preview overlay state for the mobile browse mode.
export const $isMobilePreviewOpen = atom<boolean>(false);

export function setMobilePreviewOpen(open: boolean): void {
    $isMobilePreviewOpen.set(open);
}
