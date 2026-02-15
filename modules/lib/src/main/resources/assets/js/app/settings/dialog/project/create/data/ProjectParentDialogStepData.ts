import {ProjectDialogStepData} from './ProjectDialogStepData';
import {type Project} from '../../../../data/project/Project';

export class ProjectParentDialogStepData
    extends ProjectDialogStepData {

    private parentProjects: Project[];

    setParentProjects(value: Project[]): ProjectParentDialogStepData {
        this.parentProjects = value;
        return this;
    }

    getParentProjects(): Project[] {
        return this.parentProjects;
    }

    getMainParentProject(): Project {
        return this.parentProjects && this.parentProjects[0];
    }
}
