import AccessControlEntry = api.security.acl.AccessControlEntry;
import Permission = api.security.acl.Permission;
import LoginResult = api.security.auth.LoginResult;
import PrincipalKey = api.security.PrincipalKey;
import RoleKeys = api.security.RoleKeys;

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
}
