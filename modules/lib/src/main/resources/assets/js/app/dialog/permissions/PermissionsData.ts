import {AccessControlEntry} from '../../access/AccessControlEntry';

export type ApplyPermissionsScope = 'single' | 'tree' | 'subtree';

export type ApplyPermissionsStrategy = 'merge' | 'reset';

export interface PermissionsData {
    permissions: AccessControlEntry[],
    applyTo: ApplyPermissionsScope,
    strategy: ApplyPermissionsStrategy,
}
