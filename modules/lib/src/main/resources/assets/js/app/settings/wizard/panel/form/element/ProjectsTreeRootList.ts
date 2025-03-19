import {ProjectsTreeList, ProjectsTreeListParams, ProjectTreeListElement} from './ProjectsTreeList';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Project} from '../../../../data/project/Project';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

export class ProjectsTreeRootList extends ProjectsTreeList {

    protected lastSearchString: string;

    protected searchString: string;

    protected debounceSearch: () => void;

    constructor(params: ProjectsTreeListParams) {
        super(params);

        this.debounceSearch = AppHelper.debounce(this.doSearch.bind(this), 300);
    }

    protected initListeners(): void {
        super.initListeners();

        this.options.loader.whenLoaded((projects: Project[]) => {
            this.options.helper.setProjects(projects);
            this.search(this.searchString);
        });
    }

    protected createItemView(item: Project, readOnly: boolean): ProjectTreeListElement {
        return new ProjectTreeListElement(item,
            {helper: this.options.helper, scrollParent: this.scrollParent, isFilterMode: this.isFilterMode()});
    }

    protected handleLazyLoad(): void {
        if (this.isFilterMode() || this.getItemCount() > 0) {
            return;
        }

        if (!this.options.loader.isLoaded()) {
            if (!this.options.loader.isLoading()) {
                this.options.loader.load().catch(DefaultErrorHandler.handle);
            }

            return;
        }

        this.debounceSearch();
    }

    search(searchString: string): void {
        this.searchString = searchString;

        if (!this.options.loader.isLoaded()) {
            if (!this.options.loader.isLoading()) {
                this.options.loader.load().catch(DefaultErrorHandler.handle);
            }

            return;
        }

        this.debounceSearch();
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
}
