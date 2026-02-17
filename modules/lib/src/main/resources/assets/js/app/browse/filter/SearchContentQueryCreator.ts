import {type Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {type SearchInputValues} from '@enonic/lib-admin-ui/query/SearchInputValues';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentQuery} from '../../content/ContentQuery';
import {ValueFilter} from './ValueFilter';
import {ExistsFilter} from './ExistsFilter';
import {BooleanFilter} from '@enonic/lib-admin-ui/query/filter/BooleanFilter';
import {type DateRangeBucket} from '@enonic/lib-admin-ui/aggregation/DateRangeBucket';
import {RangeFilter} from '@enonic/lib-admin-ui/query/filter/RangeFilter';
import {QueryField} from '@enonic/lib-admin-ui/query/QueryField';
import {ValueExpr} from '@enonic/lib-admin-ui/query/expr/ValueExpr';
import {type Filter} from '@enonic/lib-admin-ui/query/filter/Filter';
import {
    TermsAggregationOrderDirection,
    TermsAggregationOrderType,
    TermsAggregationQuery
} from '@enonic/lib-admin-ui/query/aggregation/TermsAggregationQuery';
import {DateRangeAggregationQuery} from '@enonic/lib-admin-ui/query/aggregation/DateRangeAggregationQuery';
import {DateRange} from '@enonic/lib-admin-ui/query/aggregation/DateRange';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentId} from '../../content/ContentId';
import {ContentAggregation} from './ContentAggregation';
import {WorkflowState} from '../../content/WorkflowState';

export class SearchContentQueryCreator {

    private readonly searchInputValues: SearchInputValues;
    private readonly contentQuery: ContentQuery;

    private dependency?: { isInbound: boolean, dependencyId: ContentId };
    private constraintItems?: string[];

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

    create(contentAggregations?: string[]): ContentQuery {
        this.appendQueryParams();
        this.contentQuery.setSize(ContentQuery.POSTLOAD_SIZE);

        this.appendAggregationsAndFilter(contentAggregations);
        this.appendOutboundReferencesFilter();

        return this.contentQuery;
    }

    protected appendAggregationsAndFilter(contentAggregations?: string[]): void {
        const hasAllAggregations: boolean = !contentAggregations;

        if (hasAllAggregations || contentAggregations.some((a: string) => a === ContentAggregation.CONTENT_TYPE.toString())) {
            this.appendContentTypeFilter();
            this.appendContentTypesAggregationQuery();
        }

        if (hasAllAggregations || contentAggregations.some((a: string) => a === ContentAggregation.WORKFLOW.toString())) {
            this.appendWorkflowFilter();
            this.appendWorkflowAggregationQuery();
        }

        if (hasAllAggregations || contentAggregations.some((a: string) => a === ContentAggregation.MODIFIED_BY.toString())) {
            this.appendModifierFilter();
            this.appendModifierAggregationQuery();
        }

        if (hasAllAggregations || contentAggregations.some((a: string) => a === ContentAggregation.OWNER.toString())) {
            this.appendOwnerFilter();
            this.appendOwnerAggregationQuery();
        }

        if (hasAllAggregations || contentAggregations.some((a: string) => a === ContentAggregation.LAST_MODIFIED.toString())) {
            this.appendLastModifiedFilter();
            this.appendLastModifiedAggregationQuery();
        }

        if (hasAllAggregations || contentAggregations.some((a: string) => a === ContentAggregation.LANGUAGE.toString())) {
            this.appendLanguageFilter();
            this.appendLanguageAggregationQuery();
        }
    }

    private appendQueryParams(): void {
        this.contentQuery.setQuery(this.makeQueryJson());
        this.contentQuery.setQuerySort(this.makeSort());
    }

    private makeQueryJson(): object {
        if (this.constraintItems?.length > 0) {
            return this.containsTextAndMatchesIdsOnConstraintsJson();
        }

        if (this.dependency?.isInbound) {
            return this.containsTextOrMatchesIdOnInboundIds();
        }

        return this.createContainsTextOrMatchesIdJson();
    }

    private containsTextAndMatchesIdsOnConstraintsJson(): object {
        return {
            'boolean': {
                'must': [
                    this.createContainsTextOrMatchesIdJson(),
                    this.createConstraintsJson()
                ]
            }
        };
    }

    private createConstraintsJson(): object {
        return {
            'in': {
                'field': '_id',
                'values': this.constraintItems
            }
        };
    }

    private createContainsTextOrMatchesIdJson(): object {
        if (this.searchInputValues.textSearchFieldValue) {
            return this.createContainsTextAndMatchesIdJson();
        }

        return this.matchAllQuery();
    }

    private createContainsTextAndMatchesIdJson(): object {
        const textValue: string = this.searchInputValues.textSearchFieldValue;

        return {
            'boolean': {
                'should': [
                    {
                        'boolean': {
                            'should': [
                                {
                                    'fulltext': {
                                        'fields': [
                                            'displayName^5',
                                            '_name^3',
                                            '_allText'
                                        ],
                                        'query': textValue,
                                        'operator': 'AND'
                                    }
                                },
                                {
                                    'ngram': {
                                        'fields': [
                                            'displayName^5',
                                            '_name^3',
                                            '_allText'
                                        ],
                                        'query': textValue,
                                        'operator': 'AND'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        'term': {
                            'field': '_id',
                            'value': textValue
                        }
                    }
                ]
            }
        };
    }

    private matchAllQuery(): object {
        return {
            'matchAll': {}
        };
    }

    private containsTextOrMatchesIdOnInboundIds(): object {
        return {
            'boolean': {
                'must': [
                    this.createContainsTextOrMatchesIdJson(),
                    this.createInboundRefsJson()
                ]
            }
        };
    }

    private createInboundRefsJson(): object {
        return  {
            'boolean': {
                'must': [
                    {
                        'term': {
                            'field': '_references',
                            'value': this.dependency.dependencyId.toString()
                        }
                    },
                    {
                        'boolean': {
                            'mustNot': {
                                'term': {
                                    'field': '_id',
                                    'value': this.dependency.dependencyId.toString()
                                }
                            }
                        }
                    }
                ]
            }
        };
    }

    private makeSort(): object[] {
        return [
            {
                'field': '_score'
            },
            {
                'field': '_path',
                'direction': 'ASC'
            }
        ];
    }

    private appendOutboundReferencesFilter(): void {
        if (this.dependency && !this.dependency.isInbound) {
            this.contentQuery.setMustBeReferencedById(this.dependency.dependencyId);
        }
    }

    private appendContentTypeFilter(): void {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(ContentAggregation.CONTENT_TYPE);

        if (selectedBuckets?.length > 0) {
            this.contentQuery.setContentTypeNames(selectedBuckets.map((bucket: Bucket) => new ContentTypeName(bucket.getKey())));
        }
    }

    private appendWorkflowFilter(): void {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(ContentAggregation.WORKFLOW);

        if (!selectedBuckets || selectedBuckets.length === 0) {
            return;
        }

        const booleanFilter: BooleanFilter = new BooleanFilter();

        selectedBuckets.forEach((bucket: Bucket) => {
            booleanFilter.addShould(new ValueFilter('workflow.state',bucket.getKey().toUpperCase()));

            if (bucket.key === WorkflowState.READY.toString()) {
                booleanFilter.addShould(this.createWorkflowNotExistsFilter());
            }
        });

        this.contentQuery.addQueryFilter(booleanFilter);
    }

    private createWorkflowNotExistsFilter(): BooleanFilter {
        const notExistsFilter: BooleanFilter = new BooleanFilter();
        notExistsFilter.addMustNot(new ExistsFilter('workflow'));
        return notExistsFilter;
    }

    private appendModifierFilter(): void {
        this.appendPropertyFilter(ContentAggregation.MODIFIED_BY);
    }

    private appendOwnerFilter(): void {
        this.appendPropertyFilter(ContentAggregation.OWNER);
    }

    protected appendPropertyFilter(name: string, field?: string): void {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(name);

        if (!selectedBuckets || selectedBuckets.length === 0) {
            return;
        }

        const booleanFilter: BooleanFilter = new BooleanFilter();

        selectedBuckets.forEach((bucket: Bucket) => {
            booleanFilter.addShould(new ValueFilter(field || name, bucket.key));
        });

        this.contentQuery.addQueryFilter(booleanFilter);
    }

    private appendLanguageFilter(): void {
        this.appendPropertyFilter(ContentAggregation.LANGUAGE, 'language');
    }

    private appendLastModifiedFilter(): void {
        this.appendDateFilter(ContentAggregation.LAST_MODIFIED, QueryField.MODIFIED_TIME);
    }

    protected appendDateFilter(name: string, fieldName): void {
        const selectedBuckets: Bucket[] = this.searchInputValues.getSelectedValuesForAggregationName(name);

        if (!selectedBuckets || selectedBuckets.length === 0) {
            return;
        }

        const booleanFilter: BooleanFilter = new BooleanFilter();

        selectedBuckets.forEach((selectedBucket: DateRangeBucket) => {
            const rangeFilter: RangeFilter =
                new RangeFilter(fieldName, ValueExpr.dateTime(selectedBucket.getFrom()).getValue(),
                    null);

            booleanFilter.addShould(rangeFilter as Filter);
        });

        this.contentQuery.addQueryFilter(booleanFilter);
    }

    private appendContentTypesAggregationQuery() {
        this.addTermsAggregation(ContentAggregation.CONTENT_TYPE, QueryField.CONTENT_TYPE);
    }

    protected createTermsAggregation(name: string, fieldName: string, size: number): TermsAggregationQuery {
        const termsAggregation: TermsAggregationQuery = new TermsAggregationQuery(name);
        termsAggregation.setFieldName(fieldName);
        termsAggregation.setSize(size);
        termsAggregation.setOrderByType(TermsAggregationOrderType.DOC_COUNT);
        termsAggregation.setOrderByDirection(TermsAggregationOrderDirection.DESC);
        return termsAggregation;
    }

    private appendWorkflowAggregationQuery() {
        this.addTermsAggregation(ContentAggregation.WORKFLOW, 'workflow.state');
    }

    private appendModifierAggregationQuery() {
        this.addTermsAggregation(ContentAggregation.MODIFIED_BY);
    }

    private appendLastModifiedAggregationQuery() {
        this.appendDateAggregationQuery(ContentAggregation.LAST_MODIFIED, QueryField.MODIFIED_TIME);
    }

    protected appendDateAggregationQuery(name: string, fieldName: string): void {
        const dateRangeAgg: DateRangeAggregationQuery = new DateRangeAggregationQuery(name);

        dateRangeAgg.setFieldName(fieldName);
        dateRangeAgg.addRange(new DateRange('now-1h', null, i18n('field.lastModified.lessHour')));
        dateRangeAgg.addRange(new DateRange('now-1d', null, i18n('field.lastModified.lessDay')));
        dateRangeAgg.addRange(new DateRange('now-1w', null, i18n('field.lastModified.lessWeek')));

        this.contentQuery.addAggregationQuery(dateRangeAgg);
    }

    private appendOwnerAggregationQuery() {
        this.addTermsAggregation(ContentAggregation.OWNER);
    }

    private appendLanguageAggregationQuery() {
        this.addTermsAggregation(ContentAggregation.LANGUAGE, 'language');
    }

    protected addTermsAggregation(name: string, fieldName?: string): void {
        this.contentQuery.addAggregationQuery(this.createTermsAggregation(name, fieldName || name, 0));
    }
}
