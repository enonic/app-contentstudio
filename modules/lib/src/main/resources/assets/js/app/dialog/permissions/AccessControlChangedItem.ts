import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {type Permission} from '../../access/Permission';

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
