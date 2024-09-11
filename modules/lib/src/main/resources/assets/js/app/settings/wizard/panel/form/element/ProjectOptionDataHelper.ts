import {OptionDataHelper} from '@enonic/lib-admin-ui/ui/selector/OptionDataHelper';
import {Project} from '../../../../data/project/Project';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class ProjectOptionDataHelper
    implements OptionDataHelper<Project> {

    private projects: Project[] = [];

    private searchString: string;

    private readonly filterFunc: (project: Project) => boolean;

    constructor() {
        this.filterFunc = this.doFilter.bind(this);
    }

    setProjects(projects: Project[]): void {
        this.projects = projects;
    }

    getDataId(data: Project): string {
        return data.getName();
    }

    hasChildren(data: Project): boolean {
        return this.projects.some((project: Project) => project.hasParentByName(data.getName()));
    }

    isDescendingPath(childOption: Project, parentOption: Project): boolean {
        return false;
    }

    isExpandable(data: Project): boolean {
        return this.projects.some((project: Project) => project.hasMainParentByName(data.getName()));
    }

    isSelectable(data: Project): boolean {
        return true;
    }

    getProjectsPyParent(parentName: string): Project[] {
        return this.projects.filter((project: Project) => project.getParents().some((p) => p === parentName));
    }

    getRootProjects(): Project[] {
        return this.projects.filter((project: Project) => project.getParents().length === 0);
    }

    filter(searchString: string): Project[] {
        this.searchString = searchString?.toLowerCase();
        return this.projects.slice().filter(this.filterFunc);
    }

    private doFilter(project: Project): boolean {
        if (StringHelper.isBlank(this.searchString)) {
            return true;
        }

        return project.getDisplayName()?.toLowerCase().indexOf(this.searchString) > -1 ||
               project.getDescription()?.toLowerCase().indexOf(this.searchString) > -1 ||
               project.getName()?.toLowerCase().indexOf(this.searchString) > -1;
    }
}
