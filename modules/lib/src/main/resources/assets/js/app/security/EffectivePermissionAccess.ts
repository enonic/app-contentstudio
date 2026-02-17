import {EffectivePermissionMember} from './EffectivePermissionMember';
import {type EffectivePermissionAccessJson} from '../resource/json/EffectivePermissionAccessJson';

export class EffectivePermissionAccess {

    private count: number;

    private users: EffectivePermissionMember[];

    static fromJson(json: EffectivePermissionAccessJson) {

        const effectivePermissionAccess = new EffectivePermissionAccess();

        effectivePermissionAccess.count = json.count;
        effectivePermissionAccess.users = json.users.map(
            memberJson => EffectivePermissionMember.fromJson(memberJson));

        return effectivePermissionAccess;
    }

    getCount(): number {
        return this.count;
    }

    getUsers(): EffectivePermissionMember[] {
        return this.users;
    }
}
