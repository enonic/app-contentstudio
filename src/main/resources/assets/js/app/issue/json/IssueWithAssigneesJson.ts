import {IssueJson} from './IssueJson';
import PrincipalJson = api.security.PrincipalJson;

export interface IssueWithAssigneesJson {

    issue: IssueJson;

    assignees: PrincipalJson[];
}
