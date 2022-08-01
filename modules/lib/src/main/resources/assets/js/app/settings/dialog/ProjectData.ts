import {Project} from '../data/project/Project';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectAccessData} from './ProjectAccessData';
import {ProjectPermissionsData} from './ProjectPermissionsData';

export class ProjectData {

    parent?: Project;

    locale?: Locale

    description?: string;

    access: ProjectAccessData;

    permissions: ProjectPermissionsData;

    name: string;

    displayName: string;
}
