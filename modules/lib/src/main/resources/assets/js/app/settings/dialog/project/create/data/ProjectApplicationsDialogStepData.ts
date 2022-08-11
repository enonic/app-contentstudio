import {ProjectDialogStepData} from './ProjectDialogStepData';
import {ProjectApplication} from '../../../../wizard/panel/form/element/ProjectApplication';

export class ProjectApplicationsDialogStepData extends ProjectDialogStepData {

    private applications: ProjectApplication[];

    setApplications(value: ProjectApplication[]): ProjectApplicationsDialogStepData {
        this.applications = value || [];
        return this;
    }

    getApplications(): ProjectApplication[] {
        return this.applications;
    }
}
