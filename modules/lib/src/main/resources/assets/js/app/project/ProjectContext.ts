import {Project} from '../settings/data/project/Project';

export class ProjectContext {

    private static INSTANCE: ProjectContext;

    private currentProject: Project;

    private state: State = State.NOT_INITIALIZED;

    private projectChangedEventListeners: { (project: Project): void }[] = [];

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
        this.notifyProjectChanged();
    }

    isInitialized(): boolean {
        return this.state === State.INITIALIZED;
    }

    onProjectChanged(handler: (project: Project) => void) {
        this.projectChangedEventListeners.push(handler);
    }

    unProjectChanged(handler: (project: Project) => void) {
        this.projectChangedEventListeners = this.projectChangedEventListeners.filter((curr) => {
            return handler !== curr;
        });
    }

    private notifyProjectChanged() {
        this.projectChangedEventListeners.forEach((handler) => {
            handler(this.currentProject);
        });
    }
}

enum State {
    INITIALIZED, NOT_INITIALIZED
}
