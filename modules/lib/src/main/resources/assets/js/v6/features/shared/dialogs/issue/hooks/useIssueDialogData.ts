import {useEffect} from 'react';
import {loadIssueDialogComments, loadIssueDialogIssue} from '../../../../store/dialogs/issueDialogDetails.store';

export const useIssueDialogData = (
    issueId: string | undefined,
    hasIssueData: boolean,
): void => {
    useEffect(() => {
        if (!issueId || hasIssueData) {
            return;
        }
        void loadIssueDialogIssue(issueId);
    }, [issueId, hasIssueData]);

    useEffect(() => {
        if (!issueId) {
            return;
        }
        void loadIssueDialogComments(issueId);
    }, [issueId]);
};
