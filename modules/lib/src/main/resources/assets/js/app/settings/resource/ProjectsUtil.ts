import {Project} from '../data/project/Project';
import {$projects} from '../../../v6/features/store/projects.store';

export class ProjectsUtil {

    public static getProjectsPyParent(parentName: string | null): Project[] {
        const projects = $projects.get().projects;
        if (parentName == null) {
            return projects.filter((project: Project) => (project.getParents() ?? []).length === 0) as Project[];
        } else {
            return projects.filter((project: Project) => project.hasMainParentByName(parentName)) as Project[];
        }
    }

    public static hasChildren(id: string): boolean {
        return $projects.get().projects.some((project: Project) => project.hasMainParentByName(id));
    }
}
