import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {AccessControlEntryJson} from './AccessControlEntryJson';
import {Permission} from './Permission';
import {PrincipalContainer} from '@enonic/lib-admin-ui/ui/security/PrincipalContainer';
import {PermissionsHelper} from './PermissionsHelper';

export class AccessControlEntry
    extends PrincipalContainer
    implements Equitable, Cloneable {

    private allowedPermissions: Permission[];

    private deniedPermissions: Permission[];

    constructor(principal: Principal) {
        super(principal);
        this.allowedPermissions = [];
        this.deniedPermissions = [];
    }

    getAllowedPermissions(): Permission[] {
        return this.allowedPermissions;
    }

    getDeniedPermissions(): Permission[] {
        return this.deniedPermissions;
    }

    setAllowedPermissions(permissions: Permission[]): void {
        this.allowedPermissions = permissions;
    }

    setDeniedPermissions(permissions: Permission[]): void {
        this.deniedPermissions = permissions;
    }

    isAllowed(permission: Permission): boolean {
        return (this.allowedPermissions.indexOf(permission) > -1) && (this.deniedPermissions.indexOf(permission) === -1);
    }

    isDenied(permission: Permission): boolean {
        return !this.isAllowed(permission);
    }

    isSet(permission: Permission): boolean {
        return (this.allowedPermissions.indexOf(permission) > -1) || (this.deniedPermissions.indexOf(permission) > -1);
    }

    allow(permission: Permission): AccessControlEntry {
        ArrayHelper.addUnique(permission, this.allowedPermissions);
        ArrayHelper.removeValue(permission, this.deniedPermissions);
        return this;
    }

    deny(permission: Permission): AccessControlEntry {
        ArrayHelper.addUnique(permission, this.deniedPermissions);
        ArrayHelper.removeValue(permission, this.allowedPermissions);
        return this;
    }

    remove(permission: Permission): AccessControlEntry {
        ArrayHelper.removeValue(permission, this.allowedPermissions);
        ArrayHelper.removeValue(permission, this.deniedPermissions);
        return this;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, AccessControlEntry)) {
            return false;
        }

        let other = o as AccessControlEntry;

        if (!ObjectHelper.equals(this.getPrincipalKey(), other.getPrincipalKey())) {
            return false;
        }

        if (!ObjectHelper.anyArrayEquals(this.allowedPermissions, other.allowedPermissions)) {
            return false;
        }

        if (!ObjectHelper.anyArrayEquals(this.deniedPermissions, other.deniedPermissions)) {
            return false;
        }
        return true;
    }

    toString(): string {
        let values = '';
        PermissionsHelper.getAllPermissions().forEach((permission: Permission) => {
            if (this.isSet(permission)) {
                if (values !== '') {
                    values += ', ';
                }
                values += this.isAllowed(permission) ? '+' : '-';
                values += Permission[permission].toUpperCase();
            }
        });
        return this.getPrincipalKey().toString() + '[' + values + ']';
    }

    clone(): AccessControlEntry {
        let ace = new AccessControlEntry(this.principal.clone());
        ace.allowedPermissions = this.allowedPermissions.slice(0);
        ace.deniedPermissions = this.deniedPermissions.slice(0);
        return ace;
    }

    toJson(): AccessControlEntryJson {
        return {
            principal: this.principal.toJson(),
            allow: this.allowedPermissions.map((perm) => Permission[perm]),
            deny: this.deniedPermissions.map((perm) => Permission[perm])
        };
    }

    static fromJson(json: AccessControlEntryJson): AccessControlEntry {
        let ace = new AccessControlEntry(Principal.fromJson(json.principal));
        let allow: Permission[] = json.allow.map((permStr) => Permission[permStr.toUpperCase()]);
        let deny: Permission[] = json.deny.map((permStr) => Permission[permStr.toUpperCase()]);
        ace.setAllowedPermissions(allow);
        ace.setDeniedPermissions(deny);
        return ace;
    }
}
