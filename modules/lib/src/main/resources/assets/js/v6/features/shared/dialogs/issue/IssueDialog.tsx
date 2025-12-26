import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {closeIssueDialog, $issueDialog} from '../../../store/dialogs/issueDialog.store';
import {IssueDialogDetailsContent} from './IssueDialogDetailsContent';
import {IssueDialogListContent} from './IssueDialogListContent';

const ISSUE_DIALOG_NAME = 'IssueDialog';

export const IssueDialog = (): ReactElement => {
    const {open, view} = useStore($issueDialog, {keys: ['open', 'view']});

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            closeIssueDialog();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay/>
                {view === 'list' && <IssueDialogListContent/>}
                {view === 'details' && <IssueDialogDetailsContent/>}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

IssueDialog.displayName = ISSUE_DIALOG_NAME;
