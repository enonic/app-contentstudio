import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {Project} from '../../settings/data/project/Project';
import {ProjectListItem} from './ProjectListItem';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';

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

        return itemView;
    }

    setItems(items: Project[], silent?: boolean) {
        this.buildProjectLevelsMap(items);
        this.buildChildrenMap(items);
        super.setItems(this.sortProjects(items), silent);
    }

    private buildProjectLevelsMap(items: Project[]) {
        items.forEach((item: Project) => this.calcProjectLevel(item, items));
    }

    private calcProjectLevel(item: Project, items: Project[]) {
        let parentName: string = item.getParent();
        let level: number = 0;

        while (parentName) {
            const parent: Project = items.find((p: Project) => p.getName() === parentName);

            if (parent) {
                level++;
                parentName = parent.getParent();
            } else {
                parentName = null;
            }
        }

        this.projectLevel.set(item.getName(), level);
    }

    private buildChildrenMap(items: Project[]) {
        items.forEach((item: Project) => this.projectChildren.set(item.getName(), this.getDirectProjectChildren(item, items)));
    }

    private getDirectProjectChildren(project: Project, projects: Project[]): Project[] {
        return projects.filter((item: Project) => item.getParent() === project.getName());
    }

    private sortProjects(items: Project[]): Project[] {
        const result: Project[] = [];

        const defaultProject: Project = items.find((project: Project) => ProjectHelper.isDefault(project));

        if (defaultProject) {
            result.push(defaultProject);
            result.push(...this.unwrapProjectChildren(defaultProject));
        }

        const level0projects: Project[] = items.filter(
            (project: Project) => !ProjectHelper.isDefault(project) && this.projectLevel.get(project.getName()) === 0);
        level0projects.forEach((level0project: Project) => {
            result.push(level0project);
            result.push(...this.unwrapProjectChildren(level0project));
        });

        return result;
    }

    private unwrapProjectChildren(project: Project): Project[] {
        const result: Project[] = [];

        this.projectChildren.get(project.getName()).forEach((child: Project) => {
            result.push(child);
            result.push(...this.unwrapProjectChildren(child));
        });

        return result;
    }

    protected getItemId(item: Project): string {
        return item.getName();
    }
}
