export type IssueDialogView = 'list' | 'details' | 'new-issue';

export type IssueDialogFilter = 'all' | 'assignedToMe' | 'createdByMe' | 'publishRequests' | 'issues';

export type IssueDialogTab = 'open' | 'closed';

export type IssueDialogDetailsTab = 'comments' | 'items' | 'assignees';

export type IssueDialogListCounts = {
    open: number;
    closed: number;
};

export type IssueDialogListTotals = {
    all: IssueDialogListCounts;
    assignedToMe: IssueDialogListCounts;
    createdByMe: IssueDialogListCounts;
    publishRequests: IssueDialogListCounts;
    issues: IssueDialogListCounts;
};
