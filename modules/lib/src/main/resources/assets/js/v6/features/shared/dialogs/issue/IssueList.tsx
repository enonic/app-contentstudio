import {LoaderCircle} from 'lucide-react';
import {type ReactElement} from 'react';
import {IssueListItem} from './IssueListItem';

import type {IssueWithAssignees} from '../../../../../app/issue/IssueWithAssignees';

export type IssueListProps = {
    issues: IssueWithAssignees[];
    emptyLabel?: string;
    loading?: boolean;
    onSelect?: (issue: IssueWithAssignees) => void;
};

const ISSUE_LIST_NAME = 'IssueList';

export const IssueList = ({
    issues,
    emptyLabel,
    loading = false,
    onSelect,
}: IssueListProps): ReactElement => {
    const showLoading = loading && issues.length === 0;
    const showEmpty = issues.length === 0 && !loading && emptyLabel;

    return (
        <>
            {showLoading && (
                <div className='flex items-center justify-center py-10'>
                    <LoaderCircle className='size-7 animate-spin text-subtle' />
                </div>
            )}
            {showEmpty && (
                <div className='text-sm text-subtle'>{emptyLabel}</div>
            )}
            <div
                data-component={ISSUE_LIST_NAME}
                className='flex flex-col gap-1.25 min-h-0 max-h-100 overflow-y-auto'>
                {issues.map(issue => (
                    <IssueListItem
                        key={issue.getIssue().getId()}
                        issue={issue}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </>
    );
};

IssueList.displayName = ISSUE_LIST_NAME;
