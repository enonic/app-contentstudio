import {type Project} from '../../../../data/project/Project';

export class ProjectApplicationsFormParams {

    private project: Project;

    private parentProjects: Project[];

    private configEditable: boolean;

    constructor(project?: Project, configEditable: boolean = true) {
        this.project = project;
        this.configEditable = configEditable;
    }

    getProject(): Project {
        return this.project;
    }

    setProject(project: Project) {
        this.project = project;
        return this;
    }

    isConfigEditable(): boolean {
        return this.configEditable;
    }

    setConfigEditable(value: boolean) {
        this.configEditable = value;
        return this;
    }

    setParentProjects(projects: Project[]) {
        this.parentProjects = projects;
        return this;
    }

    getParentProjects(): Project[] {
        return this.parentProjects;
    }

    hasParentProjects(): boolean {
        return this.parentProjects !== undefined && this.parentProjects.length > 0;
    }
}
