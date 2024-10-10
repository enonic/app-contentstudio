import {Project} from '../data/project/Project';
import {Projects} from './Projects';

export class ProjectsUtil {

    public static getProjectsPyParent(parentName: string | null): Project[] {
        if (parentName == null) {
            return Projects.get().getProjects().filter((project: Project) => (project.getParents() ?? []).length === 0);
        } else {
            return Projects.get().getProjects().filter((project: Project) => project.hasMainParentByName(parentName));
        }
    }

    public static hasChildren(id: string): boolean {
        return Projects.get().getProjects().some((project: Project) => project.hasMainParentByName(id));
    }
}
