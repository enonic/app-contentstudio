import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {PrincipalViewer} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {Permission} from '../../access/Permission';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AccessControlEntryView} from '../../view/AccessControlEntryView';
import {Access} from '../../security/Access';
import {PermissionsHelper} from '../../access/PermissionsHelper';

export interface AccessControlChangedPermissions {
    persisted?: Permission[];
    updated?: Permission[];
}

export class AccessControlChangedItem {

    private readonly principal: Principal;

    private readonly permissions: AccessControlChangedPermissions;

    constructor(principal: Principal, permissions: AccessControlChangedPermissions) {
        this.principal = principal;
        this.permissions = permissions;
    }

    getPrincipal(): Principal {
        return this.principal;
    }

    getPermissions(): AccessControlChangedPermissions {
        return this.permissions;
    }
}

export class AccessControlChangedItemsList
    extends ListBox<AccessControlChangedItem> {

    constructor() {
        super('access-control-changed-items-list');
    }

    protected createItemView(item: AccessControlChangedItem, readOnly: boolean): AccessControlChangedItemView {
        return new AccessControlChangedItemView(item);
    }

    protected getItemId(item: AccessControlChangedItem): string {
        return item.getPrincipal().getKey().toString();
    }

}

export class AccessControlChangedItemView
    extends DivEl {

    private readonly item: AccessControlChangedItem;

    constructor(item: AccessControlChangedItem) {
        super('access-control-changed-item-view');

        this.item = item;
    }

    private getAccessValue(): string {
        if (!this.item.getPermissions().updated || this.item.getPermissions().updated?.length === 0) {
            return i18n('dialog.permissions.step.strategy.item.removed');
        }

        if (!this.item.getPermissions().persisted && this.item.getPermissions().updated) {
            return i18n('dialog.permissions.step.strategy.item.added');
        }

        const access = AccessControlEntryView.getAccessValueFromPermissions(this.item.getPermissions().updated);
        return i18n(`security.access.${Access[access].toLowerCase()}`);
    }

    private isRemoved(): boolean {
        return !this.item.getPermissions().updated || this.item.getPermissions().updated?.length === 0;
    }

    private getPermissionState(permission: Permission): PermissionState {
        const isPermInPersisted = this.item.getPermissions().persisted && this.item.getPermissions().persisted?.indexOf(permission) !== -1;
        const isPermInUpdated = this.item.getPermissions().updated && this.item.getPermissions().updated?.indexOf(permission) !== -1;

        if (!isPermInPersisted) { // permission was not present before
            return isPermInUpdated ? PermissionState.ADDED : PermissionState.UNSET;
        }

        // permission was present before

        if (isPermInUpdated) {
            return PermissionState.UNCHANGED;
        }

        return PermissionState.REMOVED;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.toggleClass('removed', this.isRemoved());
            const principalViewer = new PrincipalViewer();
            principalViewer.setObject(this.item.getPrincipal());

            const accessEl = new SpanEl('access-control-changed-item-access');
            accessEl.setHtml(this.getAccessValue());

            const principalAndStatusEl = new DivEl('access-control-changed-item-principal-with-status');
            principalAndStatusEl.appendChildren(principalViewer, accessEl);
            this.appendChild(principalAndStatusEl);

            if (!this.isRemoved()) {
                const permissionsEl = new DivEl('access-control-changed-item-permissions');

                PermissionsHelper.getAllPermissions().forEach(permission => {
                   permissionsEl.appendChild(new PermissionStateView(permission, this.getPermissionState(permission)));
                });

                this.appendChild(permissionsEl);
            }

            return rendered;
        });
    }

}

enum PermissionState {
    ADDED = 'added',
    REMOVED = 'removed',
    UNCHANGED = 'unchanged',
    UNSET = 'unset'
}

class PermissionStateView extends SpanEl {

    private readonly permission: Permission;

    private readonly state: PermissionState;

    constructor(permission: Permission, state: PermissionState) {
        super('permission-state-view');

        this.permission = permission;
        this.state = state;
    }

    private permissionToString(permission: Permission): string {
        return Permission[permission]?.toLowerCase().replace('_', '') ?? '';
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass(this.state);
            this.setHtml(i18n(`security.permission.${this.permissionToString(this.permission)}`));

            return rendered;
        });
    }

}
