import {type Project} from '../settings/data/project/Project';
import {Store} from '@enonic/lib-admin-ui/store/Store';

export class ProjectContext {

    public static LOCAL_STORAGE_KEY: string = 'contentstudio:defaultProject';

    private currentProject: Project;

    private state: State = State.NOT_INITIALIZED;

    private projectChangedEventListeners: ((project: Project) => void)[] = [];

    private noProjectsAvailableListeners: (() => void)[] = [];

    private constructor() {
    //
    }

    static get(): ProjectContext {
        let instance: ProjectContext = Store.instance().get('projectContext');

        if (instance == null && document.body) {
            instance = new ProjectContext();
            Store.instance().set('projectContext', instance);
        }

        return instance;
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

    whenInitialized(callback: () => void) {
        if (this.isInitialized()) {
            callback();
        } else {
            const projectInitializedHandler = () => {
                callback();
                this.unProjectChanged(projectInitializedHandler);
            };

            this.onProjectChanged(projectInitializedHandler);
        }
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
