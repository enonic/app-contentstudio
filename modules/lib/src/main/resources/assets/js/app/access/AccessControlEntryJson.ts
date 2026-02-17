import {type PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';

export interface AccessControlEntryJson {

    principal: PrincipalJson;

    allow: string[];

    deny: string[];

}
