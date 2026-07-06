import { type ResultAsync } from 'neverthrow';
import { IssueType } from '../../../../app/issue/IssueType';
import { type IssueStatsJson } from '../../../../app/issue/json/IssueStatsJson';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsProjectUrl } from '../../../shared/lib/url/cms';

/**
 * Fetch the raw issue stats for a project (project-scoped, non-content endpoint).
 * An optional issue type narrows the stats; `STANDARD` (0) is a valid value, so
 * the type is serialized whenever it is not nullish.
 * Used by: entities/issue/issuesStats.store, features/issues/model/issueDialog.store.
 */
export function fetchIssueStats(projectName?: string, type?: IssueType): ResultAsync<IssueStatsJson, AppError> {
    return requestJson<IssueStatsJson>(getCmsProjectUrl('issue/stats', projectName), {
        method: 'POST',
        body: { type: type != null ? IssueType[type] : null },
    });
}
