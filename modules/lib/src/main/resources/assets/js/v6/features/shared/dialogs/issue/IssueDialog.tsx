import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {$issueDialog, closeIssueDialog} from '../../../store/dialogs/issueDialog.store';
import {IssueDialogDetails} from './IssueDialogDetails';
import {IssueDialogListContent} from './IssueDialogListContent';

const ISSUE_DIALOG_NAME = 'IssueDialog';

export const IssueDialog = (): ReactElement => {
    const {open, view} = useStore($issueDialog, {keys: ['open', 'view']});
    const isListOpen = open && view === 'list';

    const handleOpenChange = (next: boolean): void => {
        if (!next) {
            closeIssueDialog();
        }
    };

    // TODO: Two separate Dialog.Root instances may cause a visual flash when switching between
    //  list and details views, since one dialog closes while the other opens simultaneously.
    //  If Dialog has CSS open/close transitions, consider disabling animations for these roots
    //  or switching to a single Dialog.Root with conditional content.
    return (
        <>
            <Dialog.Root data-component={ISSUE_DIALOG_NAME} open={isListOpen} onOpenChange={handleOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <IssueDialogListContent />
                </Dialog.Portal>
            </Dialog.Root>

            <IssueDialogDetails />
        </>
    );
};

IssueDialog.displayName = ISSUE_DIALOG_NAME;
