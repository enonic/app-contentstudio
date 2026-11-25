import { type IssueWithAssigneesJson } from '../json/IssueWithAssigneesJson';
import { type ResultMetadataJson } from '../../../v6/shared/api/ResultMetadataJson';

export interface ListIssuesResult {
    issues: IssueWithAssigneesJson[];

    metadata: ResultMetadataJson;
}
