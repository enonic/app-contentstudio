import PrincipalJson = api.security.PrincipalJson;

export interface AccessControlEntryJson {

    principal: PrincipalJson;

    allow: string[];

    deny: string[];

}
