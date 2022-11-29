import {OptionDataHelper} from '@enonic/lib-admin-ui/ui/selector/OptionDataHelper';
import {Project} from '../../../../data/project/Project';

export class ProjectOptionDataHelper
    implements OptionDataHelper<Project> {

    private projects: Project[] = [];

    setProjects(projects: Project[]) {
        this.projects = projects;
    }

    getDataId(data: Project): string {
        return data.getName();
    }

    hasChildren(data: Project): boolean {
        return this.projects.some((project: Project) => project.hasParentByName(data.getName()));
    }

    isDescendingPath(childOption: Project, parentOption: Project): any {
        //
    }

    isExpandable(data: Project): boolean {
        return this.projects.some((project: Project) => project.hasParentByName(data.getName()));
    }

    isSelectable(data: Project): boolean {
        return true;
    }
}
