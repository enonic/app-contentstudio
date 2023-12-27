import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {OptionDataLoader, OptionDataLoaderData} from '@enonic/lib-admin-ui/ui/selector/OptionDataLoader';
import {Project} from '../../../../data/project/Project';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ProjectListWithMissingRequest} from '../../../../resource/ProjectListWithMissingRequest';

export class ProjectOptionDataLoader
    extends OptionDataLoader<Project> {

    private modeChangeListener: (isTreeMode: boolean) => void;

    protected createRequest(): ProjectListWithMissingRequest {
        return new ProjectListWithMissingRequest();
    }

    filterFn(project: Project): boolean {
        const searchString: string = this.getSearchString().toLowerCase();

        if (StringHelper.isBlank(searchString)) {
            return true;
        }

        return project.getDisplayName()?.toLowerCase().indexOf(searchString) > -1 ||
               project.getDescription()?.toLowerCase().indexOf(searchString) > -1 ||
               project.getName()?.toLowerCase().indexOf(searchString) > -1;
    }

    checkReadonly(options: Project[]): Q.Promise<string[]> {
        return Q([]);
    }

    fetch(node: TreeNode<Option<Project>>): Q.Promise<Project> {
        if (this.isLoaded()) {
            return Q(this.getProjectByName(node.getData().getDisplayValue().getName()));
        }

        return this.load().then(() => {
            return this.getProjectByName(node.getData().getDisplayValue().getName());
        });
    }

    fetchChildren(parentNode: TreeNode<Option<Project>>, from: number = 0, size: number = -1): Q.Promise<OptionDataLoaderData<Project>> {
        if (this.isLoaded()) {
            return Q(this.getAndWrapDirectProjectChildren(parentNode.getData().getDisplayValue()));
        }

        return this.load().then(() => {
            return this.getAndWrapDirectProjectChildren(parentNode.getData().getDisplayValue());
        });
    }

    private getAndWrapDirectProjectChildren(project: Project) {
        const childrenProjects: Project[] = this.getDirectProjectChildren(project);
        return new OptionDataLoaderData<Project>(childrenProjects);
    }

    private getDirectProjectChildren(project: Project): Project[] {
        return this.getResults().filter((item: Project) => item.hasMainParentByName(project.getName()));
    }

    onLoadModeChanged(listener: (isTreeMode: boolean) => void) {
        if (!this.modeChangeListener) {
            this.modeChangeListener = listener;
        }

        this.modeChangeListener(true);
    }

    unLoadModeChanged(listener: (isTreeMode: boolean) => void): void {
    //
    }

    private getProjectByName(name: string): Project {
        return this.getResults().find((project: Project) => project.getName() === name);
    }

    isPartiallyLoaded(): boolean {
        return false;
    }
}
