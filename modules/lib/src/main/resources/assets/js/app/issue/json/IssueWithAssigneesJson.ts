import {type IssueJson} from './IssueJson';
import {type PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';

export interface IssueWithAssigneesJson {

    issue: IssueJson;

    assignees: PrincipalJson[];
}
