import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {AccessControlList} from '../access/AccessControlList';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {Access} from '../security/Access';

export class PermissionHelper {

    static hasPermission(permission: Permission, loginResult: LoginResult, accessControlList: AccessControlList): boolean {
        let result = false;
        let entries = accessControlList.getEntries();
        let accessEntriesWithGivenPermissions: AccessControlEntry[] = entries.filter((item: AccessControlEntry) => {
            return item.isAllowed(permission);
        });

        loginResult.getPrincipals().some((principalKey: PrincipalKey) => {
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

    static hasAdminPermissions(loginResult: LoginResult): boolean {
        return loginResult.isContentAdmin();
    }

    static hasFullAccess(loginResult: LoginResult, permissions: AccessControlList): boolean {
        const principalKeysWithFullAccess: PrincipalKey[] = permissions.getEntries().filter(
            (ace: AccessControlEntry) => AccessControlEntryView.getAccessValueFromEntry(ace) === Access.FULL).map(
            (ace: AccessControlEntry) => ace.getPrincipalKey());

        const principals: PrincipalKey[] = loginResult.getPrincipals();

        return principalKeysWithFullAccess.some((principalFullAccess: PrincipalKey) => principals.some(
            (principal: PrincipalKey) => principalFullAccess.equals(principal)));
    }
}
