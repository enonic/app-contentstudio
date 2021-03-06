import {Project} from '../settings/data/project/Project';

export class ProjectContext {

    public static LOCAL_STORAGE_KEY: string = 'contentstudio:defaultProject';

    private static INSTANCE: ProjectContext;

    private currentProject: Project;

    private state: State = State.NOT_INITIALIZED;

    private projectChangedEventListeners: { (project: Project): void }[] = [];

    private noProjectsAvailableListeners: { (): void }[] = [];

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
        localStorage.setItem(ProjectContext.LOCAL_STORAGE_KEY, project.getName());
        this.notifyProjectChanged();
    }

    setNotAvailable() {
        this.currentProject = null;
        this.state = State.NOT_AVAILABLE;
        localStorage.removeItem(ProjectContext.LOCAL_STORAGE_KEY);
        this.notifyNoProjectsAvailable();
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

    onNoProjectsAvailable(handler: () => void) {
        this.noProjectsAvailableListeners.push(handler);
    }

    unNoProjectsAvailable(handler: (project: Project) => void) {
        this.noProjectsAvailableListeners = this.noProjectsAvailableListeners.filter((curr: () => void) => {
            return handler !== curr;
        });
    }

    private notifyNoProjectsAvailable() {
        this.noProjectsAvailableListeners.forEach((handler: () => void) => {
            handler();
        });
    }
}

enum State {
    INITIALIZED, NOT_INITIALIZED, NOT_AVAILABLE
}
