import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
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
import {ContentIds} from '../../content/ContentIds';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {DependenciesSection} from './DependenciesSection';
import {ContentAggregation} from './ContentAggregation';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {ContentAggregationsFetcher} from './ContentAggregationsFetcher';
import {FilterableAggregationGroupView} from './FilterableAggregationGroupView';
import {AggregationsQueryResult} from './AggregationsQueryResult';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentExportElement} from './ContentExportElement';
import {ContentDependency} from './ContentDependency';
import {TextSearchField} from '@enonic/lib-admin-ui/app/browse/filter/TextSearchField';

export class ContentBrowseFilterPanel
    extends BrowseFilterPanel<ContentSummaryAndCompareStatus> {

    private aggregations: Map<string, AggregationGroupView>;
    private displayNamesResolver: AggregationsDisplayNamesResolver;
    private aggregationsFetcher: ContentAggregationsFetcher;
    private userInfo: LoginResult;
    private searchEventListeners: ((query?: ContentQuery) => void)[] = [];

    private dependenciesSection: DependenciesSection;
    private elementsContainer: Element;
    private exportButtonContainer?: ContentExportElement;

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
            this.exportButtonContainer = new ContentExportElement().setVisible(false) as ContentExportElement;
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

        const permissionsUpdatedHandler = (contentIds: ContentIds) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            const dependencyItemId: ContentId = this.dependenciesSection.getDependencyId();
            const isDependencyItemUpdated: boolean = contentIds.contains(dependencyItemId);

            if (isDependencyItemUpdated) {
                this.search();
            }
        };

        const updatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            permissionsUpdatedHandler(ContentIds.from(data.map((item: ContentSummaryAndCompareStatus) => item.getContentId())));
        };

        handler.onContentUpdated(updatedHandler);
        handler.onContentPermissionsUpdated(permissionsUpdatedHandler);

        ProjectContext.get().onProjectChanged(() => {
            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }
        });

        this.onRendered(() => {
            super.appendChild(this.elementsContainer);

            if (this.exportButtonContainer) {
                this.addClass('has-export-button');
                super.appendChild(this.exportButtonContainer);
            }
        });
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
        this.elementsContainer.getChildren().some((child: Element) => {
            if (child instanceof TextSearchField) {
                child.setValue(id.toString());
                return true;
            }

            return false;
        });
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
        this.exportButtonContainer?.setEnabled(false);

        return this.getAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            this.updateHitsCounter(aggregationsQueryResult.getMetadata().getTotalHits());
            this.updateExportState(aggregationsQueryResult);

            return this.processAggregations(aggregationsQueryResult.getAggregations()).then(() => {
                return aggregationsQueryResult;
            });
        }).finally(() => {
            this.exportButtonContainer?.setEnabled(true);
        });
    }

    private updateExportState(aggregationsQueryResult: AggregationsQueryResult): void {
        this.exportButtonContainer?.setTotal(aggregationsQueryResult.getMetadata().getTotalHits());
        this.exportButtonContainer?.setSearchInputValues(this.getSearchInputValues());
        this.exportButtonContainer?.setDependency(this.getDependency());
        this.exportButtonContainer?.setConstraintIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.exportButtonContainer?.setVisible(aggregationsQueryResult.getMetadata().getTotalHits() > 0);
    }

    private processAggregations(aggregations: Aggregation[]): Q.Promise<void> {
        this.toggleAggregationsVisibility(aggregations);

        return this.displayNamesResolver.updateAggregationsDisplayNames(aggregations, this.getCurrentUserKeyAsString()).then(() => {
            this.updateAggregations(aggregations);
            return Q.resolve();
        });
    }

    private getCurrentUserKeyAsString(): string {
        return this.userInfo.getUser().getKey().toString();
    }

    private getAggregations(): Q.Promise<AggregationsQueryResult> {
        this.aggregationsFetcher.setSearchInputValues(this.getSearchInputValues());
        this.aggregationsFetcher.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.aggregationsFetcher.setDependency(this.getDependency());

        return this.aggregationsFetcher.getAggregations();
    }

    private initAggregationGroupView() {
        // that is supposed to be cached so response will be fast
        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.userInfo = loginResult;
            this.displayNamesResolver = new AggregationsDisplayNamesResolver();
            (this.aggregations.get(ContentAggregation.OWNER) as FilterableAggregationGroupView).setIdsToKeepOnToTop(
                [this.getCurrentUserKeyAsString()]);
            (this.aggregations.get(ContentAggregation.MODIFIED_BY) as FilterableAggregationGroupView).setIdsToKeepOnToTop(
                [this.getCurrentUserKeyAsString()]);

            return this.getAndUpdateAggregations();
        }).catch(DefaultErrorHandler.handle);
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
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
