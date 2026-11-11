import { useStore } from '@nanostores/preact';
import { useCallback } from 'react';
import type { DialogYield } from '../../../shared/ui/dialogs/dialogYield';
import { $isHtmlAreaModalDialogOpen, $isHtmlAreaOverlayOpen } from '../../rich-text-inserts/model/htmlAreaModal.store';

/**
 * How a dialog hosting an HtmlArea yields to the editor's overlays and dialogs, which render
 * outside it: the dialog steps back instead of closing or fighting them for focus.
 */
export const useHtmlAreaDialogYield = (): DialogYield => {
    const overlayOpen = useStore($isHtmlAreaOverlayOpen);
    const modalDialogOpen = useStore($isHtmlAreaModalDialogOpen);
    const shouldIgnoreClose = useCallback(() => $isHtmlAreaOverlayOpen.get(), []);

    return {
        overlayHidden: modalDialogOpen,
        contentProps: { modal: !overlayOpen, className: modalDialogOpen ? 'invisible' : undefined },
        shouldIgnoreClose,
    };
};
