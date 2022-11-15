import {Project} from '../../../../data/project/Project';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectAccessDialogStepData} from './ProjectAccessDialogStepData';
import {ProjectPermissionsDialogStepData} from './ProjectPermissionsDialogStepData';
import {ProjectApplication} from '../../../../wizard/panel/form/element/ProjectApplication';

export class ProjectData {

    parent?: Project;

    locale?: Locale;

    description?: string;

    timeZone?: string;

    access: ProjectAccessDialogStepData;

    permissions?: ProjectPermissionsDialogStepData;

    name: string;

    displayName: string;

    applications?: ProjectApplication[];
}
