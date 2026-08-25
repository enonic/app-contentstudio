import { atom } from 'nanostores';

export const $isBrowseSidebarOpen = atom<boolean>(false);

export const setBrowseSidebarOpen = (open: boolean): void => {
    $isBrowseSidebarOpen.set(open);
};
