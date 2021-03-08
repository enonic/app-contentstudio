import {PrincipalJson} from 'lib-admin-ui/security/PrincipalJson';

export interface AccessControlEntryJson {

    principal: PrincipalJson;

    allow: string[];

    deny: string[];

}
