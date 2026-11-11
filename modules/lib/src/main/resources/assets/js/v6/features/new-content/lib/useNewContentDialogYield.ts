import { useStore } from '@nanostores/preact';
import { useCallback } from 'react';
import type { DialogYield } from '../../../shared/ui/dialogs/dialogYield';
import { $newContentDialog } from '../model/newContentDialog.store';

/**
 * How a dialog hosting the form that opened the New Content dialog yields to it: invisible,
 * non-modal and deaf to close requests while it is open.
 */
export const useNewContentDialogYield = (): DialogYield => {
    const { open } = useStore($newContentDialog, { keys: ['open'] });
    const shouldIgnoreClose = useCallback(() => $newContentDialog.get().open, []);

    return {
        overlayHidden: open,
        contentProps: { modal: !open, className: open ? 'invisible' : undefined },
        shouldIgnoreClose,
    };
};
