import {atom} from 'nanostores';

// Reflects whether the preview panel is currently visible to the user.
// Set by both the wizard (ContentWizardPanel) and the browse view
// (ContentItemPreviewPanel) so consumers can react regardless of mode.
export const $isPreviewPanelVisible = atom<boolean>(false);
