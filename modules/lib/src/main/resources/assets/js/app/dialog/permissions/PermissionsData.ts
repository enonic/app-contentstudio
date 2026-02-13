import {type AccessControlEntry} from '../../access/AccessControlEntry';

export type ApplyPermissionsScope = 'single' | 'tree' | 'subtree';

export interface PermissionsData {
    permissions: AccessControlEntry[],
    applyTo: ApplyPermissionsScope,
    reset: boolean,
}
