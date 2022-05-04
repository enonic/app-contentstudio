import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentBrowseSearchData} from './ContentBrowseSearchData';
import {Router} from '../../Router';
import {ContentQueryRequest} from '../../resource/ContentQueryRequest';
import {ContentQueryResult} from '../../resource/ContentQueryResult';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentQuery} from '../../content/ContentQuery';
import {AggregationGroupView} from 'lib-admin-ui/aggregation/AggregationGroupView';
import {Aggregation} from 'lib-admin-ui/aggregation/Aggregation';
import {BrowseFilterResetEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterResetEvent';
import {BrowseFilterRefreshEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterRefreshEvent';
import {BrowseFilterSearchEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterSearchEvent';
import {BrowseFilterPanel} from 'lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import {BucketAggregation} from 'lib-admin-ui/aggregation/BucketAggregation';
import {Bucket} from 'lib-admin-ui/aggregation/Bucket';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {BucketAggregationView} from 'lib-admin-ui/aggregation/BucketAggregationView';
import {ContentIds} from '../../content/ContentIds';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryJson} from '../../content/ContentSummaryJson';
import {ContentId} from '../../content/ContentId';
import {SearchContentQueryCreator} from './SearchContentQueryCreator';
import {DependenciesSection} from './DependenciesSection';
import {ContentAggregations} from './ContentAggregations';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {ContentAggregationsFetcher} from './ContentAggregationsFetcher';

export class ContentBrowseFilterPanel
    extends BrowseFilterPanel<ContentSummaryAndCompareStatus> {

    private aggregations: Map<string, AggregationGroupView>;
    private aggregationsDisplayNamesResolver: AggregationsDisplayNamesResolver;

    private dependenciesSection: DependenciesSection;

    constructor() {
        super();

        this.initElementsAndListeners();
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

        for (let aggrEnum in ContentAggregations) {
            const name: string = ContentAggregations[aggrEnum];
            this.aggregations.set(name, this.createGroupView(name));
        }

        return Array.from(this.aggregations.values());
    }

    private createGroupView(name: string): AggregationGroupView {
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
            ContentAggregations.CONTENT_TYPE).getAggregationViews()[0]).selectBucketViewByKey(key);
    }

    doRefresh(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.handleEmptyFilterInput(true);
        }
        return this.refreshDataAndHandleResponse(this.buildQuery(false));
    }

    protected doSearch(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.handleEmptyFilterInput();
        }
        return this.searchDataAndHandleResponse(this.buildQuery(false));
    }

    setSelectedItems(itemsIds: string[]) {
        this.dependenciesSection.reset();

        super.setSelectedItems(itemsIds);
    }

    protected isFilteredOrConstrained() {
        return super.isFilteredOrConstrained() || this.dependenciesSection.isActive();
    }

    private handleEmptyFilterInput(isRefresh?: boolean): Q.Promise<void> {
        if (isRefresh) {
            return this.resetFacets(true, true).then(() => {
                new BrowseFilterRefreshEvent().fire();
            }).catch(DefaultErrorHandler.handle);
        }
        // it's SearchEvent, usual reset with grid reload
        return this.reset();
    }

    private searchDataAndHandleResponse(contentQuery: ContentQuery): Q.Promise<void> {
        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery)
            .setExpand(Expand.SUMMARY)
            .sendAndParse()
            .then((contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                if (this.dependenciesSection.isActive() && contentQueryResult.getAggregations().length === 0) {
                    this.removeDependencyItem();
                } else {
                    return this.handleDataSearchResult(contentQueryResult).then(() => {
                        new BrowseFilterSearchEvent(new ContentBrowseSearchData(contentQueryResult, contentQuery)).fire();
                        return Q.resolve();
                    });
                }
            })
            .catch(DefaultErrorHandler.handle);
    }

    private refreshDataAndHandleResponse(contentQuery: ContentQuery): Q.Promise<void> {
        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery)
            .setExpand(Expand.SUMMARY)
            .sendAndParse()
            .then((contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                if (contentQueryResult.getMetadata().getTotalHits() > 0) {
                    return this.handleDataSearchResult(contentQueryResult).then(() => {
                        new BrowseFilterSearchEvent(new ContentBrowseSearchData(contentQueryResult, contentQuery)).fire();
                        return Q.resolve();
                    });
                } else {
                    return this.handleNoSearchResultOnRefresh(contentQuery);
                }
            })
            .catch(DefaultErrorHandler.handle);
    }

    private handleDataSearchResult(contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>): Q.Promise<void> {
        return this.getAggregations(contentQueryResult).then((aggregations: Aggregation[]) => {
            this.processAggregations(aggregations, true);
            this.updateHitsCounter(contentQueryResult.getMetadata().getTotalHits());
            return Q.resolve();
        });
    }

    private processAggregations(aggregations: Aggregation[], doUpdateAll?: boolean): void {
        this.updateAggregations(aggregations, doUpdateAll);
        this.aggregationsDisplayNamesResolver.updateAggregationsDisplayNames(aggregations).then(() => {
            this.updateAggregations(aggregations, true);
        }).catch(DefaultErrorHandler.handle);
        this.toggleAggregationsVisibility(aggregations);
    }

    private handleNoSearchResultOnRefresh(contentQuery: ContentQuery): Q.Promise<void> {
        // remove content type facet from search if both content types and date are filtered
        if (this.contentTypesAndRangeFiltersUsed(contentQuery)) {
            return this.refreshDataAndHandleResponse(this.cloneContentQueryNoContentTypes(contentQuery));
        } else if (this.hasSearchStringSet()) { // if still no result and search text is set remove last modified facet
            this.deselectAll();
            return this.searchDataAndHandleResponse(this.cloneContentQueryNoAggregations(contentQuery));
        } else if (this.dependenciesSection.isActive()) {
            this.removeDependencyItem();
        }

        return this.reset();
    }

    private contentTypesAndRangeFiltersUsed(contentQuery: ContentQuery): boolean {
        return contentQuery.getContentTypes().length > 0 && contentQuery.getQueryFilters().length > 0;
    }

    private cloneContentQueryNoContentTypes(contentQuery: ContentQuery): ContentQuery {
        const newContentQuery: ContentQuery = new ContentQuery()
            .setContentTypeNames([])
            .setFrom(contentQuery.getFrom())
            .setQueryExpr(contentQuery.getQueryExpr())
            .setSize(0)
            .setAggregationQueries(contentQuery.getAggregationQueries())
            .setQueryFilters(contentQuery.getQueryFilters())
            .setMustBeReferencedById(contentQuery.getMustBeReferencedById());

        return newContentQuery;
    }

    private cloneContentQueryNoAggregations(contentQuery: ContentQuery): ContentQuery {
        return this.cloneContentQueryNoContentTypes(contentQuery).setQueryFilters([]);
    }

    private getAggregations(contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>): Q.Promise<Aggregation[]> {
        const aggregationsFetcher: ContentAggregationsFetcher =
            new ContentAggregationsFetcher(this.getSearchInputValues(), contentQueryResult);

        aggregationsFetcher.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems() : null);
        aggregationsFetcher.setDependency(this.getDependency());

        return aggregationsFetcher.getAggregations();
    }

    private initAggregationGroupView() {
        const contentQuery: ContentQuery = this.buildQuery(true);

        // that is supposed to be cached so response will be fast
        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.aggregationsDisplayNamesResolver = new AggregationsDisplayNamesResolver(loginResult.getUser().getKey().toString());

            new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
                (queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                    return this.handleDataSearchResult(queryResult);
                }).catch((reason: any) => {
                DefaultErrorHandler.handle(reason);
            }).done();
        });
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
        const contentQuery: ContentQuery = this.buildQuery(true);

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
            (queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                this.handleDataSearchResult(queryResult).then(() => {
                    if (!suppressEvent) { // then fire usual reset event with content grid reloading
                        if (this.dependenciesSection?.isActive()) {
                            new BrowseFilterSearchEvent(new ContentBrowseSearchData(queryResult, contentQuery)).fire();
                        } else {
                            new BrowseFilterResetEvent().fire();
                        }
                    }
                });
            }
        ).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    private buildQuery(isAggregation: boolean): ContentQuery {
        const queryCreator: SearchContentQueryCreator = new SearchContentQueryCreator(this.getSearchInputValues());

        queryCreator.setIsAggregation(isAggregation);
        queryCreator.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems() : null);
        queryCreator.setDependency(this.getDependency());

        return queryCreator.create();
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
