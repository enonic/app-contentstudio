import {Project} from '../../../../data/project/Project';

export class ProjectApplicationsFormParams {

    private readonly project: Project;

    private readonly configEditable: boolean;

    constructor(project: Project, configEditable: boolean) {
        this.project = project;
        this.configEditable = configEditable;
    }

    getProject(): Project {
        return this.project;
    }

    isConfigEditable(): boolean {
        return this.configEditable;
    }
}
