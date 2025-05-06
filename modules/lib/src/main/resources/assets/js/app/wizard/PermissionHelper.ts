import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {AccessControlList} from '../access/AccessControlList';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {Access} from '../security/Access';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import * as Q from 'q';
import {GetContentByPathRequest} from '../resource/GetContentByPathRequest';
import {Content} from '../content/Content';
import {ContentPath} from '../content/ContentPath';

export class PermissionHelper {

    static hasPermission(permission: Permission, accessControlList: AccessControlList): boolean {
        let result = false;
        let entries = accessControlList.getEntries();
        let accessEntriesWithGivenPermissions: AccessControlEntry[] = entries.filter((item: AccessControlEntry) => {
            return item.isAllowed(permission);
        });

        AuthHelper.getPrincipalsKeys().some((principalKey: PrincipalKey) => {
            if (RoleKeys.isAdmin(principalKey) ||
                this.isPrincipalPresent(principalKey, accessEntriesWithGivenPermissions)) {
                result = true;
                return true;
            }
        });
        return result;
    }

    static isPrincipalPresent(principalKey: PrincipalKey,
                              accessEntriesToCheck: AccessControlEntry[]): boolean {
        let result = false;
        accessEntriesToCheck.some((entry: AccessControlEntry) => {
            if (entry.getPrincipalKey().equals(principalKey)) {
                result = true;
                return true;
            }
        });

        return result;
    }

    static hasAdminPermissions(): boolean {
        return AuthHelper.isAdmin() || AuthHelper.isContentAdmin();
    }

    static hasFullAccess(permissions: AccessControlList): boolean {
        const principalKeysWithFullAccess: PrincipalKey[] = permissions.getEntries().filter(
            (ace: AccessControlEntry) => AccessControlEntryView.getAccessValueFromEntry(ace) === Access.FULL).map(
            (ace: AccessControlEntry) => ace.getPrincipalKey());

        return principalKeysWithFullAccess.some((principalFullAccess: PrincipalKey) => AuthHelper.getPrincipalsKeys().some(
            (principal: PrincipalKey) => principalFullAccess.equals(principal)));
    }

    static getParentPermissions(parentPath: ContentPath): Q.Promise<AccessControlList> {
        if (parentPath?.isNotRoot()) {
            return new GetContentByPathRequest(parentPath).sendAndParse().then((content: Content) => {
                return content.getPermissions();
            });
        }

        return Q(new AccessControlList());
    }

    static removeRedundantPermissions(permissions: AccessControlEntry[]): AccessControlEntry[] {
        const result = [];

        // removing unused PERMISSION.READ_PERMISSIONS and PERMISSION.WRITE_PERMISSIONS

        permissions.forEach((item) => {
            const cloned = item.clone();
            cloned.setDeniedPermissions([]);
            cloned.setAllowedPermissions(
                item.getAllowedPermissions().filter(p => p !== Permission.READ_PERMISSIONS && p !== Permission.WRITE_PERMISSIONS));

            result.push(cloned);
        });

        return result;
    }
}
