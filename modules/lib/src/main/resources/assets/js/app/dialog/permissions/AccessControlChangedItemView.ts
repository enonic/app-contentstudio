import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type AccessControlChangedItem} from './AccessControlChangedItem';
import {type ApplyPermissionsScope} from './PermissionsData';
import {type Permission} from '../../access/Permission';
import type Q from 'q';
import {PrincipalViewer} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {EditPermissionState} from './EditPermissionState';
import {AccessHelper} from '../../security/AccessHelper';
import {AccessDiffView} from './AccessDiffView';
import {PermissionsHelper} from '../../access/PermissionsHelper';
import {PermissionStateView} from './PermissionStateView';
import {Access} from '../../security/Access';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class AccessControlChangedItemView
    extends DivEl {

    private readonly item: AccessControlChangedItem;

    private readonly applyTo: ApplyPermissionsScope;

    constructor(item: AccessControlChangedItem, applyTo: ApplyPermissionsScope) {
        super('access-control-changed-item-view');

        this.item = item;
        this.applyTo = applyTo;
    }

    private isEntryRemoved(): boolean {
        return !this.item.getPermissions().updated || this.item.getPermissions().updated?.length === 0;
    }

    private isEntryAdded(): boolean {
        return !this.item.getPermissions().persisted && !!this.item.getPermissions().updated;
    }

    private getPermissionState(permission: Permission): EditPermissionState {
        const isPermInPersisted = this.item.getPermissions().persisted && this.item.getPermissions().persisted?.indexOf(permission) !== -1;
        const isPermInUpdated = this.item.getPermissions().updated && this.item.getPermissions().updated?.indexOf(permission) !== -1;

        if (!isPermInPersisted) { // permission was not present before
            return isPermInUpdated ? EditPermissionState.ADDED : EditPermissionState.UNSET;
        }

        // permission was present before

        if (isPermInUpdated) {
            return EditPermissionState.UNCHANGED;
        }

        return EditPermissionState.REMOVED;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass(this.applyTo);
            this.addClass(this.getStateClassName());

            const principalViewer = new PrincipalViewer();
            principalViewer.setObject(this.item.getPrincipal());

            const prevPermissions = this.item.getPermissions().persisted;
            const fromAccess = prevPermissions ? AccessHelper.getAccessValueFromPermissions(this.item.getPermissions().persisted) : null;
            const currentPermissions = this.item.getPermissions().updated;
            const toAccess = currentPermissions ? AccessHelper.getAccessValueFromPermissions(this.item.getPermissions().updated) : null;

            const principalAndStatusEl = new DivEl('access-control-changed-item-principal-with-status');
            principalAndStatusEl.appendChild(principalViewer);
            principalAndStatusEl.appendChildren(new AccessDiffView(fromAccess, toAccess));
            this.appendChild(principalAndStatusEl);

            if (toAccess === Access.CUSTOM) {
                const permissionsEl = new DivEl('access-control-changed-item-permissions');

                PermissionsHelper.getAllPermissions().forEach(permission => {
                    permissionsEl.appendChild(new PermissionStateView(permission, this.getPermissionState(permission)));
                });

                this.appendChild(permissionsEl);
            }

            return rendered;
        });
    }

    private getStateClassName(): string {
        if (this.isEntryRemoved()) {
            return 'removed'
        }

        if (this.isEntryAdded()) {
            return 'added';
        }

        if (ObjectHelper.anyArrayEquals(this.item.getPermissions().persisted, this.item.getPermissions().updated)) {
            return 'unchanged';
        }

        return 'modified';
    }
}
