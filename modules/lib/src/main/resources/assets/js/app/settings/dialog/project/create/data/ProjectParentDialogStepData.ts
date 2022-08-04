import {ProjectDialogStepData} from './ProjectDialogStepData';
import {Project} from '../../../../data/project/Project';

export class ProjectParentDialogStepData extends ProjectDialogStepData {

    private parentProject: Project;

    setParentProject(value: Project): ProjectParentDialogStepData {
        this.parentProject = value;
        return this;
    }

    getParentProject(): Project {
        return this.parentProject;
    }
}
