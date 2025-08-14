import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {Permission} from '../../access/Permission';
import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {EditPermissionState} from './EditPermissionState';

export class PermissionStateView extends SpanEl {

    private readonly permission: Permission;

    private readonly state: EditPermissionState;

    constructor(permission: Permission, state: EditPermissionState) {
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
