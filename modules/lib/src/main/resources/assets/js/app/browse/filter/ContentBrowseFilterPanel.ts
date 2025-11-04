import {SearchInputValues} from '@enonic/lib-admin-ui/query/SearchInputValues';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Router} from '../../Router';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentQuery} from '../../content/ContentQuery';
import {AggregationGroupView} from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import {BrowseFilterPanel} from '@enonic/lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {BucketAggregationView} from '@enonic/lib-admin-ui/aggregation/BucketAggregationView';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {ContentBrowseFilterComponent} from '../../ui2/filter/ContentBrowseFilterComponent';
import {DependenciesSection} from './DependenciesSection';
import {ContentAggregation} from './ContentAggregation';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {ContentAggregationsFetcher} from './ContentAggregationsFetcher';
import {AggregationsQueryResult} from './AggregationsQueryResult';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentExportElement} from './ContentExportElement';
import {ContentDependency} from './ContentDependency';
import {TextSearchField} from '@enonic/lib-admin-ui/app/browse/filter/TextSearchField';
import {Branch} from '../../versioning/Branch';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {cn} from '@enonic/ui';

export class ContentBrowseFilterPanel<T extends ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus>
    extends BrowseFilterPanel<T> {

    protected aggregations: Map<string, AggregationGroupView>;
    protected displayNamesResolver: AggregationsDisplayNamesResolver;
    protected aggregationsFetcher: ContentAggregationsFetcher;
    protected searchEventListeners: ((query?: ContentQuery) => void)[] = [];

    private dependenciesSection: DependenciesSection;
    private elementsContainer: Element;
    private exportElement?: ContentExportElement;
    private targetBranch: Branch = Branch.DRAFT;
    private filterComponent: ContentBrowseFilterComponent;

    constructor() {
        super();

        this.addClass(cn('content-browse-filter-panel bg-surface-neutral text-main'));
        this.aggregationsFetcher = this.createAggregationFetcher();
        this.displayNamesResolver = new AggregationsDisplayNamesResolver();
        this.dependenciesSection = new DependenciesSection();
        this.initElementsAndListeners();

        this.filterComponent = new ContentBrowseFilterComponent({
            bucketAggregations: [],
            onChange: () => {
                this.search();
            },
            onSelectionChange: () => {
                this.search();
            },
            filterableAggregations: this.getFilterableAggregations(),
            exportOptions: this.getExportOptions(),
        });

        this.appendChild(this.filterComponent);

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

    protected initElementsAndListeners() {
        if (this.isExportAllowed()) {
            this.exportElement = new ContentExportElement().setEnabled(false).setTitle(i18n('action.export')) as ContentExportElement;
        }

        this.handleEvents();
    }

    protected handleEvents() {
        this.onRendered(() => {
            super.appendChild(this.elementsContainer);
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
                idsToKeepOnTop: [currentUserKey]
            },
            {
                name: ContentAggregation.MODIFIED_BY.toString(),
                idsToKeepOnTop: [currentUserKey]
            },
        ];
    }

    getExportOptions(): { label?: string; action: () => void } {
        this.exportElement = new ContentExportElement().setEnabled(false).setTitle(i18n('action.export')) as ContentExportElement;

        return {
            label: i18n('action.export'),
            action: () => {
                this.exportElement.handleExportClicked();
            }
        };
    }

    protected isFilterableAggregation(aggregation: BucketAggregation): boolean {
        return aggregation.getName() === ContentAggregation.OWNER.toString() || aggregation.getName() ===
               ContentAggregation.MODIFIED_BY.toString();
    }

    protected isExportAllowed(): boolean {
        // add more checks here if needed
        return true;
    }

    private removeDependencyItem() {
        this.dependenciesSection.reset();
        this.search();
        Router.get().back();
    }

    public setDependencyItem(item: ContentSummary, inbound: boolean, type?: string): void {
        this.dependenciesSection.setInbound(inbound);

        if (type) {
            this.selectBucketByTypeOnLoad(type);
        }

        this.dependenciesSection.setDependencyItem(item);
    }

    public setTargetBranch(branch: Branch): void {
        this.targetBranch = branch;
        this.aggregationsFetcher.setTargetBranch(this.targetBranch);
    }

    public getTargetBranch(): Branch {
        return this.targetBranch;
    }

    private selectBucketByTypeOnLoad(type: string): void {
        const handler = () => { // waiting for aggregations views added
            this.unSearchEvent(handler);
            this.selectContentTypeBucket(type);
        };

        this.onSearchEvent(handler);
    }

    private selectContentTypeBucket(key: string): void {
        this.filterComponent.selectBucketViewByKey(ContentAggregation.CONTENT_TYPE, key);
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

        searchInputValues.setAggregationSelections(this.filterComponent.getSelectedBuckets());
        searchInputValues.setTextSearchFieldValue(this.filterComponent.getValue());

        return searchInputValues;
    }

    hasFilterSet(): boolean {
        return this.filterComponent.hasSelectedBuckets() || this.hasSearchStringSet();
    }

    hasSearchStringSet(): boolean {
        return !StringHelper.isBlank(this.filterComponent.getValue());
    }

    resetControls() {
        this.filterComponent.reset();
    }

    deselectAll() {
        this.filterComponent.deselectAll();
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
}
