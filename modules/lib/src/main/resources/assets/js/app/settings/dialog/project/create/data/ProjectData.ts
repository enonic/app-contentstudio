import {Project} from '../../../../data/project/Project';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectAccessDialogStepData} from './ProjectAccessDialogStepData';
import {ProjectPermissionsDialogStepData} from './ProjectPermissionsDialogStepData';

export class ProjectData {

    parent?: Project;

    locale?: Locale;

    description?: string;

    access: ProjectAccessDialogStepData;

    permissions: ProjectPermissionsDialogStepData;

    name: string;

    displayName: string;
}
