import {Project} from '../data/project/Project';

export class Projects {

    private static INSTANCE: Projects;

    private projects: Project[] = [];

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
    }

    public getProjectsPyParent(parentName: string | null): Project[] {
        if (parentName == null) {
            return this.projects.filter((project: Project) => (project.getParents() ?? []).length === 0);
        } else {
            return this.projects.filter((project: Project) => project.hasMainParentByName(parentName));
        }
    }
}
