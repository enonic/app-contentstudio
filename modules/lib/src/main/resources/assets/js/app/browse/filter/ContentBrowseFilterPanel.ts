import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Router} from '../../Router';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentQuery} from '../../content/ContentQuery';
import {AggregationGroupView} from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import {Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';
import {BrowseFilterPanel} from '@enonic/lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregationView} from '@enonic/lib-admin-ui/aggregation/BucketAggregationView';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {DependenciesSection} from './DependenciesSection';
import {ContentAggregation} from './ContentAggregation';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {ContentAggregationsFetcher} from './ContentAggregationsFetcher';
import {FilterableAggregationGroupView} from './FilterableAggregationGroupView';
import {AggregationsQueryResult} from './AggregationsQueryResult';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentExportElement} from './ContentExportElement';
import {ContentDependency} from './ContentDependency';
import {TextSearchField} from '@enonic/lib-admin-ui/app/browse/filter/TextSearchField';
import {Branch} from '../../versioning/Branch';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';

export class ContentBrowseFilterPanel
    extends BrowseFilterPanel<ContentSummaryAndCompareStatus> {

    private aggregations: Map<string, AggregationGroupView>;
    private displayNamesResolver: AggregationsDisplayNamesResolver;
    private aggregationsFetcher: ContentAggregationsFetcher;
    private searchEventListeners: ((query?: ContentQuery) => void)[] = [];

    private dependenciesSection: DependenciesSection;
    private elementsContainer: Element;
    private exportElement?: ContentExportElement;
    private targetBranch: Branch = Branch.DRAFT;

    constructor() {
        super();

        this.addClass('content-browse-filter-panel');
        this.aggregationsFetcher = new ContentAggregationsFetcher();
        this.initElementsAndListeners();
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

    private initElementsAndListeners() {
        this.initAggregationGroupView();

        if (this.isExportAllowed()) {
            this.exportElement = new ContentExportElement().setEnabled(false).setTitle(i18n('action.export')) as ContentExportElement;
        }

        this.handleEvents();
    }

    private handleEvents() {
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

        const permissionsUpdatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            if (ContentSummaryAndCompareStatus.isInArray(this.dependenciesSection.getDependencyId(), data)) {
                this.search();
            }
        };

        const updatedHandler = (data: ContentSummaryAndCompareStatus[]) => permissionsUpdatedHandler(data);

        handler.onContentUpdated(updatedHandler);
        handler.onContentPermissionsUpdated(permissionsUpdatedHandler);

        ProjectContext.get().onProjectChanged(() => {
            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }
        });

        this.onRendered(() => {
            super.appendChild(this.elementsContainer);
        });
    }

    protected createHitsCountContainer(): DivEl {
        const hitsCounterAndClearButtonWrapper = super.createHitsCountContainer();
        if (this.exportElement) {
            hitsCounterAndClearButtonWrapper.appendChild(this.exportElement);
        }

        return hitsCounterAndClearButtonWrapper;
    }

    protected getGroupViews(): AggregationGroupView[] {
        this.aggregations = new Map<string, AggregationGroupView>();

        for (let aggrEnum in ContentAggregation) {
            const name: string = ContentAggregation[aggrEnum];
            this.aggregations.set(name, this.createGroupView(name));
        }

        return Array.from(this.aggregations.values());
    }

    private createGroupView(name: string): AggregationGroupView {
        if (name === ContentAggregation.OWNER.toString() || name === ContentAggregation.MODIFIED_BY.toString()) {
            return new FilterableAggregationGroupView(name, i18n(`field.${name}`));
        }

        return new AggregationGroupView(name, i18n(`field.${name}`));
    }

    protected appendExtraSections() {
        super.appendExtraSections();
        this.dependenciesSection = new DependenciesSection(this.removeDependencyItem.bind(this));
        this.appendChild(this.dependenciesSection);
    }

    private isExportAllowed(): boolean {
        // add more checks here if needed
        return true;
    }

    private removeDependencyItem() {
        this.dependenciesSection.reset();
        this.resetConstraints();
        this.search();
        Router.get().back();
    }

    public setDependencyItem(item: ContentSummary, inbound: boolean, type?: string): void {
        this.dependenciesSection.setInbound(inbound);

        if (type) {
            this.selectBucketByTypeOnLoad(type);
        }

        this.setConstraintItems(this.dependenciesSection, [item.getId()]);
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
        (this.aggregations.get(ContentAggregation.CONTENT_TYPE).getAggregationViews()[0] as BucketAggregationView)?.selectBucketViewByKey(key);
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
                return Q.resolve();
            }

            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }

            return this.reset(true);
        });
    }

    protected doSearch(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets();
        }

        return this.getAndUpdateAggregations().then(() => {
            this.notifySearchEvent(this.aggregationsFetcher.createContentQuery(this.getSearchInputValues()));
            return Q.resolve();
        });
    }

    setSelectedItems(itemsIds: string[]) {
        this.dependenciesSection.reset();
        super.setSelectedItems(itemsIds);
    }

    protected isFilteredOrConstrained() {
        return super.isFilteredOrConstrained() || this.dependenciesSection.isActive();
    }

    private getAndUpdateAggregations(): Q.Promise<AggregationsQueryResult> {
        this.exportElement?.setEnabled(false);

        return this.getAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            this.updateHitsCounter(aggregationsQueryResult.getMetadata().getTotalHits());
            this.updateExportState(aggregationsQueryResult);

            return this.processAggregations(aggregationsQueryResult.getAggregations()).then(() => {
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

    private processAggregations(aggregations: Aggregation[]): Q.Promise<void> {
        this.toggleAggregationsVisibility(aggregations);

        return this.displayNamesResolver.updateAggregationsDisplayNames(aggregations, this.getCurrentUserKeyAsString()).then(() => {
            this.updateAggregations(aggregations);
            return Q.resolve();
        });
    }

    private getCurrentUserKeyAsString(): string {
        return AuthContext.get().getUser().getKey().toString();
    }

    private getAggregations(): Q.Promise<AggregationsQueryResult> {
        this.aggregationsFetcher.setSearchInputValues(this.getSearchInputValues());
        this.aggregationsFetcher.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.aggregationsFetcher.setDependency(this.getDependency());

        return this.aggregationsFetcher.getAggregations();
    }

    private initAggregationGroupView() {
        // that is supposed to be cached so response will be fast
        this.displayNamesResolver = new AggregationsDisplayNamesResolver();
        (this.aggregations.get(ContentAggregation.OWNER) as FilterableAggregationGroupView).setIdsToKeepOnToTop(
            [this.getCurrentUserKeyAsString()]);
        (this.aggregations.get(ContentAggregation.MODIFIED_BY) as FilterableAggregationGroupView).setIdsToKeepOnToTop(
            [this.getCurrentUserKeyAsString()]);

        return this.getAndUpdateAggregations();
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
        this.setTargetBranch(Branch.DRAFT);

        return this.getAndUpdateAggregations().then(() => {
            if (!suppressEvent) {
                this.notifySearchEvent();
            }

            return Q.resolve();
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

    private toggleAggregationsVisibility(aggregations: Aggregation[]) {
        aggregations.forEach((aggregation: BucketAggregation) => {
            const isAggregationEmpty: boolean = !aggregation.getBuckets().some((bucket: Bucket) => {
                if (bucket.docCount > 0) {
                    return true;
                }
            });

            this.aggregations.get(aggregation.getName()).setVisible(!isAggregationEmpty);
        });
    }


    // doing a trick to avoid changing lib-admin-ui, adding all children except export button to a wrapper
    appendChild(child: Element, lazyRender?: boolean): Element {
        if (!this.elementsContainer) {
            this.elementsContainer = new DivEl('elements-container');
        }

        return this.elementsContainer.appendChild(child, lazyRender);
    }
}
