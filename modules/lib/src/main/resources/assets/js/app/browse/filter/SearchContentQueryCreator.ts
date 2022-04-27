import {Bucket} from 'lib-admin-ui/aggregation/Bucket';
import {SearchInputValues} from 'lib-admin-ui/query/SearchInputValues';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentQuery} from '../../content/ContentQuery';
import {ValueFilter} from './ValueFilter';
import {ExistsFilter} from './ExistsFilter';
import {BooleanFilter} from 'lib-admin-ui/query/filter/BooleanFilter';
import {DateRangeBucket} from 'lib-admin-ui/aggregation/DateRangeBucket';
import {RangeFilter} from 'lib-admin-ui/query/filter/RangeFilter';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {Filter} from 'lib-admin-ui/query/filter/Filter';
import {
    TermsAggregationOrderDirection,
    TermsAggregationOrderType,
    TermsAggregationQuery
} from 'lib-admin-ui/query/aggregation/TermsAggregationQuery';
import {DateRangeAggregationQuery} from 'lib-admin-ui/query/aggregation/DateRangeAggregationQuery';
import {DateRange} from 'lib-admin-ui/query/aggregation/DateRange';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummaryRequest} from '../../resource/ContentSummaryRequest';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {LogicalExpr} from 'lib-admin-ui/query/expr/LogicalExpr';
import {LogicalOperator} from 'lib-admin-ui/query/expr/LogicalOperator';
import {Expression} from 'lib-admin-ui/query/expr/Expression';
import {FulltextSearchExpressionBuilder} from 'lib-admin-ui/query/FulltextSearchExpression';
import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {ContentId} from '../../content/ContentId';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {ContentAggregations} from './ContentAggregations';

export class SearchContentQueryCreator {

    private readonly searchInputValues: SearchInputValues;
    private readonly contentQuery: ContentQuery;

    private dependency?: { isInbound: boolean, dependencyId: ContentId };
    private constraintItems?: string[];
    private isAggregation: boolean;

    constructor(searchInputValues: SearchInputValues) {
        this.searchInputValues = searchInputValues;
        this.contentQuery = new ContentQuery();
    }

    setDependency(value: { isInbound: boolean, dependencyId: ContentId }): SearchContentQueryCreator {
        this.dependency = value;
        return this;
    }

    setConstraintItemsIds(value: string[]): SearchContentQueryCreator {
        this.constraintItems = value;
        return this;
    }

    setIsAggregation(value: boolean): SearchContentQueryCreator {
        this.isAggregation = value;
        return this;
    }

    create(): ContentQuery {
        this.appendQueryExpression();
        this.setSize();

        this.appendContentTypeFilter();
        this.appendWorkflowFilter();
        this.appendModifierFilter();
        this.appendOwnerFilter();
        this.appendLastModifiedFilter();
        this.appendOutboundReferencesFilter();

        this.appendContentTypesAggregationQuery();
        this.appendWorkflowAggregationQuery();
        this.appendModifierAggregationQuery();
        this.appendLastModifiedAggregationQuery();
        this.appendOwnerAggregationQuery();

        return this.contentQuery;
    }

    private setSize(): SearchContentQueryCreator {
        this.contentQuery.setSize(this.isAggregation ? 0 : ContentQuery.POSTLOAD_SIZE);
        return this;
    }

    private appendQueryExpression(): void {
        this.contentQuery.setQueryExpr(this.isAggregation ? new QueryExpr(null) : this.createQueryExpression());
    }

    private createQueryExpression(): QueryExpr {
        const searchExpr: LogicalExpr =
            new LogicalExpr(this.makeFulltextSearchExpr(), LogicalOperator.OR, this.createIdSearchExpr());

        if (this.constraintItems) {
            return new QueryExpr(new LogicalExpr(searchExpr, LogicalOperator.AND, this.makeSelectedItemsSearchExpr()),
                ContentSummaryRequest.ROOT_ORDER);
        }

        if (this.dependency?.isInbound) {
            return new QueryExpr(
                new LogicalExpr(searchExpr, LogicalOperator.AND, this.makeInboundDependenciesSearchExpr()),
                ContentSummaryRequest.ROOT_ORDER);
        }

        return new QueryExpr(searchExpr, ContentSummaryRequest.ROOT_ORDER);
    }

    private makeFulltextSearchExpr(): Expression {
        return new FulltextSearchExpressionBuilder()
            .setSearchString(this.searchInputValues.getTextSearchFieldValue())
            .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
            .addField(new QueryField(QueryField.NAME, 3))
            .addField(new QueryField(QueryField.ALL))
            .build();
    }

    private createIdSearchExpr(): Expression {
        return CompareExpr.eq(new FieldExpr(QueryField.ID), ValueExpr.string(this.searchInputValues.getTextSearchFieldValue()));
    }

    private makeSelectedItemsSearchExpr(): Expression {
        let query: QueryExpr;

        this.constraintItems.forEach((id: string) => {
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
        return new QueryExpr(new LogicalExpr(
            CompareExpr.eq(new FieldExpr(QueryField.REFERENCES), ValueExpr.string(this.dependency.dependencyId.toString())),
            LogicalOperator.AND,
            CompareExpr.neq(new FieldExpr(QueryField.ID), ValueExpr.string(this.dependency.dependencyId.toString()))));
    }

    private appendOutboundReferencesFilter(): void {
        if (this.dependency && !this.dependency.isInbound) {
            this.contentQuery.setMustBeReferencedById(this.dependency.dependencyId);
        }
    }

    private appendContentTypeFilter(): void {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(ContentAggregations.CONTENT_TYPE);

        if (selectedBuckets?.length > 0) {
            this.contentQuery.setContentTypeNames(selectedBuckets.map((bucket: Bucket) => new ContentTypeName(bucket.getKey())));
        }
    }

    private appendWorkflowFilter(): void {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(ContentAggregations.WORKFLOW);

        if (!selectedBuckets || selectedBuckets.length === 0) {
            return;
        }

        const inProgressKey: string = WorkflowState[WorkflowState.IN_PROGRESS].toLowerCase();

        // content might be rather ready or in progress, thus just one option can be chosen
        const hasInProgress: boolean =
            selectedBuckets.some((bucket: Bucket) => bucket.key === inProgressKey);

        if (hasInProgress) {
            this.contentQuery.addQueryFilter(new ValueFilter('workflow.state', inProgressKey.toUpperCase()));
            return;
        }

        const readyKey: string = WorkflowState[WorkflowState.READY].toLowerCase();
        const hasReady: boolean = selectedBuckets.some((bucket: Bucket) => bucket.key === readyKey);

        if (hasReady) {
            const notExistsFilter: BooleanFilter = new BooleanFilter();
            notExistsFilter.addMustNot(new ExistsFilter('workflow'));

            const booleanFilter: BooleanFilter = new BooleanFilter();
            booleanFilter.addShould(new ValueFilter('workflow.state', readyKey.toUpperCase()));
            booleanFilter.addShould(notExistsFilter);

            this.contentQuery.addQueryFilter(booleanFilter);
        }
    }

    private appendModifierFilter(): void {
        this.appendPrincipalFilter(ContentAggregations.MODIFIER, ContentAggregations.MODIFIER);
    }

    private appendOwnerFilter(): void {
        this.appendPrincipalFilter(ContentAggregations.OWNER, ContentAggregations.OWNER);
    }

    private appendPrincipalFilter(name: string, field: string): void {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(name);

        if (!selectedBuckets || selectedBuckets.length === 0) {
            return;
        }

        const booleanFilter: BooleanFilter = new BooleanFilter();

        selectedBuckets.forEach((bucket: Bucket) => {
            booleanFilter.addShould(new ValueFilter(field, bucket.key));
        });

        this.contentQuery.addQueryFilter(booleanFilter);
    }

    private appendLastModifiedFilter() {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(ContentAggregations.LAST_MODIFIED);

        if (!selectedBuckets || selectedBuckets.length === 0) {
            return;
        }

        if (selectedBuckets.length === 1) {
            const dateRangeBucket: DateRangeBucket = <DateRangeBucket>selectedBuckets.pop();
            this.contentQuery.addQueryFilter(
                new RangeFilter(QueryField.MODIFIED_TIME, ValueExpr.dateTime(dateRangeBucket.getFrom()).getValue(),
                    null));
            return;
        }

        const booleanFilter: BooleanFilter = new BooleanFilter();

        selectedBuckets.forEach((selectedBucket: DateRangeBucket) => {
            let rangeFilter: RangeFilter =
                new RangeFilter(QueryField.MODIFIED_TIME, ValueExpr.dateTime(selectedBucket.getFrom()).getValue(),
                    null);

            booleanFilter.addShould(<Filter>rangeFilter);
        });

        return booleanFilter;
    }

    private appendContentTypesAggregationQuery() {
        this.contentQuery.addAggregationQuery(this.createTermsAggregation((ContentAggregations.CONTENT_TYPE),
            QueryField.CONTENT_TYPE, 0));
    }

    private createTermsAggregation(name: string, fieldName: string, size: number): TermsAggregationQuery {
        const termsAggregation: TermsAggregationQuery = new TermsAggregationQuery(name);
        termsAggregation.setFieldName(fieldName);
        termsAggregation.setSize(size);
        termsAggregation.setOrderByType(TermsAggregationOrderType.DOC_COUNT);
        termsAggregation.setOrderByDirection(TermsAggregationOrderDirection.DESC);
        return termsAggregation;
    }

    private appendWorkflowAggregationQuery() {
        this.contentQuery.addAggregationQuery(this.createTermsAggregation(ContentAggregations.WORKFLOW, 'workflow.state', 0));
    }

    private appendModifierAggregationQuery() {
        this.contentQuery.addAggregationQuery(this.createTermsAggregation(ContentAggregations.MODIFIER, ContentAggregations.MODIFIER, 0));
    }

    private appendLastModifiedAggregationQuery() {
        const dateRangeAgg: DateRangeAggregationQuery = new DateRangeAggregationQuery((ContentAggregations.LAST_MODIFIED));
        dateRangeAgg.setFieldName(QueryField.MODIFIED_TIME);
        dateRangeAgg.addRange(new DateRange('now-1h', null, i18n('field.lastModified.lessHour')));
        dateRangeAgg.addRange(new DateRange('now-1d', null, i18n('field.lastModified.lessDay')));
        dateRangeAgg.addRange(new DateRange('now-1w', null, i18n('field.lastModified.lessWeek')));

        this.contentQuery.addAggregationQuery(dateRangeAgg);
    }

    private appendOwnerAggregationQuery() {
        this.contentQuery.addAggregationQuery(this.createTermsAggregation(ContentAggregations.OWNER, ContentAggregations.OWNER, 0));
    }
}
