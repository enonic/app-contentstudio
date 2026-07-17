import { atom } from 'nanostores';

// Reflects whether the preview panel is currently visible to the user.
// Set by both the wizard (ContentWizardPanel) and the browse view
// (ContentItemPreviewPanel) so consumers can react regardless of mode.
export const $isPreviewPanelVisible = atom<boolean>(false);

// Bumped when the browse preview must re-render even though the selected
// content itself did not change (e.g. an applicable page template changed).
export const $previewRefreshRequested = atom<number>(0);

export const requestPreviewRefresh = (): void => {
    $previewRefreshRequested.set(Date.now());
};
