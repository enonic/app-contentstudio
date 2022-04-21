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
import {ContentSummaryRequest} from '../../resource/ContentSummaryRequest';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {AggregationGroupView} from 'lib-admin-ui/aggregation/AggregationGroupView';
import {Aggregation} from 'lib-admin-ui/aggregation/Aggregation';
import {SearchInputValues} from 'lib-admin-ui/query/SearchInputValues';
import {
    TermsAggregationOrderDirection,
    TermsAggregationOrderType,
    TermsAggregationQuery
} from 'lib-admin-ui/query/aggregation/TermsAggregationQuery';
import {DateRangeAggregationQuery} from 'lib-admin-ui/query/aggregation/DateRangeAggregationQuery';
import {DateRange} from 'lib-admin-ui/query/aggregation/DateRange';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {LogicalExpr} from 'lib-admin-ui/query/expr/LogicalExpr';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {LogicalOperator} from 'lib-admin-ui/query/expr/LogicalOperator';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {BrowseFilterResetEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterResetEvent';
import {BrowseFilterRefreshEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterRefreshEvent';
import {BrowseFilterSearchEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterSearchEvent';
import {BrowseFilterPanel, ConstraintSection} from 'lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import {BucketAggregation} from 'lib-admin-ui/aggregation/BucketAggregation';
import {Bucket} from 'lib-admin-ui/aggregation/Bucket';
import {Filter} from 'lib-admin-ui/query/filter/Filter';
import {RangeFilter} from 'lib-admin-ui/query/filter/RangeFilter';
import {DateRangeBucket} from 'lib-admin-ui/aggregation/DateRangeBucket';
import {BooleanFilter} from 'lib-admin-ui/query/filter/BooleanFilter';
import {FulltextSearchExpressionBuilder} from 'lib-admin-ui/query/FulltextSearchExpression';
import {Expression} from 'lib-admin-ui/query/expr/Expression';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {BucketAggregationView} from 'lib-admin-ui/aggregation/BucketAggregationView';
import {ContentIds} from '../../content/ContentIds';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentSummaryViewer} from '../../content/ContentSummaryViewer';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryJson} from '../../content/ContentSummaryJson';
import {ContentId} from '../../content/ContentId';

export class ContentBrowseFilterPanel
    extends BrowseFilterPanel<ContentSummaryAndCompareStatus> {

    static CONTENT_TYPE_AGGREGATION_NAME: string = 'contentTypes';
    static LAST_MODIFIED_AGGREGATION_NAME: string = 'lastModified';

    private contentTypeAggregation: ContentTypeAggregationGroupView;
    private lastModifiedAggregation: AggregationGroupView;

    private dependenciesSection: DependenciesSection;

    constructor() {
        super();

        this.initElementsAndListeners();
    }

    private initElementsAndListeners() {
        this.initAggregationGroupView([this.contentTypeAggregation, this.lastModifiedAggregation]);
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
        this.contentTypeAggregation = new ContentTypeAggregationGroupView(
            ContentBrowseFilterPanel.CONTENT_TYPE_AGGREGATION_NAME,
            i18n('field.contentTypes'));

        this.lastModifiedAggregation = new AggregationGroupView(
            ContentBrowseFilterPanel.LAST_MODIFIED_AGGREGATION_NAME,
            i18n('field.lastModified'));

        return [this.contentTypeAggregation, this.lastModifiedAggregation];
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

        (<BucketAggregationView>this.contentTypeAggregation.getAggregationViews()[0]).selectBucketViewByKey(key);
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
        const contentQuery: ContentQuery = new ContentQuery();
        const values: SearchInputValues = this.getSearchInputValues();
        contentQuery.setQueryExpr(this.createQueryExpression(values));
        this.appendContentTypeFilter(values, contentQuery);
        if (!!this.dependenciesSection && this.dependenciesSection.isOutbound()) {
            this.appendOutboundReferencesFilter(contentQuery);
        }

        let lastModifiedFilter: Filter = this.appendLastModifiedQuery(values);
        if (lastModifiedFilter != null) {
            contentQuery.addQueryFilter(lastModifiedFilter);
        }

        contentQuery.setSize(ContentQuery.POSTLOAD_SIZE);

        this.appendContentTypesAggregationQuery(contentQuery);
        this.appendLastModifiedAggregationQuery(contentQuery);

        return contentQuery;
    }

    private searchDataAndHandleResponse(contentQuery: ContentQuery): Q.Promise<void> {
        return new ContentQueryRequest<ContentSummaryJson,ContentSummary>(contentQuery)
            .setExpand(Expand.SUMMARY)
            .sendAndParse()
            .then((contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>) => {
                if (this.dependenciesSection.isActive() && contentQueryResult.getAggregations().length === 0) {
                    this.removeDependencyItem();
                } else {
                    return this.handleDataSearchResult(contentQuery, contentQueryResult);
                }
            })
            .catch(DefaultErrorHandler.handle);
    }

    private refreshDataAndHandleResponse(contentQuery: ContentQuery): Q.Promise<void> {
        return new ContentQueryRequest<ContentSummaryJson,ContentSummary>(contentQuery)
            .setExpand(Expand.SUMMARY)
            .sendAndParse()
            .then((contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>) => {
                if (contentQueryResult.getMetadata().getTotalHits() > 0) {
                    this.handleDataSearchResult(contentQuery, contentQueryResult);
                } else {
                    this.handleNoSearchResultOnRefresh(contentQuery);
                }
            })
            .catch(DefaultErrorHandler.handle);
    }

    private handleDataSearchResult(contentQuery: ContentQuery,
                                   contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>) {
        return this.getAggregations(contentQuery, contentQueryResult).then((aggregations: Aggregation[]) => {
            this.updateAggregations(aggregations, true);
            this.updateHitsCounter(contentQueryResult.getMetadata().getTotalHits());
            this.toggleAggregationsVisibility(contentQueryResult.getAggregations());
            new BrowseFilterSearchEvent(new ContentBrowseSearchData(contentQueryResult, contentQuery)).fire();
        });
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
        let newContentQuery: ContentQuery = new ContentQuery().setContentTypeNames([]).setFrom(contentQuery.getFrom()).setQueryExpr(
            contentQuery.getQueryExpr()).setSize(contentQuery.getSize()).setAggregationQueries(
            contentQuery.getAggregationQueries()).setQueryFilters(contentQuery.getQueryFilters()).setMustBeReferencedById(
            contentQuery.getMustBeReferencedById());

        return newContentQuery;
    }

    private cloneContentQueryNoAggregations(contentQuery: ContentQuery): ContentQuery {
        return this.cloneContentQueryNoContentTypes(contentQuery).setQueryFilters([]);
    }

    private getAggregations(contentQuery: ContentQuery,
                            contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>): Q.Promise<Aggregation[]> {

        let clonedContentQueryNoContentTypes: ContentQuery = this.cloneContentQueryNoContentTypes(contentQuery);

        if (ObjectHelper.objectEquals(contentQuery, clonedContentQueryNoContentTypes)) {
            return Q(this.combineAggregations(contentQueryResult, contentQueryResult));
        }

        return new ContentQueryRequest<ContentSummaryJson,ContentSummary>(clonedContentQueryNoContentTypes).setExpand(
            Expand.SUMMARY).sendAndParse().then(
            (contentQueryResultNoContentTypesSelected: ContentQueryResult<ContentSummary,ContentSummaryJson>) => {
                return this.combineAggregations(contentQueryResult, contentQueryResultNoContentTypesSelected);
            });
    }

    private combineAggregations(contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>,
                                queryResultNoContentTypesSelected: ContentQueryResult<ContentSummary,ContentSummaryJson>): Aggregation[] {
        let contentTypesAggr = queryResultNoContentTypesSelected.getAggregations().filter((aggregation) => {
            return aggregation.getName() === ContentBrowseFilterPanel.CONTENT_TYPE_AGGREGATION_NAME;
        });
        let dateModifiedAggr = contentQueryResult.getAggregations().filter((aggregation) => {
            return aggregation.getName() !== ContentBrowseFilterPanel.CONTENT_TYPE_AGGREGATION_NAME;
        });

        let aggregations = [contentTypesAggr[0], dateModifiedAggr[0]];

        return aggregations;
    }

    private initAggregationGroupView(aggregationGroupViews: AggregationGroupView[]) {

        let contentQuery: ContentQuery = this.buildAggregationsQuery();

        new ContentQueryRequest<ContentSummaryJson,ContentSummary>(contentQuery).sendAndParse().then(
            (contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>) => {

                this.updateAggregations(contentQueryResult.getAggregations(), false);
                this.updateHitsCounter(contentQueryResult.getMetadata().getTotalHits(), true);
                this.toggleAggregationsVisibility(contentQueryResult.getAggregations());

                aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
                    aggregationGroupView.initialize();
                });
            }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {

        let contentQuery: ContentQuery = this.buildAggregationsQuery();

        return new ContentQueryRequest<ContentSummaryJson,ContentSummary>(contentQuery).sendAndParse().then(
            (contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>) => {

                this.updateAggregations(contentQueryResult.getAggregations(), doResetAll);
                this.updateHitsCounter(contentQueryResult.getMetadata().getTotalHits(), true);
                this.toggleAggregationsVisibility(contentQueryResult.getAggregations());

                if (!suppressEvent) { // then fire usual reset event with content grid reloading
                    if (!!this.dependenciesSection && this.dependenciesSection.isActive()) {
                        new BrowseFilterSearchEvent(new ContentBrowseSearchData(contentQueryResult, contentQuery)).fire();
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
        let contentQuery: ContentQuery = new ContentQuery();
        contentQuery.setQueryExpr(new QueryExpr(null));
        contentQuery.setSize(0);

        this.appendFilterByItems(contentQuery);
        this.appendContentTypesAggregationQuery(contentQuery);
        this.appendLastModifiedAggregationQuery(contentQuery);
        if (!!this.dependenciesSection && this.dependenciesSection.isOutbound()) {
            this.appendOutboundReferencesFilter(contentQuery);
        }

        return contentQuery;
    }

    private createQueryExpression(searchInputValues: SearchInputValues): QueryExpr {
        const isSelectionMode: boolean = this.hasConstraint();
        const searchString: string = searchInputValues.getTextSearchFieldValue();
        const searchExpression: LogicalExpr =
            new LogicalExpr(this.makeFulltextSearchExpr(searchString), LogicalOperator.OR, this.createIdSearchExpr(searchString));

        if (isSelectionMode || this.dependenciesSection.isInbound()) {
            return new QueryExpr(new LogicalExpr(searchExpression,
                LogicalOperator.AND,
                isSelectionMode ?
                this.makeSelectedItemsSearchExpr() : this.makeInboundDependenciesSearchExpr()
            ), ContentSummaryRequest.ROOT_ORDER);
        }

        return new QueryExpr(searchExpression, ContentSummaryRequest.ROOT_ORDER);
    }

    private makeSelectedItemsSearchExpr(): Expression {
        let selectedItemsIds = this.getSelectionItems();
        let query: QueryExpr;

        selectedItemsIds.forEach((id: string) => {
            if (!!query) {
                query = new QueryExpr(new LogicalExpr(query, LogicalOperator.OR,
                    CompareExpr.eq(new FieldExpr(QueryField.ID), ValueExpr.string(id))));
            } else {
                query = new QueryExpr(CompareExpr.eq(new FieldExpr(QueryField.ID), ValueExpr.string(id)));
            }
        });

        return query;
    }

    private makeInboundDependenciesSearchExpr(): Expression {
        let dependencyId = this.dependenciesSection.getDependencyId().toString();

        let query: QueryExpr = new QueryExpr(new LogicalExpr(
            CompareExpr.eq(new FieldExpr(QueryField.REFERENCES), ValueExpr.string(dependencyId)),
            LogicalOperator.AND,
            CompareExpr.neq(new FieldExpr(QueryField.ID), ValueExpr.string(dependencyId))));

        return query;
    }

    private makeFulltextSearchExpr(searchString: string): Expression {
        return new FulltextSearchExpressionBuilder()
            .setSearchString(searchString)
            .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
            .addField(new QueryField(QueryField.NAME, 3))
            .addField(new QueryField(QueryField.ALL))
            .build();
    }

    private createIdSearchExpr(searchString: string): Expression {
        return CompareExpr.eq(new FieldExpr(QueryField.ID), ValueExpr.string(searchString));
    }

    private appendContentTypeFilter(searchInputValues: SearchInputValues, contentQuery: ContentQuery): void {
        let selectedBuckets: Bucket[] = searchInputValues.getSelectedValuesForAggregationName(
            ContentBrowseFilterPanel.CONTENT_TYPE_AGGREGATION_NAME);

        let contentTypeNames: ContentTypeName[] = this.parseContentTypeNames(selectedBuckets);

        contentQuery.setContentTypeNames(contentTypeNames);
    }

    private appendFilterByItems(contentQuery: ContentQuery): void {
        if (!!this.dependenciesSection && this.dependenciesSection.isInbound()) {
            contentQuery.setQueryExpr(new QueryExpr(this.makeInboundDependenciesSearchExpr()));

            return;
        }

        if (this.hasConstraint()) {
            contentQuery.setQueryExpr(new QueryExpr(this.makeSelectedItemsSearchExpr()));

            return;
        }
    }

    private appendOutboundReferencesFilter(contentQuery: ContentQuery): void {
        contentQuery.setMustBeReferencedById(this.dependenciesSection.getDependencyId());
    }

    private appendLastModifiedQuery(searchInputValues: SearchInputValues): Filter {

        let lastModifiedSelectedBuckets: Bucket[] = searchInputValues.getSelectedValuesForAggregationName(
            ContentBrowseFilterPanel.LAST_MODIFIED_AGGREGATION_NAME);

        if (lastModifiedSelectedBuckets == null || lastModifiedSelectedBuckets.length === 0) {
            return null;
        }

        if (lastModifiedSelectedBuckets.length === 1) {
            let dateRangeBucket: DateRangeBucket = <DateRangeBucket> lastModifiedSelectedBuckets.pop();
            return new RangeFilter(QueryField.MODIFIED_TIME, ValueExpr.dateTime(dateRangeBucket.getFrom()).getValue(),
                null);
        }

        let booleanFilter: BooleanFilter = new BooleanFilter();

        lastModifiedSelectedBuckets.forEach((selectedBucket: DateRangeBucket) => {
            let rangeFilter: RangeFilter =
                new RangeFilter(QueryField.MODIFIED_TIME, ValueExpr.dateTime(selectedBucket.getFrom()).getValue(),
                    null);

            booleanFilter.addShould(<Filter>rangeFilter);
        });

        return booleanFilter;
    }

    private parseContentTypeNames(buckets: Bucket[]): ContentTypeName[] {
        let contentTypeNames: ContentTypeName[] = [];

        if (buckets) {
            for (let i = 0; i < buckets.length; i++) {
                let bucket: Bucket = buckets[i];
                contentTypeNames.push(new ContentTypeName(bucket.getKey()));
            }
        }

        return contentTypeNames;
    }

    private appendContentTypesAggregationQuery(contentQuery: ContentQuery) {
        contentQuery.addAggregationQuery(this.createTermsAggregation((ContentBrowseFilterPanel.CONTENT_TYPE_AGGREGATION_NAME),
            QueryField.CONTENT_TYPE, 0));
    }

    private createTermsAggregation(name: string, fieldName: string, size: number): TermsAggregationQuery {
        let termsAggregation = new TermsAggregationQuery(name);
        termsAggregation.setFieldName(fieldName);
        termsAggregation.setSize(size);
        termsAggregation.setOrderByType(TermsAggregationOrderType.DOC_COUNT);
        termsAggregation.setOrderByDirection(TermsAggregationOrderDirection.DESC);
        return termsAggregation;
    }

    private appendLastModifiedAggregationQuery(contentQuery: ContentQuery) {

        let dateRangeAgg = new DateRangeAggregationQuery((ContentBrowseFilterPanel.LAST_MODIFIED_AGGREGATION_NAME));
        dateRangeAgg.setFieldName(QueryField.MODIFIED_TIME);
        dateRangeAgg.addRange(new DateRange('now-1h', null, i18n('field.lastModified.lessHour')));
        dateRangeAgg.addRange(new DateRange('now-1d', null, i18n('field.lastModified.lessDay')));
        dateRangeAgg.addRange(new DateRange('now-1w', null, i18n('field.lastModified.lessWeek')));

        contentQuery.addAggregationQuery(dateRangeAgg);
    }

    private toggleAggregationsVisibility(aggregations: Aggregation[]) {
        aggregations.forEach((aggregation: BucketAggregation) => {
            let aggregationIsEmpty = !aggregation.getBuckets().some((bucket: Bucket) => {
                if (bucket.docCount > 0) {
                    return true;
                }
            });

            let aggregationGroupView = aggregation.getName() === ContentBrowseFilterPanel.CONTENT_TYPE_AGGREGATION_NAME
                                       ? this.contentTypeAggregation
                                       : this.lastModifiedAggregation;

            if (aggregationIsEmpty) {
                aggregationGroupView.hide();
            } else {
                aggregationGroupView.show();
            }
        });
    }

}

export class DependenciesSection
    extends ConstraintSection {

    private viewer: ContentSummaryViewer = new ContentSummaryViewer();

    private inbound: boolean = true;
    private type: string;

    constructor(closeCallback: () => void) {
        super('', closeCallback);

        this.addClass('dependency');
        this.viewer.addClass('dependency-item');
        this.appendChild(this.viewer);
    }

    public getDependencyId(): ContentId {
        return new ContentId(this.getItemsIds()[0]);
    }

    public getType(): string {
        return this.type;
    }

    public isInbound(): boolean {
        return this.isActive() && this.inbound;
    }

    public isOutbound(): boolean {
        return this.isActive() && !this.inbound;
    }

    public setInbound(inbound: boolean): DependenciesSection {
        this.inbound = inbound;
        this.setLabel(inbound ? i18n('panel.filter.dependencies.inbound') : i18n('panel.filter.dependencies.outbound'));
        return this;
    }

    public setType(type: string): DependenciesSection {
        this.type = type;
        return this;
    }

    setDependencyItem(item: ContentSummary) {
        this.viewer.setObject(item);
    }
}
