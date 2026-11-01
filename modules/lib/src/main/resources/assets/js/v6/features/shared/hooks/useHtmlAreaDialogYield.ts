import { useStore } from '@nanostores/preact';
import { useCallback } from 'react';
import { $isHtmlAreaModalDialogOpen, $isHtmlAreaOverlayOpen } from '../../rich-text-inserts/model/htmlAreaModal.store';

export type HtmlAreaDialogYield = {
    /** The overlay goes while an HtmlArea link or image dialog is open. */
    overlayHidden: boolean;
    /** For the `Dialog.Content`: non-modal under an HtmlArea overlay, invisible under its dialogs. */
    contentProps: { modal: boolean; className: string | undefined };
    /** A close request to ignore: an HtmlArea overlay is open and owns the click or the key. */
    shouldIgnoreClose: () => boolean;
};

/**
 * How a dialog hosting an HtmlArea yields to the editor's overlays and dialogs, which render
 * outside it: the dialog steps back instead of closing or fighting them for focus.
 */
export const useHtmlAreaDialogYield = (): HtmlAreaDialogYield => {
    const overlayOpen = useStore($isHtmlAreaOverlayOpen);
    const modalDialogOpen = useStore($isHtmlAreaModalDialogOpen);
    const shouldIgnoreClose = useCallback(() => $isHtmlAreaOverlayOpen.get(), []);

    return {
        overlayHidden: modalDialogOpen,
        contentProps: { modal: !overlayOpen, className: modalDialogOpen ? 'invisible' : undefined },
        shouldIgnoreClose,
    };
};
