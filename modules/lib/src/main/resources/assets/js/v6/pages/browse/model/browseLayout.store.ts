import { atom } from 'nanostores';
import { LayoutTokens } from '../../../shared/ui/layout.tokens';

// Fullscreen preview overlay state for the mobile browse mode.
export const $isMobilePreviewOpen = atom<boolean>(false);

export function setMobilePreviewOpen(open: boolean): void {
    $isMobilePreviewOpen.set(open);
}

// Session-only, like the legacy stashed size.
export const $floatingContextWidth = atom<number>(LayoutTokens.contextPanel.minWidth);

export function setFloatingContextWidth(width: number): void {
    $floatingContextWidth.set(width);
}
