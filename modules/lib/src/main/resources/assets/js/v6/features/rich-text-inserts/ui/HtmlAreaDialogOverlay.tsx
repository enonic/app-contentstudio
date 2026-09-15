import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import { $fullscreenDialog } from '../model/fullscreenDialog.store';

const HTML_AREA_DIALOG_OVERLAY_NAME = 'HtmlAreaDialogOverlay';

export const HtmlAreaDialogOverlay = (): ReactElement => {
    const { open: fullscreenOpen } = useStore($fullscreenDialog, { keys: ['open'] });

    return <Dialog.Overlay className={fullscreenOpen ? 'z-40' : undefined} />;
};

HtmlAreaDialogOverlay.displayName = HTML_AREA_DIALOG_OVERLAY_NAME;
