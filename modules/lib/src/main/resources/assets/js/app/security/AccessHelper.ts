import {Permission} from '../access/Permission';
import {Access} from './Access';

export class AccessHelper {

    public static getAccessValueFromPermissions(allowedPermissions: Permission[]): Access {
        if (this.isFullAccess(allowedPermissions)) {
            return Access.FULL;
        }

        if (this.canOnlyPublish(allowedPermissions)) {
            return Access.PUBLISH;
        }

        if (this.canOnlyWrite(allowedPermissions)) {
            return Access.WRITE;
        }

        if (this.canOnlyRead(allowedPermissions)) {
            return Access.READ;
        }

        return Access.CUSTOM;
    }

    private static canRead(allowed: Permission[]): boolean {
        return allowed.indexOf(Permission.READ) >= 0;
    }

    private static canOnlyRead(allowed: Permission[]): boolean {
        return this.canRead(allowed) && allowed.length === 1;
    }

    private static canWrite(allowed: Permission[]): boolean {
        return this.canRead(allowed) &&
               allowed.indexOf(Permission.CREATE) >= 0 &&
               allowed.indexOf(Permission.MODIFY) >= 0 &&
               allowed.indexOf(Permission.DELETE) >= 0;
    }

    private static canOnlyWrite(allowed: Permission[]): boolean {
        return this.canWrite(allowed) && allowed.length === 4;
    }

    private static canPublish(allowed: Permission[]): boolean {
        return this.canWrite(allowed) && allowed.indexOf(Permission.PUBLISH) >= 0;
    }

    private static canOnlyPublish(allowed: Permission[]): boolean {
        return this.canPublish(allowed) && allowed.length === 5;
    }

    private static isFullAccess(allowed: Permission[]): boolean {
        return this.canPublish(allowed) &&
               allowed.indexOf(Permission.WRITE_PERMISSIONS) >= 0;
    }
}
