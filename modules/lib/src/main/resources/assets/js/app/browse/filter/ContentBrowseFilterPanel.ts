import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentBrowseSearchData} from './ContentBrowseSearchData';
import {ContentTypeAggregationGroupView} from './ContentTypeAggregationGroupView';
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
import {AggregationsProcessor} from './AggregationsProcessor';

export class ContentBrowseFilterPanel
    extends BrowseFilterPanel<ContentSummaryAndCompareStatus> {

    private aggregations: Map<string, AggregationGroupView>;
    private aggregationsProcessor: AggregationsProcessor;

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
        if (name === ContentAggregations.CONTENT_TYPE) {
            return new ContentTypeAggregationGroupView(name, i18n(`field.${name}`));
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
            ContentAggregations.CONTENT_TYPE).getAggregationViews()[0]).selectBucketViewByKey(key);
    }

    doRefresh(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.handleEmptyFilterInput(true);
        }
        return this.refreshDataAndHandleResponse(this.createContentQuery());
    }

    protected doSearch(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.handleEmptyFilterInput();
        }
        return this.searchDataAndHandleResponse(this.createContentQuery());
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

    private createContentQuery(): ContentQuery {
        return this.buildQuery(false);
    }

    private searchDataAndHandleResponse(contentQuery: ContentQuery): Q.Promise<void> {
        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery)
            .setExpand(Expand.SUMMARY)
            .sendAndParse()
            .then((contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                if (this.dependenciesSection.isActive() && contentQueryResult.getAggregations().length === 0) {
                    this.removeDependencyItem();
                } else {
                    return this.handleDataSearchResult(contentQuery, contentQueryResult);
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
                    this.handleDataSearchResult(contentQuery, contentQueryResult);
                } else {
                    this.handleNoSearchResultOnRefresh(contentQuery);
                }
            })
            .catch(DefaultErrorHandler.handle);
    }

    private handleDataSearchResult(contentQuery: ContentQuery, contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) {
        return this.getAggregations(contentQuery, contentQueryResult).then((aggregations: Aggregation[]) => {
            this.processAggregations(aggregations, contentQueryResult.getMetadata().getTotalHits(), true);
            new BrowseFilterSearchEvent(new ContentBrowseSearchData(contentQueryResult, contentQuery)).fire();
        }).catch(DefaultErrorHandler.handle);
    }

    private processAggregations(aggregations: Aggregation[], totalHits: number, doUpdateAll?: boolean, emptyFilterValue?: boolean): void {
        this.aggregationsProcessor.updateWorkflowAggregations(aggregations, totalHits);
        this.updateAggregations(aggregations, doUpdateAll);
        this.aggregationsProcessor.updatePrincipalsAggregations(aggregations).then((principalsAggregations: BucketAggregation[]) => {
            if (principalsAggregations && principalsAggregations.length > 0) {
                this.updateAggregations(principalsAggregations, true);
            }
        }).catch(DefaultErrorHandler.handle);
        this.aggregationsProcessor.updateLanguageAggregations(aggregations).then((langAggr: BucketAggregation) => {
            if (langAggr) {
                this.updateAggregations([langAggr], true);
            }
        }).catch(DefaultErrorHandler.handle);
        this.toggleAggregationsVisibility(aggregations);
        this.updateHitsCounter(totalHits, emptyFilterValue);
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

    private getAggregations(contentQuery: ContentQuery,
                            contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>): Q.Promise<Aggregation[]> {

        const clonedContentQueryNoContentTypes: ContentQuery = this.cloneContentQueryNoContentTypes(contentQuery);

        if (ObjectHelper.objectEquals(contentQuery, clonedContentQueryNoContentTypes)) {
            return Q(contentQueryResult.getAggregations());
        }

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(clonedContentQueryNoContentTypes).setExpand(
            Expand.SUMMARY).sendAndParse().then(
            (contentQueryResultNoContentTypesSelected: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                return this.combineAggregations(contentQueryResult, contentQueryResultNoContentTypesSelected);
            });
    }

    private combineAggregations(queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>,
                                queryResultNoContentTypesSelected: ContentQueryResult<ContentSummary, ContentSummaryJson>): Aggregation[] {
        const result: Aggregation[] =
            queryResult.getAggregations().filter((aggr: Aggregation) => aggr.getName() !== ContentAggregations.CONTENT_TYPE);

        const contentTypesAggr: Aggregation = queryResultNoContentTypesSelected.getAggregations().filter((aggregation: Aggregation) => {
            return aggregation.getName() === ContentAggregations.CONTENT_TYPE;
        })[0];

        if (contentTypesAggr) {
            result.push(contentTypesAggr);
        }

        return result;
    }

    private initAggregationGroupView() {
        const aggregationGroupViews: AggregationGroupView[] = Array.from(this.aggregations.values());
        const contentQuery: ContentQuery = this.buildAggregationsQuery();

        // that is supposed to be cached so response will be fast
        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.aggregationsProcessor = new AggregationsProcessor(loginResult.getUser().getKey().toString());

            new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
                (queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                    this.processAggregations(queryResult.getAggregations(), queryResult.getMetadata().getTotalHits(), false, true);

                    aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
                        aggregationGroupView.initialize();
                    });
                }).catch((reason: any) => {
                DefaultErrorHandler.handle(reason);
            }).done();
        });
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
        const contentQuery: ContentQuery = this.buildAggregationsQuery();

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
            (queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                this.processAggregations(queryResult.getAggregations(), queryResult.getMetadata().getTotalHits(), doResetAll, true);

                if (!suppressEvent) { // then fire usual reset event with content grid reloading
                    if (this.dependenciesSection?.isActive()) {
                        new BrowseFilterSearchEvent(new ContentBrowseSearchData(queryResult, contentQuery)).fire();
                    } else {
                        new BrowseFilterResetEvent().fire();
                    }
                }
            }
        ).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    private buildAggregationsQuery(): ContentQuery {
        return this.buildQuery(true);
    }

    private buildQuery(isAggregation: boolean): ContentQuery {
        const queryCreator: SearchContentQueryCreator = new SearchContentQueryCreator(this.getSearchInputValues());

        queryCreator.setIsAggregation(isAggregation);
        queryCreator.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems() : null);

        if (this.dependenciesSection?.isInbound()) {
            queryCreator.setDependency({isInbound: true, dependencyId: this.dependenciesSection.getDependencyId()});
        } else if (this.dependenciesSection?.isOutbound()) {
            queryCreator.setDependency({isInbound: false, dependencyId: this.dependenciesSection.getDependencyId()});
        }

        return queryCreator.create();
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
