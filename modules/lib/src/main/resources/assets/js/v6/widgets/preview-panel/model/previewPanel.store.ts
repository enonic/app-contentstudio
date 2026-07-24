import { atom } from 'nanostores';

// Bumped when the browse preview must re-render even though the selected
// content itself did not change (e.g. an applicable page template changed).
export const $previewRefreshRequested = atom<number>(0);

export const requestPreviewRefresh = (): void => {
    $previewRefreshRequested.set(Date.now());
};
