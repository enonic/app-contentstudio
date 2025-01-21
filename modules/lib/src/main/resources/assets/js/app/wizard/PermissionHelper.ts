import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {AccessControlList} from '../access/AccessControlList';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {Access} from '../security/Access';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';

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
}
