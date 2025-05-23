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
import {PermissionsHelper} from '../access/PermissionsHelper';
import {GetContentRootPermissionsRequest} from '../resource/GetContentRootPermissionsRequest';

export class AccessControlHelper {

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

    static hasFullAccess(permissions: AccessControlList): boolean {
        const principalKeysWithFullAccess: PrincipalKey[] = permissions.getEntries().filter(
            (ace: AccessControlEntry) => AccessControlEntryView.getAccessValueFromEntry(ace) === Access.FULL).map(
            (ace: AccessControlEntry) => ace.getPrincipalKey());

        return principalKeysWithFullAccess.some((principalFullAccess: PrincipalKey) => AuthHelper.getPrincipalsKeys().some(
            (principal: PrincipalKey) => principalFullAccess.equals(principal)));
    }

    static getParentPermissions(parentPath: ContentPath): Q.Promise<AccessControlList> {
        if (!parentPath || parentPath.isRoot()) {
            return new GetContentRootPermissionsRequest().sendAndParse();
        }

        return new GetContentByPathRequest(parentPath).sendAndParse().then((content: Content) => {
            return content.getPermissions();
        });

    }

    static removeRedundantPermissions(permissions: AccessControlEntry[]): AccessControlEntry[] {
        const result = [];

        // removing unused PERMISSION.READ_PERMISSIONS and PERMISSION.WRITE_PERMISSIONS

        permissions.forEach((item) => {
            const cloned = item.clone();
            cloned.setDeniedPermissions([]);
            cloned.setAllowedPermissions(
                item.getAllowedPermissions().filter(p => p !== Permission.READ_PERMISSIONS));

            result.push(cloned);
        });

        return result;
    }

    static calcMergePermissions(oldPermissions: AccessControlEntry[], newPermissions: AccessControlEntry[]): {
        added: AccessControlList,
        removed: AccessControlList
    } {
        const toAdd: AccessControlList = new AccessControlList();
        const toRemove: AccessControlList = new AccessControlList();

        oldPermissions.forEach((originalVal) => {
            const found = newPermissions.find((currentVal) => originalVal.getPrincipalKey().equals(currentVal.getPrincipalKey()));

            if (found) { // was not removed
                if (!originalVal.equals(found)) { // item was changed
                    const addedPermissions = [];
                    const removedPermissions = [];

                    PermissionsHelper.getAllPermissions().forEach(p => {
                        if (found.getAllowedPermissions().indexOf(p) > -1) {
                            addedPermissions.push(p);
                        } else {
                            removedPermissions.push(p);
                        }
                    });

                    if (addedPermissions.length > 0) {
                        const entry = new AccessControlEntry(originalVal.getPrincipal());
                        entry.setAllowedPermissions(addedPermissions);
                        toAdd.add(entry);
                    }

                    if (removedPermissions.length > 0) {
                        const entry = new AccessControlEntry(originalVal.getPrincipal());
                        entry.setAllowedPermissions(removedPermissions);
                        toRemove.add(entry);
                    }
                }
            } else { // item was removed
                toRemove.add(new AccessControlEntry(originalVal.getPrincipal()));
            }
        });

        // check for newly added items
        newPermissions.forEach((currentValue) => {
            const found = oldPermissions.find((originalVal) => originalVal.getPrincipalKey().equals(currentValue.getPrincipalKey()));

            if (!found) { // item was added
                toAdd.add(currentValue);
            }
        });

        return {added: toAdd, removed: toRemove};
    }
}
