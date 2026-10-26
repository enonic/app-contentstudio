import { Listbox } from '@enonic/ui';
import { LoaderCircle } from 'lucide-react';
import { type ReactElement } from 'react';
import { IssueListItem } from './IssueListItem';

import type { IssueWithAssignees } from '../../../../../app/issue/IssueWithAssignees';

export type IssueListProps = {
    issues: IssueWithAssignees[];
    emptyLabel?: string;
    loading?: boolean;
    onSelect?: (issue: IssueWithAssignees) => void;
};

const ISSUE_LIST_NAME = 'IssueList';

export const IssueList = ({ issues, emptyLabel, loading = false, onSelect }: IssueListProps): ReactElement => {
    const showLoading = loading && issues.length === 0;
    const showEmpty = issues.length === 0 && !loading && emptyLabel;

    return (
        <>
            {showLoading && (
                <div className="flex items-center justify-center py-10">
                    <LoaderCircle className="size-7 animate-spin text-subtle" />
                </div>
            )}
            {showEmpty && <div className="text-subtle italic px-2.5">{emptyLabel}</div>}
            <Listbox.Root
                selection={[]}
                onSelectionChange={(selection) => {
                    const issue = issues.find((issue) => issue.getIssue().getId() === selection[0]);
                    if (issue) {
                        onSelect?.(issue);
                    }
                }}
            >
                <Listbox.Content
                    data-component={ISSUE_LIST_NAME}
                    className="flex flex-col items-stretch p-2 gap-1.25 min-h-0 max-h-100 overflow-y-auto"
                >
                    {issues.map((issue) => (
                        <IssueListItem key={issue.getIssue().getId()} issue={issue} />
                    ))}
                </Listbox.Content>
            </Listbox.Root>
        </>
    );
};

IssueList.displayName = ISSUE_LIST_NAME;
