import {TreeListBox, TreeListBoxParams, TreeListElement, TreeListElementParams} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {Project} from '../../../../data/project/Project';
import {ProjectOptionDataHelper} from './ProjectOptionDataHelper';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import {ProjectOptionDataLoader} from './ProjectOptionDataLoader';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export interface ProjectsTreeListParams
    extends TreeListBoxParams {
    helper: ProjectOptionDataHelper;
    parent?: Project;
    loader?: ProjectOptionDataLoader;
}

export class ProjectsTreeList
    extends TreeListBox<Project> {

    options: ProjectsTreeListParams;

    protected lastSearchString: string;

    protected searchString: string;

    protected debounceSearch: () => void;

    constructor(params: ProjectsTreeListParams) {
        super(params);

        this.debounceSearch = AppHelper.debounce(this.doSearch.bind(this), 300);
    }

    search(searchString: string): void {
        this.searchString = searchString;

        if (this.options.loader.isLoaded()) {
            this.debounceSearch();
        }
    }

    protected doSearch(): void {
       if (!ObjectHelper.isDefined(this.lastSearchString) || !ObjectHelper.stringEquals(this.lastSearchString, this.searchString)) {
           this.lastSearchString = this.searchString;

           this.setItems(this.isFilterMode() ? this.options.helper.filter(this.searchString) : this.options.helper.getRootProjects());
       }
    }

    protected isFilterMode(): boolean {
        return !StringHelper.isBlank(this.searchString);
    }

    protected createItemView(item: Project, readOnly: boolean): ProjectTreeListElement {
        return new ProjectTreeListElement(item,
            {helper: this.options.helper, scrollParent: this.scrollParent, level: this.level, isFilterMode: this.isFilterMode()});
    }

    protected getItemId(item: Project): string {
        return item.getName();
    }

    protected handleLazyLoad(): void {
        if (this.options.parent) { // layers
            if (this.getItemCount() === 0) {
                this.addItems(this.options.helper.getProjectsPyParent(this.options.parent.getName()));
            }
        } else { // root projects
            if (!this.options.loader.isLoading() && !this.options.loader.isLoaded()) {
                this.options.loader.load().then((projects: Project[]) => {
                    this.options.helper.setProjects(projects);
                    this.doSearch();
                }).catch(DefaultErrorHandler.handle);
            }
        }
    }
}

export interface ProjectsTreeListElementParams
    extends TreeListElementParams {
    helper: ProjectOptionDataHelper;
    isFilterMode?: boolean;
}

export class ProjectTreeListElement
    extends TreeListElement<Project> {

    protected readonly options: ProjectsTreeListElementParams;

    constructor(item: Project, options: ProjectsTreeListElementParams) {
        super(item, options);
    }

    protected createChildrenListParams(): ProjectsTreeListParams {
        const params: ProjectsTreeListParams = super.createChildrenListParams() as ProjectsTreeListParams;

        params.helper = this.options.helper;
        params.parent = this.item;

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

    protected hasChildren(item: Project): boolean {
        return !this.options.isFilterMode && this.options.helper.hasChildren(item);
    }

}

