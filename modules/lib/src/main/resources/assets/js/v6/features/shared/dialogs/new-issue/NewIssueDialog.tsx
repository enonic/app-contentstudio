import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {closeNewIssueDialog, $newIssueDialog} from '../../../store/dialogs/newIssueDialog.store';
import {NewIssueDialogContent} from './NewIssueDialogContent';

const NEW_ISSUE_DIALOG_NAME = 'NewIssueDialog';

export const NewIssueDialog = (): ReactElement => {
    const {open} = useStore($newIssueDialog, {keys: ['open']});

    const handleOpenChange = (next: boolean): void => {
        if (!next) {
            closeNewIssueDialog();
        }
    };

    return (
        <Dialog.Root data-component={NEW_ISSUE_DIALOG_NAME} open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay/>
                <NewIssueDialogContent/>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

NewIssueDialog.displayName = NEW_ISSUE_DIALOG_NAME;
