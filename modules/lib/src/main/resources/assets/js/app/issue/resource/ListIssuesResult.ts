import {IssueWithAssigneesJson} from '../json/IssueWithAssigneesJson';
import {ResultMetadataJson} from '../../resource/json/ResultMetadataJson';

export interface ListIssuesResult {

    issues: IssueWithAssigneesJson[];

    metadata: ResultMetadataJson;
}
