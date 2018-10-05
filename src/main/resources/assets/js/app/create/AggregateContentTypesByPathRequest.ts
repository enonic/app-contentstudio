import ContentQuery = api.content.query.ContentQuery;
import CompareExpr = api.query.expr.CompareExpr;
import ValueExpr = api.query.expr.ValueExpr;
import FieldExpr = api.query.expr.FieldExpr;
import QueryExpr = api.query.expr.QueryExpr;
import TermsAggregationQuery = api.query.aggregation.TermsAggregationQuery;
import ContentQueryResult = api.content.resource.result.ContentQueryResult;
import BucketAggregation = api.aggregation.BucketAggregation;
import ContentTypeName = api.schema.content.ContentTypeName;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import QueryField = api.query.QueryField;
import ContentSummary = api.content.ContentSummary;
import ContentQueryRequest = api.content.resource.ContentQueryRequest;
import ContentPath = api.content.ContentPath;
import {AggregateContentTypesResult, ContentTypeAggregation} from './AggregateContentTypesResult';
import {ContentResourceRequest} from '../resource/ContentResourceRequest';

export class AggregateContentTypesByPathRequest
    extends ContentResourceRequest<ContentQueryResult<ContentSummary, ContentSummaryJson>, AggregateContentTypesResult> {

    private request: ContentQueryRequest<ContentSummaryJson, ContentSummary>;

    constructor(parentPath: ContentPath) {
        super();
        super.setMethod('GET');
        this.request = new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.buildAggregationsQuery(parentPath));

    }

    getRequestPath(): api.rest.Path {
        return this.request.getRequestPath();
    }

    sendAndParse(): wemQ.Promise<AggregateContentTypesResult> {

        return this.request.sendAndParse().then((result: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
            const aggregations: AggregateContentTypesResult = new AggregateContentTypesResult();

            (<BucketAggregation>result.getAggregations()[0]).getBuckets().forEach(bucket => {
                aggregations.addAggregation(new ContentTypeAggregation(new ContentTypeName(bucket.getKey()), bucket.getDocCount()));
            });

            return aggregations;
        });
    }

    private buildAggregationsQuery(parentPath: ContentPath): ContentQuery {
        let contentQuery: ContentQuery = new ContentQuery();
        contentQuery.setQueryExpr(new QueryExpr(CompareExpr.eq(new FieldExpr('_parentPath'),
            ValueExpr.string('/content' + (parentPath.isRoot() ? '' : parentPath.toString())))));

        contentQuery.setSize(0);
        contentQuery.setFrom(0);
        this.appendContentTypesAggregationQuery(contentQuery);

        return contentQuery;
    }

    private appendContentTypesAggregationQuery(contentQuery: ContentQuery) {
        contentQuery.addAggregationQuery(this.createTermsAggregation('contentTypes',
            QueryField.CONTENT_TYPE, 0));
    }

    private createTermsAggregation(name: string, fieldName: string, size: number): TermsAggregationQuery {
        let termsAggregation = new TermsAggregationQuery(name);
        termsAggregation.setFieldName(fieldName);
        termsAggregation.setSize(size);
        termsAggregation.setOrderByType(api.query.aggregation.TermsAggregationOrderType.DOC_COUNT);
        termsAggregation.setOrderByDirection(api.query.aggregation.TermsAggregationOrderDirection.DESC);
        return termsAggregation;
    }
}
