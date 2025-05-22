import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {AccessControlChangedItem} from './AccessControlChangedItem';
import {ApplyPermissionsScope} from './PermissionsData';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Permission} from '../../access/Permission';
import * as Q from 'q';
import {PrincipalViewer} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {PermissionsHelper} from '../../access/PermissionsHelper';
import {PermissionStateView} from './PermissionStateView';
import {EditPermissionState} from './EditPermissionState';

export class AccessControlChangedItemView
    extends DivEl {

    private readonly item: AccessControlChangedItem;

    private readonly applyTo: ApplyPermissionsScope;

    private readonly resetChildPermissions: boolean;

    constructor(item: AccessControlChangedItem, applyTo: ApplyPermissionsScope, resetChildPermissions: boolean) {
        super('access-control-changed-item-view');

        this.item = item;
        this.applyTo = applyTo;
        this.resetChildPermissions = resetChildPermissions;
    }

    private getAccessValue(): string {
        if (this.isEntryRemoved()) {
            return i18n('dialog.permissions.step.strategy.item.removed');
        }

        if (this.isEntryAdded()) {
            return i18n('dialog.permissions.step.strategy.item.added');
        }

        return i18n('dialog.permissions.step.strategy.item.modified');
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
            this.addClass(this.resetChildPermissions ? 'reset' : 'merge');
            this.toggleClass('removed', this.isEntryRemoved());
            const principalViewer = new PrincipalViewer();
            principalViewer.setObject(this.item.getPrincipal());

            const accessEl = new SpanEl('access-control-changed-item-access');
            accessEl.setHtml(this.getAccessValue());

            const principalAndStatusEl = new DivEl('access-control-changed-item-principal-with-status');
            principalAndStatusEl.appendChildren(principalViewer, accessEl);
            this.appendChild(principalAndStatusEl);

            if (!this.isEntryRemoved()) {
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
