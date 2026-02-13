import {Access} from './Access';
import {EffectivePermissionAccess} from './EffectivePermissionAccess';
import {type EffectivePermissionMember} from './EffectivePermissionMember';
import {type EffectivePermissionJson} from '../resource/json/EffectivePermissionJson';

export class EffectivePermission {

    private access: Access;

    private permissionAccess: EffectivePermissionAccess;

    public getAccess(): Access {
        return this.access;
    }

    public getPermissionAccess(): EffectivePermissionAccess {
        return this.permissionAccess;
    }

    public getMembers(): EffectivePermissionMember[] {
        return this.permissionAccess.getUsers();
    }

    static fromJson(json: EffectivePermissionJson) {

        const effectivePermission = new EffectivePermission();

        effectivePermission.access = Access[json.access];
        effectivePermission.permissionAccess = EffectivePermissionAccess.fromJson(json.permissionAccessJson);

        return effectivePermission;
    }

}
