import {type Project} from '../../../../data/project/Project';
import {type Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {type ProjectAccessDialogStepData} from './ProjectAccessDialogStepData';
import {type ProjectPermissionsDialogStepData} from './ProjectPermissionsDialogStepData';
import {type ProjectApplication} from '../../../../wizard/panel/form/element/ProjectApplication';

export interface ProjectData {

    parents?: Project[];

    locale?: Locale;

    description?: string;

    access: ProjectAccessDialogStepData;

    permissions?: ProjectPermissionsDialogStepData;

    name: string;

    displayName: string;

    applications?: ProjectApplication[];
}
