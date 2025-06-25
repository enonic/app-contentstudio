import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {$sortDialog, closeSortDialog} from '../../../store/dialogs/sortDialog.store';
import {SortDialogMainContent} from './SortDialogMainContent';

const SORT_DIALOG_NAME = 'SortDialog';

export const SortDialog = (): ReactElement => {
    const {open, submitting} = useStore($sortDialog, {keys: ['open', 'submitting']});

    const handleOpenChange = (next: boolean) => {
        if (!next && !submitting) {
            closeSortDialog();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <SortDialogMainContent />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

SortDialog.displayName = SORT_DIALOG_NAME;
