import {IssueJson} from './IssueJson';
import {PrincipalJson} from 'lib-admin-ui/security/PrincipalJson';

export interface IssueWithAssigneesJson {

    issue: IssueJson;

    assignees: PrincipalJson[];
}
