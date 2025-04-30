import {Permission} from './Permission';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';

export class PermissionsHelper {

    static getAllPermissions(): Permission[] {
        return [Permission.READ, Permission.CREATE, Permission.MODIFY, Permission.DELETE, Permission.PUBLISH, Permission.WRITE_PERMISSIONS];
    }

    static hasAdminPermissions(): boolean {
        return AuthHelper.isAdmin() || AuthHelper.isContentAdmin();
    }
}
