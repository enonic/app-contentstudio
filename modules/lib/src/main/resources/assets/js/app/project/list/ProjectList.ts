import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {Project} from '../../settings/data/project/Project';
import {ProjectListItem} from './ProjectListItem';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';
import {UrlHelper} from '../../util/UrlHelper';

export class ProjectList
    extends ListBox<Project> {

    private projectLevel: Map<string, number> = new Map<string, number>();
    private projectChildren: Map<string, Project[]> = new Map<string, Project[]>();

    constructor() {
        super('project-list-items');
    }

    protected createItemView(item: Project, readOnly: boolean): ProjectListItem {
        const itemView: ProjectListItem = new ProjectListItem(item);
        itemView.addClass(`level-${this.projectLevel.get(item.getName())}`);

        const url: string = UrlHelper.createContentBrowseUrl(itemView.getProject().getName());
        itemView.setUrl(url);

        return itemView;
    }

    setItems(items: Project[], silent?: boolean) {
        this.projectLevel = new Map<string, number>();
        this.projectChildren = new Map<string, Project[]>();
        this.buildProjectLevelsMap(items);
        this.buildChildrenMap(items);
        super.setItems(this.sortProjects(items), silent);
    }

    private buildProjectLevelsMap(items: Project[]) {
        items.forEach((item: Project) => this.calcProjectLevel(item, items));
    }

    private calcProjectLevel(item: Project, items: Project[]): void {
        let parentNames = item.getParents();
        let level: number = 0;

        while (parentNames) {
            const parent: Project = items.find((p: Project) => parentNames.indexOf(p.getName()) >= 0);

            if (parent) {
                level++;
                parentNames = parent.getParents();
            } else {
                parentNames = null;
            }
        }

        this.projectLevel.set(item.getName(), level);
    }

    private buildChildrenMap(items: Project[]) {
        items.forEach((item: Project) => this.projectChildren.set(item.getName(), this.getDirectProjectChildren(item, items)));
    }

    private getDirectProjectChildren(project: Project, projects: Project[]): Project[] {
        return projects.filter((item: Project) => item.hasMainParentByName(project.getName()));
    }

    private sortProjects(items: Project[]): Project[] {
        const result: Project[] = [];

        items.sort(this.putDefaultFirstSorter);

        this.getProjectsWithoutParent(items).forEach((level0project: Project) => {
            result.push(...this.unwrapProjectWithChildren(level0project));
        });

        return result;
    }

    private getProjectsWithoutParent(items: Project[]): Project[] {
        return items.filter((project: Project) => this.projectLevel.get(project.getName()) === 0);
    }

    private unwrapProjectWithChildren(project: Project): Project[] {
        const result: Project[] = [project];

        this.projectChildren.get(project.getName()).forEach((child: Project) => {
            result.push(...this.unwrapProjectWithChildren(child));
        });

        return result;
    }

    protected getItemId(item: Project): string {
        return item.getName();
    }

    private putDefaultFirstSorter(a: Project, b: Project): number {
        if (ProjectHelper.isDefault(a)) {
            return -1;
        }

        if (ProjectHelper.isDefault(b)) {
            return 1;
        }

        return 0;
    }
}
