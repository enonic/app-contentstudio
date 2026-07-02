import { useEffect } from 'react';
import { loadIssueDialogComments, loadIssueDialogIssue } from '../../../model/issueDialogDetails.store';

export const useIssueDialogData = (issueId: string | undefined, hasIssueData: boolean): void => {
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
