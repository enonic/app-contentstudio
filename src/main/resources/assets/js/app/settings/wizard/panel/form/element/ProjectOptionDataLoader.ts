import {Option} from 'lib-admin-ui/ui/selector/Option';
import {OptionDataLoader, OptionDataLoaderData} from 'lib-admin-ui/ui/selector/OptionDataLoader';
import {Project} from '../../../../data/project/Project';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import * as Q from 'q';
import {ProjectListRequest} from '../../../../resource/ProjectListRequest';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';

export class ProjectOptionDataLoader
    extends OptionDataLoader<Project> {

    protected createRequest(): ProjectListRequest {
        return new ProjectListRequest();
    }

    filterFn(project: Project): boolean {
        const searchString: string = this.getSearchString();

        if (StringHelper.isBlank(searchString)) {
            return true;
        }

        return project.getDisplayName().toLowerCase().indexOf(searchString) !== -1;
    }

    checkReadonly(options: Project[]): Q.Promise<string[]> {
        return Q([]);
    }

    fetch(node: TreeNode<Option<Project>>): Q.Promise<Project> {
        if (this.isLoaded()) {
            return Q(this.getProjectByName(node.getData().displayValue.getName()));
        }

        return this.load().then(() => {
            return this.getProjectByName(node.getData().displayValue.getName());
        });
    }

    fetchChildren(parentNode: TreeNode<Option<Project>>, from: number = 0, size: number = -1): Q.Promise<OptionDataLoaderData<Project>> {
        if (this.isLoaded()) {
            return Q(this.getAndWrapDirectProjectChildren(parentNode.getData().displayValue));
        }

        return this.load().then(() => {
            return this.getAndWrapDirectProjectChildren(parentNode.getData().displayValue);
        });
    }

    private getAndWrapDirectProjectChildren(project: Project) {
        const childrenProjects: Project[] = this.getDirectProjectChildren(project);
        return new OptionDataLoaderData<Project>(childrenProjects);
    }

    private getDirectProjectChildren(project: Project): Project[] {
        return this.getResults().filter((item: Project) => item.getParent() === project.getName());
    }

    onLoadModeChanged(listener: (isTreeMode: boolean) => void) {
        listener(true);
    }

    unLoadModeChanged(listener: (isTreeMode: boolean) => void): any {
    //
    }

    private getProjectByName(name: string): Project {
        return this.getResults().find((project: Project) => project.getName() === name);
    }

    isPartiallyLoaded(): boolean {
        return false;
    }
}
