import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import type {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {IssueStatus} from '../../../../../app/issue/IssueStatus';

import type {Issue} from '../../../../../app/issue/Issue';

export function generateIssueStatusInfo(
    issue: Issue,
    t: (key: string, ...args: (string | number)[]) => string,
    user?: Principal,
): string {
    const key = issue.getIssueStatus() === IssueStatus.CLOSED
        ? 'field.issue.closed'
        : issue.getModifier()
            ? 'field.issue.updated'
            : 'field.issue.opened';
    const lastModifiedBy = issue.getModifier() || issue.getCreator();
    const modifiedBy = user && lastModifiedBy === user.getKey().toString()
        ? t('field.me')
        : lastModifiedBy;
    return t(key, modifiedBy, DateHelper.getModifiedString(issue.getModifiedTime()));
}
