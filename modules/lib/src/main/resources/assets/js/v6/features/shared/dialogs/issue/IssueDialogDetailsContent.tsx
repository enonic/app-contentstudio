import {Dialog} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';

const ISSUE_DIALOG_DETAILS_CONTENT_NAME = 'IssueDialogDetailsContent';

export const IssueDialogDetailsContent = (): ReactElement => {
    const title = useI18n('dialog.issue');

    return (
        <Dialog.Content
            className="w-full h-full gap-6 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
            data-component={ISSUE_DIALOG_DETAILS_CONTENT_NAME}
        >
            <Dialog.DefaultHeader title={title} withClose/>
            <Dialog.Body/>
        </Dialog.Content>
    );
};

IssueDialogDetailsContent.displayName = ISSUE_DIALOG_DETAILS_CONTENT_NAME;
