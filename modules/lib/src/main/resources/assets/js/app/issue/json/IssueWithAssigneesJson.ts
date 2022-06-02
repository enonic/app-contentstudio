import {IssueJson} from './IssueJson';
import {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';

export interface IssueWithAssigneesJson {

    issue: IssueJson;

    assignees: PrincipalJson[];
}
