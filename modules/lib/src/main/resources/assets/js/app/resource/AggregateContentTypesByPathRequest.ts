import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {
    TermsAggregationOrderDirection,
    TermsAggregationOrderType,
    TermsAggregationQuery
} from 'lib-admin-ui/query/aggregation/TermsAggregationQuery';
import {BucketAggregation} from 'lib-admin-ui/aggregation/BucketAggregation';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {AggregateContentTypesResult, ContentTypeAggregation} from './AggregateContentTypesResult';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentQueryRequest} from './ContentQueryRequest';
import {ContentQueryResult} from './ContentQueryResult';
import {ContentQuery} from '../content/ContentQuery';
import {Path} from 'lib-admin-ui/rest/Path';

export class AggregateContentTypesByPathRequest
    extends ContentResourceRequest<AggregateContentTypesResult> {

    private request: ContentQueryRequest<ContentSummaryJson, ContentSummary>;

    constructor(parentPath: ContentPath) {
        super();
        this.request = new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.buildAggregationsQuery(parentPath));

    }

    getRequestPath(): Path {
        return this.request.getRequestPath();
    }

    sendAndParse(): Q.Promise<AggregateContentTypesResult> {

        return this.request.sendAndParse().then((result: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
            return this.doParseResponse(result);
        });
    }

    private doParseResponse(result: ContentQueryResult<ContentSummary, ContentSummaryJson>): AggregateContentTypesResult {
        const aggregations: AggregateContentTypesResult = new AggregateContentTypesResult();

        (<BucketAggregation>result.getAggregations()[0]).getBuckets().forEach(bucket => {
            aggregations.addAggregation(new ContentTypeAggregation(new ContentTypeName(bucket.getKey()), bucket.getDocCount()));
        });

        return aggregations;
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
        termsAggregation.setOrderByType(TermsAggregationOrderType.DOC_COUNT);
        termsAggregation.setOrderByDirection(TermsAggregationOrderDirection.DESC);
        return termsAggregation;
    }
}
