import {cn} from '@enonic/ui';
import {type ReactElement} from 'react';

import {IssueStatus} from '../../../../app/issue/IssueStatus';
import {useI18n} from '../../hooks/useI18n';

export type IssueStatusBadgeProps = {
    status: IssueStatus;
    className?: string;
};

const ISSUE_STATUS_BADGE_NAME = 'IssueStatusBadge';

export function IssueStatusBadge({status, className}: IssueStatusBadgeProps): ReactElement {
    const isClosed = status === IssueStatus.CLOSED;
    const label = useI18n(isClosed ? 'field.issue.status.closed' : 'field.issue.status.open');

    // TODO: Enonic UI - Replace bg-bdr-subtle once the closed status color is defined.
    return (
        <span data-component={ISSUE_STATUS_BADGE_NAME} className={cn('inline-flex items-center gap-3', className)}>
            <span className={cn('size-4 rounded-full bg-success', isClosed && 'bg-surface-muted')} />
            <span className={cn('text-lg font-semibold capitalize', isClosed && 'text-subtle')}>
                {label}
            </span>
        </span>
    );
}
