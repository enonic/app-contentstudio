import {Project} from '../data/project/Project';
import {ProjectListWithMissingRequest} from './ProjectListWithMissingRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

export class Projects {

    private static INSTANCE: Projects;

    private projects: Project[] = [];

    private projectsUpdatedListeners: (() => void)[] = [];

    private constructor() {
       //
    }

    public static get(): Projects {
        if (!Projects.INSTANCE) {
            Projects.INSTANCE = new Projects();
        }

        return Projects.INSTANCE;
    }

    public getProjects(): Project[] {
        return this.projects.slice();
    }

    public setProjects(projects: Project[]): void {
        this.projects = projects.slice();
        this.notifyProjectsUpdated();
    }

    public getProjectsPyParent(parentName: string | null): Project[] {
        if (parentName == null) {
            return this.projects.filter((project: Project) => (project.getParents() ?? []).length === 0);
        } else {
            return this.projects.filter((project: Project) => project.hasMainParentByName(parentName));
        }
    }

    public reloadProjects(): void {
        new ProjectListWithMissingRequest().sendAndParse().then((projects: Project[]) => {
            this.setProjects(projects);
        }).catch(DefaultErrorHandler.handle);
    }

    onProjectsUpdated(listener: () => void): void {
        this.projectsUpdatedListeners.push(listener);
    }

    unProjectsUpdated(listener: () => void): void {
        this.projectsUpdatedListeners = this.projectsUpdatedListeners.filter(l => l !== listener);
    }

    notifyProjectsUpdated(): void {
        this.projectsUpdatedListeners.forEach(listener => listener());
    }
}
