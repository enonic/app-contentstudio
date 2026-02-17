import {type IssueWithAssigneesJson} from '../json/IssueWithAssigneesJson';
import {type ResultMetadataJson} from '../../resource/json/ResultMetadataJson';

export interface ListIssuesResult {

    issues: IssueWithAssigneesJson[];

    metadata: ResultMetadataJson;
}
