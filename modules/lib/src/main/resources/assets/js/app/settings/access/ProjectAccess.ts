import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type AccessOption} from '../../security/Access';

export enum ProjectAccess {
    OWNER = 'owner',
    EDITOR = 'editor',
    CONTRIBUTOR = 'contributor',
    AUTHOR = 'author'
}

export const getProjectAccessOptions = (): AccessOption[] => [
    {id: ProjectAccess.OWNER, displayName: i18n('settings.projects.access.owner')},
    {id: ProjectAccess.EDITOR, displayName: i18n('settings.projects.access.editor')},
    {id: ProjectAccess.CONTRIBUTOR, displayName: i18n('settings.projects.access.contributor')},
    {id: ProjectAccess.AUTHOR, displayName: i18n('settings.projects.access.author')}
];
