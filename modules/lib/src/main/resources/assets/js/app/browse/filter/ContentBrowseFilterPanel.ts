import {AggregationGroupView} from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {BrowseFilterPanel} from '@enonic/lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import {TextSearchField} from '@enonic/lib-admin-ui/app/browse/filter/TextSearchField';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SearchInputValues} from '@enonic/lib-admin-ui/query/SearchInputValues';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {cn} from '@enonic/ui';
import Q from 'q';
import {
    $contentFilterState,
    deselectAllFilterBuckets,
    getFilterSelection,
    getFilterValue,
    hasFilterSet,
    hasFilterValueSet,
    resetContentFilter,
    setContentFilterSelection,
} from '../../../v6/features/store/contentFilter.store';
import {ContentId} from '../../content/ContentId';
import {ContentQuery} from '../../content/ContentQuery';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ProjectContext} from '../../project/ProjectContext';
import {Router} from '../../Router';
import {Branch} from '../../versioning/Branch';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {AggregationsQueryResult} from './AggregationsQueryResult';
import {ContentAggregation} from './ContentAggregation';
import {ContentAggregationsFetcher} from './ContentAggregationsFetcher';
import {ContentDependency} from './ContentDependency';
import {ContentExportElement} from './ContentExportElement';
import {BrowseFilterElement} from '../../../v6/features/views/browse/layout/filter/BrowseFilter';
import {BrowseDependenciesElement} from '../../../v6/features/views/browse/layout/filter/BrowseDependencies';

export class ContentBrowseFilterPanel<T extends ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus>
    extends BrowseFilterPanel<T> {

    protected aggregations: Map<string, AggregationGroupView>;
    protected displayNamesResolver: AggregationsDisplayNamesResolver;
    protected aggregationsFetcher: ContentAggregationsFetcher;
    protected searchEventListeners: ((query?: ContentQuery) => void)[] = [];

    private dependenciesSection: BrowseDependenciesElement;
    private elementsContainer: Element;
    private exportElement?: ContentExportElement;
    private targetBranch: Branch = Branch.DRAFT;
    private filterComponent: BrowseFilterElement;

    constructor() {
        super();

        this.addClass(cn('content-browse-filter-panel bg-surface-neutral text-main'));
        this.aggregationsFetcher = this.createAggregationFetcher();
        this.displayNamesResolver = new AggregationsDisplayNamesResolver();
        this.dependenciesSection = new BrowseDependenciesElement({
            onCancelClick: this.dependenciesCancelHandler.bind(this),
        });
        this.filterComponent = new BrowseFilterElement({
            bucketAggregations: [],
            filterableAggregations: this.getFilterableAggregations(),
            exportOptions: this.getExportOptions(),
        });

        super.appendChild(this.dependenciesSection);
        this.appendChild(this.filterComponent);

        this.handleEvents();
        this.getAndUpdateAggregations();
    }

    protected createAggregationFetcher(): ContentAggregationsFetcher {
        return new ContentAggregationsFetcher();
    }

    onSearchEvent(listener: (query?: ContentQuery) => void): void {
        this.searchEventListeners.push(listener);
    }

    unSearchEvent(listener: (query?: ContentQuery) => void): void {
        this.searchEventListeners = this.searchEventListeners.filter((curr: (query?: ContentQuery) => void) => {
            return curr !== listener;
        });
    }

    private notifySearchEvent(query?: ContentQuery): void {
        this.searchEventListeners.forEach((listener: (q?: ContentQuery) => void) => {
            listener(query);
        });
    }

    protected handleEvents() {
        this.onRendered(() => {
            super.appendChild(this.elementsContainer);
        });

        const debouncedSearch = AppHelper.debounce(() => {
            this.search();
        }, 300);

        const unsubscribe = $contentFilterState.listen(() => {
            debouncedSearch();
        });

        this.onRemoved(() => {
            unsubscribe();
        });

        this.handleEventsForDependenciesSection();
    }

    private handleEventsForDependenciesSection() {
        const handler = ContentServerEventsHandler.getInstance();

        handler.onContentDeleted((data: ContentServerChangeItem[]) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            const isDependencyItemDeleted = data.some((item: ContentServerChangeItem) => {
                return item.getContentId().equals(this.dependenciesSection.getDependencyId());
            });

            if (isDependencyItemDeleted) {
                this.removeDependencyItem();
            }
        });

        const permissionsUpdatedHandler = (data: T[]) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            if (ContentSummaryAndCompareStatus.isInArray(this.dependenciesSection.getDependencyId(), data)) {
                this.search();
            }
        };

        const updatedHandler = (data: T[]) => permissionsUpdatedHandler(data);

        handler.onContentUpdated(updatedHandler);
        handler.onContentPermissionsUpdated(permissionsUpdatedHandler);

        ProjectContext.get().onProjectChanged(() => {
            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }
        });
    }

    protected getFilterableAggregations(): { name: string; idsToKeepOnTop?: string[] }[] {
        const currentUserKey = AuthContext.get().getUser().getKey().toString();

        return [
            {
                name: ContentAggregation.OWNER.toString(),
                idsToKeepOnTop: [currentUserKey],
            },
            {
                name: ContentAggregation.MODIFIED_BY.toString(),
                idsToKeepOnTop: [currentUserKey],
            },
        ];
    }

    getExportOptions(): { label?: string; action: () => void } {
        this.exportElement = new ContentExportElement().setEnabled(false).setTitle(i18n('action.export')) as ContentExportElement;

        return {
            label: i18n('action.export'),
            action: () => {
                this.exportElement.handleExportClicked();
            },
        };
    }

    protected isFilterableAggregation(aggregation: BucketAggregation): boolean {
        return aggregation.getName() === ContentAggregation.OWNER.toString() || aggregation.getName() ===
               ContentAggregation.MODIFIED_BY.toString();
    }

    private removeDependencyItem() {
        this.dependenciesSection.reset();
        this.search();
        Router.get().back();
    }

    public setDependencyItem(item: ContentSummary, inbound: boolean, type?: string): void {
        this.dependenciesSection.setDependencyItem(item);
        this.dependenciesSection.setInbound(inbound);

        if (type) {
            const aggregationSelection = new AggregationSelection(ContentAggregation.CONTENT_TYPE);
            aggregationSelection.setValues([new Bucket(type, 0)]);
            setContentFilterSelection([aggregationSelection]);
        } else {
            resetContentFilter();
        }
    }

    public setTargetBranch(branch: Branch): void {
        this.targetBranch = branch;
        this.aggregationsFetcher.setTargetBranch(this.targetBranch);
    }

    public getTargetBranch(): Branch {
        return this.targetBranch;
    }

    searchItemById(id: ContentId): void {
        this.getSearchField()?.setValue(id.toString());
    }

    private getSearchField(): TextSearchField {
        const textSearchFieldParent = this.elementsContainer.getChildren().find((child: Element) => child.hasClass('search-container'));
        return textSearchFieldParent?.getChildren().find((child: Element) => child instanceof TextSearchField);
    }

    doRefresh(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets(true);
        }

        return this.getAndUpdateAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            if (aggregationsQueryResult.getMetadata().getTotalHits() > 0) {
                return;
            }

            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }

            return this.reset(true);
        });
    }

    updateAggregations(aggregations: BucketAggregation[]): void {
        this.filterComponent.updateAggregations(aggregations);
    }

    getSearchInputValues(): SearchInputValues {
        const searchInputValues: SearchInputValues = new SearchInputValues();

        searchInputValues.setAggregationSelections(getFilterSelection());
        searchInputValues.setTextSearchFieldValue(getFilterValue());

        return searchInputValues;
    }

    hasFilterSet(): boolean {
        return hasFilterSet();
    }

    hasSearchStringSet(): boolean {
        return hasFilterValueSet();
    }

    resetControls() {
        resetContentFilter();
    }

    deselectAll() {
        deselectAllFilterBuckets();
    }

    updateHitsCounter(hits: number) {
        this.filterComponent.updateHitsCounter(hits);
    }

    protected doSearch(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets();
        }

        return this.getAndUpdateAggregations().then(() => {
            this.notifySearchEvent(this.aggregationsFetcher.createContentQuery(this.getSearchInputValues()));
        });
    }

    setSelectedItems(itemsIds: string[]) {
        this.dependenciesSection.reset();
        super.setSelectedItems(itemsIds);
    }

    protected isFilteredOrConstrained() {
        return super.isFilteredOrConstrained() || (this.dependenciesSection?.isActive() ?? false);
    }

    private getAndUpdateAggregations(): Q.Promise<AggregationsQueryResult> {
        this.exportElement?.setEnabled(false);

        return this.getAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            this.updateHitsCounter(aggregationsQueryResult.getMetadata().getTotalHits());
            this.updateExportState(aggregationsQueryResult);

            return this.processAggregations(aggregationsQueryResult.getAggregations() as BucketAggregation[]).then(() => {
                    return aggregationsQueryResult;
            });
        });
    }

    private updateExportState(aggregationsQueryResult: AggregationsQueryResult): void {
        if (!this.exportElement) {
            return;
        }
        this.exportElement.setTotal(aggregationsQueryResult.getMetadata().getTotalHits());
        this.exportElement.setSearchInputValues(this.getSearchInputValues());
        this.exportElement.setDependency(this.getDependency());
        this.exportElement.setConstraintIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.exportElement.setEnabled(aggregationsQueryResult.getMetadata().getTotalHits() > 0);
    }

    private processAggregations(aggregations: BucketAggregation[]): Q.Promise<void> {
        this.sortAggregations(aggregations);

        return this.displayNamesResolver.updateAggregationsDisplayNames(aggregations).then(() => {
            this.updateAggregations(aggregations);
        });
    }

    private sortAggregations(aggregations: BucketAggregation[]): void {
        const order = Object.values(ContentAggregation).filter(value => typeof value === 'string') as string[];

        aggregations.sort(
            (a, b) => order.indexOf(a.getName()) - order.indexOf(b.getName())
        );
    }

    private getAggregations(): Q.Promise<AggregationsQueryResult> {
        this.aggregationsFetcher.setSearchInputValues(this.getSearchInputValues());
        this.aggregationsFetcher.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.aggregationsFetcher.setDependency(this.getDependency());

        return this.aggregationsFetcher.getAggregations();
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
        this.setTargetBranch(Branch.DRAFT);

        return this.getAndUpdateAggregations().then(() => {
            if (!suppressEvent) {
                this.notifySearchEvent();
            }
        });
    }

    getDependency(): ContentDependency {
        if (this.dependenciesSection?.isInbound()) {
            return {isInbound: true, dependencyId: this.dependenciesSection.getDependencyId()};
        }

        if (this.dependenciesSection?.isOutbound()) {
            return {isInbound: false, dependencyId: this.dependenciesSection.getDependencyId()};
        }

        return null;
    }

    // doing a trick to avoid changing lib-admin-ui, adding all children except export button to a wrapper
    appendChild(child: Element, lazyRender?: boolean): Element {
        if (!this.elementsContainer) {
            this.elementsContainer = new DivEl('elements-container');
        }

        return this.elementsContainer.appendChild(child, lazyRender);
    }

    private dependenciesCancelHandler(): void {
        resetContentFilter();
        this.removeDependencyItem();
        this.getAndUpdateAggregations().then(() => this.notifySearchEvent());
    }
}
