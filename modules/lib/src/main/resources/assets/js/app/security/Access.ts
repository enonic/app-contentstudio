import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export interface AccessOption {
    id: string;
    displayName: string;
}

export enum Access {
    FULL = 'FULL',
    READ = 'READ',
    WRITE = 'WRITE',
    PUBLISH = 'PUBLISH',
    CUSTOM = 'CUSTOM'
}

export const ACCESS_OPTIONS: AccessOption[] = [
    {id: Access.FULL, displayName: i18n('security.access.full')},
    {id: Access.PUBLISH, displayName: i18n('security.access.publish')},
    {id: Access.WRITE, displayName: i18n('security.access.write')},
    {id: Access.READ, displayName: i18n('security.access.read')},
    {id: Access.CUSTOM, displayName: i18n('security.access.custom')}
];
