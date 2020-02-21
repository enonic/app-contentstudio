import {ProjectChangedEvent} from './ProjectChangedEvent';

export class ProjectContext {

    private static INSTANCE: ProjectContext;

    public static DEFAULT_PROJECT: string = 'default';

    private project: string;

    private state: State = State.NOT_INITIALIZED;

    private constructor() {
        this.project = ProjectContext.DEFAULT_PROJECT;
    }

    static get(): ProjectContext {
        if (!ProjectContext.INSTANCE) {
            ProjectContext.INSTANCE = new ProjectContext();
        }

        return ProjectContext.INSTANCE;
    }

    getProject(): string {
        return this.project;
    }

    setProject(project: string) {
        this.project = project;
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
