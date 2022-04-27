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
import {Principal} from 'lib-admin-ui/security/Principal';
import {SearchContentQueryCreator} from './SearchContentQueryCreator';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {GetPrincipalsByKeysRequest} from '../../security/GetPrincipalsByKeysRequest';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {DependenciesSection} from './DependenciesSection';
import {ContentAggregations} from './ContentAggregations';

export class ContentBrowseFilterPanel
    extends BrowseFilterPanel<ContentSummaryAndCompareStatus> {

    private aggregations: Map<string, AggregationGroupView>;
    private principals: Map<string, string> = new Map<string, string>();

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
            this.aggregations.set(name, new ContentTypeAggregationGroupView(name, i18n(`field.${name}`)));
        }

        return Array.from(this.aggregations.values());
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

    private findAndUpdateWorkflowAggregations(aggregations: Aggregation[], total: number) {
        const workflowAggr: Aggregation = aggregations.find((aggr: Aggregation) => aggr.getName() === ContentAggregations.WORKFLOW);

        if (workflowAggr) {
            this.updateWorkflowAggregation(<BucketAggregation>workflowAggr, total);
        }
    }

    private updateWorkflowAggregation(workflowAggr: BucketAggregation, total: number): BucketAggregation {
        // contents might not have a workflow property, thus aggregation won't see those contents, but they are treated as ready
        const inProgressKey: string = WorkflowState[WorkflowState.IN_PROGRESS].toLowerCase();
        const inProgressBucket: Bucket = workflowAggr.getBucketByName(inProgressKey);
        const result: Bucket[] = [];

        const inProgressCount: number = inProgressBucket?.docCount || 0;
        const readyCount: number = total - inProgressCount;

        if (readyCount > 0) {
            const readyKey: string = WorkflowState[WorkflowState.READY].toLowerCase();
            const bucket: Bucket = new Bucket(readyKey, readyCount);
            bucket.setDisplayName(i18n(`status.workflow.${readyKey}`));
            result.push(bucket);
        }

        if (inProgressBucket) {
            inProgressBucket.setDisplayName(i18n(`status.workflow.${inProgressKey}`));
            result.push(inProgressBucket);
        }

        workflowAggr.setBuckets(result);

        return workflowAggr;
    }

    private findAndUpdatePrincipalsAggregations(aggregations: Aggregation[]): void {
        const principalsAggregations: BucketAggregation[] = <BucketAggregation[]>aggregations.filter((aggr: Aggregation) => {
           return aggr.getName() === ContentAggregations.MODIFIER || aggr.getName() === ContentAggregations.OWNER;
        });

        principalsAggregations.forEach((principalAggr: BucketAggregation) => this.updatePrincipalsAggregations(principalAggr));
    }

    private updatePrincipalsAggregations(principalsAggregation: BucketAggregation): void {
        this.updateKnownPrincipals(principalsAggregation);
        this.updateUnknownPrincipals(principalsAggregation);
    }

    private updateKnownPrincipals(principalsAggregation: BucketAggregation): void {
        principalsAggregation.getBuckets().forEach((bucket: Bucket) => {
            const displayName: string = this.principals.get(bucket.getKey());

            if (displayName) {
                bucket.setDisplayName(displayName);
            }
        });

        this.updateAggregations([principalsAggregation]);
    }

    private updateUnknownPrincipals(principalsAggregation: BucketAggregation): void {
        // finding keys which display names are not loaded
        const unknownPrincipals: PrincipalKey[] = principalsAggregation.getBuckets()
            .filter((bucket: Bucket) => !this.principals.has(bucket.getKey()))
            .map((bucket: Bucket) => PrincipalKey.fromString(bucket.getKey()));

        if (unknownPrincipals.length === 0) {
            return;
        }

        new GetPrincipalsByKeysRequest(unknownPrincipals).sendAndParse().then((principals: Principal[]) => {
            unknownPrincipals.forEach((unknownPrincipal: PrincipalKey) => {
                // if principal is not found (im might be deleted) then using key
                const principal: Principal = principals.find((p: Principal) => p.getKey().equals(unknownPrincipal));
                this.principals.set(unknownPrincipal.toString(), principal?.getDisplayName() || unknownPrincipal.toString());
            });

            this.updateKnownPrincipals(principalsAggregation);

            return Q.resolve();
        }).catch(DefaultErrorHandler.handle);
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
        this.findAndUpdateWorkflowAggregations(aggregations, totalHits);
        this.updateAggregations(aggregations, doUpdateAll);
        this.findAndUpdatePrincipalsAggregations(aggregations);
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

        new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
            (queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                this.processAggregations(queryResult.getAggregations(), queryResult.getMetadata().getTotalHits(), false, true);

                aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
                    aggregationGroupView.initialize();
                });
            }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();
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
