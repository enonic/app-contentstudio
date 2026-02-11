import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {closeIssueDialog, $issueDialog} from '../../../store/dialogs/issueDialog.store';
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

    return (
        <>
            <Dialog.Root data-component={ISSUE_DIALOG_NAME} open={isListOpen} onOpenChange={handleOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay/>
                    <IssueDialogListContent/>
                </Dialog.Portal>
            </Dialog.Root>

            <IssueDialogDetails/>
        </>
    );
};

IssueDialog.displayName = ISSUE_DIALOG_NAME;
