import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {closeIssueDialog, $issueDialog} from '../../../store/dialogs/issueDialog.store';
import {resetNewIssueDialogContext} from '../../../store/dialogs/newIssueDialog.store';
import {IssueDialogDetailsContent} from './IssueDialogDetailsContent';
import {IssueDialogListContent} from './IssueDialogListContent';
import {NewIssueDialogContent} from './NewIssueDialogContent';

const ISSUE_DIALOG_NAME = 'IssueDialog';

export const IssueDialog = (): ReactElement => {
    const {open, view} = useStore($issueDialog, {keys: ['open', 'view']});

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            closeIssueDialog();
            resetNewIssueDialogContext();
        }
    };

    return (
        <Dialog.Root data-component={ISSUE_DIALOG_NAME} open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay/>
                {view === 'list' && <IssueDialogListContent/>}
                {view === 'details' && <IssueDialogDetailsContent/>}
                {view === 'new-issue' && <NewIssueDialogContent/>}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

IssueDialog.displayName = ISSUE_DIALOG_NAME;
