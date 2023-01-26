import {ProjectDialogStepData} from './ProjectDialogStepData';
import {ProjectApplication} from '../../../../wizard/panel/form/element/ProjectApplication';

export class ProjectApplicationsDialogStepData extends ProjectDialogStepData {

    private applications: ProjectApplication[];

    setProjectApplications(value: ProjectApplication[]): ProjectApplicationsDialogStepData {
        this.applications = value || [];
        return this;
    }

    getProjectApplications(): ProjectApplication[] {
        return this.applications;
    }
}
