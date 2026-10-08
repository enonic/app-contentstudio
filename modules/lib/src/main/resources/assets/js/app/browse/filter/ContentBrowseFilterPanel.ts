import type { AggregationGroupView } from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import { AggregationSelection } from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import { Bucket } from '@enonic/lib-admin-ui/aggregation/Bucket';
import type { BucketAggregation } from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import { BrowseFilterPanel } from '@enonic/lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import { TextSearchField } from '@enonic/lib-admin-ui/app/browse/filter/TextSearchField';
import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import type { Element } from '@enonic/lib-admin-ui/dom/Element';
import { SearchInputValues } from '@enonic/lib-admin-ui/query/SearchInputValues';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { cn } from '@enonic/ui';
import type Q from 'q';
import {
    $contentFilterState,
    $isDependencySearchPending,
    deselectAllFilterBuckets,
    getFilterSelection,
    getFilterValue,
    hasFilterSet,
    hasFilterValueSet,
    resetContentFilter,
    setContentFilterSelection,
} from '../../../v6/features/search/model/contentFilter.store';
import { onActiveProjectChanged } from '../../../v6/entities/project/activeProject.store';
import { BrowseDependenciesElement } from '../../../v6/features/search/ui/BrowseDependencies';
import { BrowseFilterElement } from '../../../v6/features/search/ui/BrowseFilter';
import type { ContentId } from '../../content/ContentId';
import type { ContentQuery } from '../../content/ContentQuery';
import type { ContentSummary } from '../../content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../../content/ContentSummaryAndCompareStatus';
import type { ContentServerChangeItem } from '../../event/ContentServerChangeItem';
import { ContentServerEventsHandler } from '../../event/ContentServerEventsHandler';
import { Router } from '../../Router';
import { Branch } from '../../versioning/Branch';
import { AggregationsDisplayNamesResolver } from './AggregationsDisplayNamesResolver';
import type { AggregationsQueryResult } from './AggregationsQueryResult';
import { ContentAggregation } from './ContentAggregation';
import { ContentAggregationsFetcher } from './ContentAggregationsFetcher';
import type { ContentDependency } from './ContentDependency';
import { ContentExportElement } from './ContentExportElement';

export class ContentBrowseFilterPanel<
    T extends ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus,
> extends BrowseFilterPanel<T> {
    protected aggregations: Map<string, AggregationGroupView>;
    protected displayNamesResolver: AggregationsDisplayNamesResolver;
    protected aggregationsFetcher: ContentAggregationsFetcher;
    protected searchEventListeners: ((query?: ContentQuery, dependencyRequestId?: number) => void)[] = [];
    private dependencyRemovedListeners: (() => void)[] = [];
    private dependencyRequestId = 0;
    private aggregationsRequestId = 0;
    private searchRequestId = 0;

    private dependenciesSection: BrowseDependenciesElement;
    private mobileDependenciesSection: BrowseDependenciesElement;
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
        this.mobileDependenciesSection = new BrowseDependenciesElement({
            onCancelClick: this.dependenciesCancelHandler.bind(this),
            mobileOnly: true,
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

    onSearchEvent(listener: (query?: ContentQuery, dependencyRequestId?: number) => void): void {
        this.searchEventListeners.push(listener);
    }

    unSearchEvent(listener: (query?: ContentQuery, dependencyRequestId?: number) => void): void {
        this.searchEventListeners = this.searchEventListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onDependencyRemoved(listener: () => void): void {
        this.dependencyRemovedListeners.push(listener);
    }

    getDependencyRequestId(): number {
        return this.dependencyRequestId;
    }

    clearDependencyRequest(): void {
        this.dependencyRequestId++;
        this.dependenciesSection.reset();
        this.mobileDependenciesSection.reset();
    }

    cancelDependencyRequest(): void {
        this.clearDependencyRequest();
        this.setTargetBranch(Branch.DRAFT);
        resetContentFilter();
    }

    private notifySearchEvent(query?: ContentQuery, dependencyRequestId?: number): void {
        this.searchEventListeners.forEach((listener) => {
            listener(query, dependencyRequestId);
        });
    }

    protected handleEvents() {
        this.onRendered(() => {
            super.appendChild(this.elementsContainer);
        });

        const debouncedSearch = AppHelper.debounce(() => {
            if (this.isRendered()) {
                this.search().catch(DefaultErrorHandler.handle);
            } else if ($isDependencySearchPending.get()) {
                const dependencyRequestId = this.dependencyRequestId;
                this.whenRendered(() => {
                    if (dependencyRequestId === this.dependencyRequestId) {
                        this.search().catch(DefaultErrorHandler.handle);
                    }
                });
            }
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

        const permissionsUpdatedHandler = (contentIds: ContentId[]) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            if (contentIds.some((id: ContentId) => id.equals(this.dependenciesSection.getDependencyId()))) {
                this.search();
            }
        };

        const updatedHandler = (data: T[]) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            if (ContentSummaryAndCompareStatus.isInArray(this.dependenciesSection.getDependencyId(), data)) {
                this.search();
            }
        };

        handler.onContentUpdated(updatedHandler);
        handler.onContentPermissionsUpdated(permissionsUpdatedHandler);

        onActiveProjectChanged(() => {
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
        this.exportElement = new ContentExportElement()
            .setEnabled(false)
            .setTitle(i18n('action.export')) as ContentExportElement;

        return {
            label: i18n('action.export'),
            action: () => {
                this.exportElement.handleExportClicked();
            },
        };
    }

    protected isFilterableAggregation(aggregation: BucketAggregation): boolean {
        return (
            aggregation.getName() === ContentAggregation.OWNER.toString() ||
            aggregation.getName() === ContentAggregation.MODIFIED_BY.toString()
        );
    }

    private removeDependencyItem() {
        this.clearDependencyRequest();
        this.dependencyRemovedListeners.forEach((listener) => listener());
        this.search();
        Router.get().back();
    }

    public setDependencyItem(item: ContentSummary, inbound: boolean, type?: string): void {
        this.dependencyRequestId++;
        this.dependenciesSection.setDependencyItem(item);
        this.dependenciesSection.setInbound(inbound);
        this.mobileDependenciesSection.setDependencyItem(item);
        this.mobileDependenciesSection.setInbound(inbound);

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
        const textSearchFieldParent = this.elementsContainer
            .getChildren()
            .find((child: Element) => child.hasClass('search-container'));
        return textSearchFieldParent?.getChildren().find((child: Element) => child instanceof TextSearchField);
    }

    doRefresh(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets(true);
        }

        const dependencyRequestId = this.dependencyRequestId;
        const request = this.getAndUpdateAggregations();
        const aggregationsRequestId = this.aggregationsRequestId;
        return request.then((aggregationsQueryResult: AggregationsQueryResult) => {
            if (
                dependencyRequestId !== this.dependencyRequestId ||
                aggregationsRequestId !== this.aggregationsRequestId
            ) {
                return;
            }
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
        const dependencyRequestId = this.dependencyRequestId;
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets();
        }

        const searchRequestId = ++this.searchRequestId;
        const request = this.getAndUpdateAggregations();
        return request
            .then(() => {
                if (dependencyRequestId !== this.dependencyRequestId || searchRequestId !== this.searchRequestId) {
                    return;
                }
                this.notifySearchEvent(
                    this.aggregationsFetcher.createContentQuery(this.getSearchInputValues()),
                    dependencyRequestId,
                );
            })
            .catch((error) => {
                if (
                    dependencyRequestId === this.dependencyRequestId &&
                    searchRequestId === this.searchRequestId &&
                    $isDependencySearchPending.get()
                ) {
                    this.notifySearchEvent(undefined, dependencyRequestId);
                }
                throw error;
            });
    }

    setSelectedItems(itemsIds: string[]) {
        this.clearDependencyRequest();
        this.dependencyRemovedListeners.forEach((listener) => listener());
        super.setSelectedItems(itemsIds);
    }

    public getMobileDependenciesSection(): BrowseDependenciesElement {
        return this.mobileDependenciesSection;
    }

    protected isFilteredOrConstrained() {
        return super.isFilteredOrConstrained() || (this.dependenciesSection?.isActive() ?? false);
    }

    private getAndUpdateAggregations(): Q.Promise<AggregationsQueryResult> {
        const dependencyRequestId = this.dependencyRequestId;
        const aggregationsRequestId = ++this.aggregationsRequestId;
        const isCurrent = () =>
            dependencyRequestId === this.dependencyRequestId && aggregationsRequestId === this.aggregationsRequestId;
        this.exportElement?.setEnabled(false);

        return this.getAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            if (!isCurrent()) {
                return aggregationsQueryResult;
            }

            this.updateHitsCounter(aggregationsQueryResult.getMetadata().getTotalHits());
            this.updateExportState(aggregationsQueryResult);

            return this.processAggregations(
                aggregationsQueryResult.getAggregations() as BucketAggregation[],
                isCurrent,
            ).then(() => {
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

    private processAggregations(aggregations: BucketAggregation[], isCurrent: () => boolean): Q.Promise<void> {
        this.sortAggregations(aggregations);

        return this.displayNamesResolver.updateAggregationsDisplayNames(aggregations).then(() => {
            if (isCurrent()) {
                this.updateAggregations(aggregations);
            }
        });
    }

    protected sortAggregations(aggregations: BucketAggregation[]): void {
        const order = Object.values(ContentAggregation).filter((value) => typeof value === 'string') as string[];

        aggregations.sort((a, b) => order.indexOf(a.getName()) - order.indexOf(b.getName()));
    }

    private getAggregations(): Q.Promise<AggregationsQueryResult> {
        this.aggregationsFetcher.setSearchInputValues(this.getSearchInputValues());
        this.aggregationsFetcher.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.aggregationsFetcher.setDependency(this.getDependency());

        return this.aggregationsFetcher.getAggregations();
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
        const dependencyRequestId = this.dependencyRequestId;
        const searchRequestId = ++this.searchRequestId;
        this.setTargetBranch(Branch.DRAFT);

        const request = this.getAndUpdateAggregations();
        return request.then(() => {
            if (
                !suppressEvent &&
                dependencyRequestId === this.dependencyRequestId &&
                searchRequestId === this.searchRequestId
            ) {
                this.notifySearchEvent(undefined, dependencyRequestId);
            }
        });
    }

    getDependency(): ContentDependency {
        if (this.dependenciesSection?.isInbound()) {
            return { isInbound: true, dependencyId: this.dependenciesSection.getDependencyId() };
        }

        if (this.dependenciesSection?.isOutbound()) {
            return { isInbound: false, dependencyId: this.dependenciesSection.getDependencyId() };
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
        const dependencyRequestId = this.dependencyRequestId;
        const request = this.getAndUpdateAggregations();
        const aggregationsRequestId = this.aggregationsRequestId;
        request.then(() => {
            if (
                dependencyRequestId === this.dependencyRequestId &&
                aggregationsRequestId === this.aggregationsRequestId
            ) {
                this.notifySearchEvent();
            }
        });
    }
}
