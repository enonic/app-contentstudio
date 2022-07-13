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

export class ContentBrowseFilterPanel
    extends BrowseFilterPanel<ContentSummaryAndCompareStatus> {

    private aggregations: Map<string, AggregationGroupView>;
    private displayNamesResolver: AggregationsDisplayNamesResolver;
    private aggregationsFetcher: ContentAggregationsFetcher;
    private userInfo: LoginResult;
    private searchEventListeners: { (query?: ContentQuery): void; }[] = [];

    private dependenciesSection: DependenciesSection;

    constructor() {
        super();

        this.aggregationsFetcher = new ContentAggregationsFetcher();
        this.initElementsAndListeners();
    }

    onSearchEvent(listener: { (query?: ContentQuery): void; }): void {
        this.searchEventListeners.push(listener);
    }

    unSearchEvent(listener: { (query?: ContentQuery): void; }): void {
        this.searchEventListeners = this.searchEventListeners.filter((curr: { (query?: ContentQuery): void; }) => {
            return curr !== listener;
        });
    }

    private notifySearchEvent(query?: ContentQuery): void {
        this.searchEventListeners.forEach((listener: { (q?: ContentQuery): void; }) => {
            listener(query);
        });
    }

    private initElementsAndListeners() {
        this.initAggregationGroupView();
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
        if (name === ContentAggregation.OWNER || name === ContentAggregation.MODIFIED_BY) {
            return new FilterableAggregationGroupView(name, i18n(`field.${name}`));
        }

        return new AggregationGroupView(name, i18n(`field.${name}`));
    }

    protected appendExtraSections() {
        super.appendExtraSections();
        this.dependenciesSection = new DependenciesSection(this.removeDependencyItem.bind(this));
        this.appendChild(this.dependenciesSection);
    }

    private removeDependencyItem() {
        this.dependenciesSection.reset();
        this.resetConstraints();
        this.search();
        Router.get().back();
    }

    public setDependencyItem(item: ContentSummary, inbound: boolean, type?: string) {
        this.dependenciesSection.setInbound(inbound).setType(type);
        this.setConstraintItems(this.dependenciesSection, [item.getId()]);
        this.dependenciesSection.setDependencyItem(item);
        this.selectContentTypeBucket(type);
    }

    private selectContentTypeBucket(key: string) {
        if (!key) {
            return;
        }

        (<BucketAggregationView>this.aggregations.get(
            ContentAggregation.CONTENT_TYPE).getAggregationViews()[0]).selectBucketViewByKey(key);
    }

    doRefresh(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets();
        }

        return this.getAndUpdateAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            if (aggregationsQueryResult.getMetadata().getTotalHits() > 0) {
                this.notifySearchEvent(this.aggregationsFetcher.createContentQuery(this.getSearchInputValues()));
                return Q.resolve();
            }

            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }

            return this.reset();
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
        return this.getAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            this.updateHitsCounter(aggregationsQueryResult.getMetadata().getTotalHits());
            return this.processAggregations(aggregationsQueryResult.getAggregations()).then(() => {
                return aggregationsQueryResult;
            });
        });
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
            (<FilterableAggregationGroupView>this.aggregations.get(ContentAggregation.OWNER)).setIdsToKeepOnToTop(
                [this.getCurrentUserKeyAsString()]);
            (<FilterableAggregationGroupView>this.aggregations.get(ContentAggregation.MODIFIED_BY)).setIdsToKeepOnToTop(
                [this.getCurrentUserKeyAsString()]);

            return this.getAndUpdateAggregations();
        }).catch(DefaultErrorHandler.handle);
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
        return this.getAndUpdateAggregations().then(() => {
            this.notifySearchEvent();
            return Q.resolve();
        });
    }

    getDependency(): { isInbound: boolean, dependencyId: ContentId } {
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
}
