import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Principal} from 'lib-admin-ui/security/Principal';
import {EffectivePermissionMemberJson} from '../resource/json/EffectivePermissionMemberJson';

export class EffectivePermissionMember {

    private userKey: PrincipalKey;

    private displayName: string;

    constructor(userKey: PrincipalKey, displayName: string) {
        this.userKey = userKey;
        this.displayName = displayName;
    }

    getUserKey(): PrincipalKey {
        return this.userKey;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    toPrincipal(): Principal {
        return <Principal>Principal.create().setKey(this.userKey).setDisplayName(this.displayName).build();
    }

    static fromJson(json: EffectivePermissionMemberJson) {
        return new EffectivePermissionMember(PrincipalKey.fromString(json.key), json.displayName);
    }

}
