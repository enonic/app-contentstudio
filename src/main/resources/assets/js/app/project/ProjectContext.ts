import {ProjectChangedEvent} from './ProjectChangedEvent';
import {Project} from '../settings/data/project/Project';

export class ProjectContext {

    private static INSTANCE: ProjectContext;

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
        this.currentProject = project;
        this.state = State.INITIALIZED;
        new ProjectChangedEvent().fire();
    }

    isInitialized(): boolean {
        return this.state === State.INITIALIZED;
    }
}

enum State {
    INITIALIZED, NOT_INITIALIZED
}
