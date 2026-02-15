import {
    TreeListBox,
    type TreeListBoxParams,
    TreeListElement,
    type TreeListElementParams
} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {type Project} from '../../../../data/project/Project';
import {type ProjectOptionDataHelper} from './ProjectOptionDataHelper';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import {type ProjectOptionDataLoader} from './ProjectOptionDataLoader';

export interface ProjectsTreeListParams
    extends TreeListBoxParams<Project> {
    helper: ProjectOptionDataHelper;
    loader?: ProjectOptionDataLoader;
}

export class ProjectsTreeList
    extends TreeListBox<Project> {

    declare options: ProjectsTreeListParams;

    constructor(params: ProjectsTreeListParams) {
        super(params);
    }

    protected createItemView(item: Project, readOnly: boolean): ProjectTreeListElement {
        return new ProjectTreeListElement(item,
            {helper: this.options.helper, scrollParent: this.scrollParent, parentList: this});
    }

    protected getItemId(item: Project): string {
        return item.getName();
    }

    protected handleLazyLoad(): void {
        if (this.getItemCount() === 0) {
            this.addItems(this.options.helper.getProjectsPyParent(this.getParentItem().getName()));
        }
    }
}

export interface ProjectsTreeListElementParams
    extends TreeListElementParams<Project> {
    helper: ProjectOptionDataHelper;
    isFilterMode?: boolean;
}

export class ProjectTreeListElement
    extends TreeListElement<Project> {

    declare protected readonly options: ProjectsTreeListElementParams;

    constructor(item: Project, options: ProjectsTreeListElementParams) {
        super(item, options);
    }

    protected createChildrenListParams(): ProjectsTreeListParams {
        const params: ProjectsTreeListParams = super.createChildrenListParams() as ProjectsTreeListParams;

        params.helper = this.options.helper;

        return params;
    }

    protected createChildrenList(params?: ProjectsTreeListParams): ProjectsTreeList {
        return new ProjectsTreeList(params);
    }

    protected createItemViewer(item: Project): ProjectViewer {
        const viewer = new ProjectViewer();
        viewer.setObject(item);
        return viewer;
    }

    hasChildren(): boolean {
        return !this.options.isFilterMode && this.options.helper.hasChildren(this.item);
    }

}

