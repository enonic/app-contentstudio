import {Project} from '../../../../data/project/Project';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectAccessDialogStepData} from './ProjectAccessDialogStepData';
import {ProjectPermissionsData} from './ProjectPermissionsData';

export class ProjectData {

    parent?: Project;

    locale?: Locale

    description?: string;

    access: ProjectAccessDialogStepData;

    permissions: ProjectPermissionsData;

    name: string;

    displayName: string;
}
