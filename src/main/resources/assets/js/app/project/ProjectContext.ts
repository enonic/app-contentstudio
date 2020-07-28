import {ProjectChangedEvent} from './ProjectChangedEvent';
import {Project} from '../settings/data/project/Project';

export class ProjectContext {

    private static INSTANCE: ProjectContext;

    private defaultProject: Project;

    private currentProject: Project;

    private state: State = State.NOT_INITIALIZED;

    private constructor() {
        //
    }

    static get(): ProjectContext {
        if (!ProjectContext.INSTANCE) {
            ProjectContext.INSTANCE = new ProjectContext();
        }

        return ProjectContext.INSTANCE;
    }

    getProject(): Project {
        return this.currentProject;
    }

    setProject(project: Project) {
        const projectChanged: boolean = this.state === State.NOT_INITIALIZED || !project.equals(this.currentProject);
        this.currentProject = project;
        this.state = State.INITIALIZED;

        if (projectChanged) {
            new ProjectChangedEvent().fire();
        }
    }

    updateDefaultProject(project: Project) {
        this.defaultProject = project;

        if (this.state === State.NOT_INITIALIZED) {
            this.currentProject = this.defaultProject;
        }
    }

    resetToDefaultProject() {
        this.setProject(this.defaultProject);
    }

    isInitialized(): boolean {
        return this.state === State.INITIALIZED;
    }
}

enum State {
    INITIALIZED, NOT_INITIALIZED
}
