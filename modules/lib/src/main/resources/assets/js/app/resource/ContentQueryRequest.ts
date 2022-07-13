import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {AggregationQueryTypeWrapperJson} from '@enonic/lib-admin-ui/query/aggregation/AggregationQueryTypeWrapperJson';
import {ContentQueryResultJson} from './json/ContentQueryResultJson';
import {ContentQueryResult} from './ContentQueryResult';
import {ResultMetadata} from './ResultMetadata';
import {ContentJson} from '../content/ContentJson';
import {ContentQuery} from '../content/ContentQuery';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {AggregationQuery} from '@enonic/lib-admin-ui/query/aggregation/AggregationQuery';
import {FilterTypeWrapperJson} from '@enonic/lib-admin-ui/query/filter/FilterTypeWrapperJson';
import {Filter} from '@enonic/lib-admin-ui/query/filter/Filter';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ContentQueryRequest<CONTENT_JSON extends ContentSummaryJson, CONTENT extends ContentSummary>
    extends CmsContentResourceRequest<ContentQueryResult<CONTENT, CONTENT_JSON>> {

    private contentQuery: ContentQuery;

    private expand: Expand = Expand.SUMMARY;

    private allLoaded: boolean = false;

    private results: CONTENT[] = [];

    constructor(contentQuery: ContentQuery) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentQuery = contentQuery;
        this.addRequestPathElements('query');
    }

    getContentQuery(): ContentQuery {
        return this.contentQuery;
    }

    setExpand(expand: Expand): ContentQueryRequest<CONTENT_JSON, CONTENT> {
        this.expand = expand;
        return this;
    }

    isPartiallyLoaded(): boolean {
        return this.results.length > 0 && !this.allLoaded;
    }

    resetParams() {
        this.allLoaded = false;
        this.contentQuery.setFrom(this.contentQuery.getFrom() >= 0 ? 0 : -1);
    }

    getParams(): Object {
        const queryExprAsString: string = this.contentQuery.getQueryExpr()?.toString();

        return {
            queryExpr: queryExprAsString,
            from: this.contentQuery.getFrom(),
            size: this.contentQuery.getSize(),
            contentTypeNames: this.contentTypeNamesAsString(this.contentQuery.getContentTypes()),
            mustBeReferencedById: this.getMustBereferencedById(),
            expand: this.expandAsString(),
            aggregationQueries: this.aggregationQueriesToJson(this.contentQuery.getAggregationQueries()),
            queryFilters: this.queryFiltersToJson(this.contentQuery.getQueryFilters()),
            query: this.contentQuery.getQuery(),
            querySort: this.contentQuery.getQuerySort()
        };
    }

    protected parseResponse(response: JsonResponse<ContentQueryResultJson<CONTENT_JSON>>): ContentQueryResult<CONTENT, CONTENT_JSON> {
        let responseResult: ContentQueryResultJson<CONTENT_JSON> = response.getResult();
        let aggregations = BucketAggregation.fromJsonArray(responseResult.aggregations);
        let contentsAsJson: ContentSummaryJson[] = responseResult.contents;
        let metadata = new ResultMetadata(response.getResult().metadata.hits, response.getResult().metadata.totalHits);
        let contents: CONTENT[];

        if (this.expand === Expand.NONE) {
            contents = <any[]> this.fromJsonToContentIdBaseItemArray(contentsAsJson);
        } else if (this.expand === Expand.SUMMARY) {
            contents = <any[]>this.fromJsonToContentSummaryArray(contentsAsJson);
        } else {
            contents = <any[]>this.fromJsonToContentArray(<ContentJson[]>contentsAsJson);
        }

        this.updateStateAfterLoad(contents, metadata);

        return new ContentQueryResult<CONTENT, CONTENT_JSON>(this.results, aggregations, <CONTENT_JSON[]>contentsAsJson, metadata);
    }

    private updateStateAfterLoad(contents: CONTENT[], metadata: ResultMetadata) {
        if (this.contentQuery.getFrom() === 0) {
            this.results = [];
        }

        this.results = this.results.concat(contents);

        this.allLoaded = (this.contentQuery.getFrom() + metadata.getHits()) >= metadata.getTotalHits();
        this.contentQuery.setFrom(this.contentQuery.getFrom() + metadata.getHits());
    }

    private getMustBereferencedById(): string {
        let contentId = this.contentQuery.getMustBeReferencedById();
        if (!!contentId) {
            return contentId.toString();
        }
        return null;
    }

    private aggregationQueriesToJson(aggregationQueries: AggregationQuery[]): AggregationQueryTypeWrapperJson[] {
        let aggregationQueryJsons: AggregationQueryTypeWrapperJson[] = [];

        if (aggregationQueries == null) {
            return aggregationQueryJsons;
        }

        aggregationQueries.forEach((aggregationQuery: AggregationQuery) => {
            aggregationQueryJsons.push(aggregationQuery.toJson());
        });

        return aggregationQueryJsons;
    }

    private queryFiltersToJson(queryFilters: Filter[]): FilterTypeWrapperJson[] {

        let queryFilterJsons: FilterTypeWrapperJson[] = [];

        if (queryFilters == null || queryFilters.length === 0) {
            return queryFilterJsons;
        }

        queryFilters.forEach((queryFilter: Filter) => {

            queryFilterJsons.push(queryFilter.toJson());

        });

        return queryFilterJsons;
    }

    private expandAsString(): string {
        switch (this.expand) {
        case Expand.FULL:
            return 'full';
        case Expand.SUMMARY:
            return 'summary';
        case Expand.NONE:
            return 'none';
        default:
            return 'summary';
        }
    }

    contentTypeNamesAsString(names: ContentTypeName[]): string[] {
        let result: string[] = [];

        names.forEach((name: ContentTypeName) => {
            result.push(name.toString());
        });

        return result;
    }

    fromJsonToContentIdBaseItem(json: ContentSummaryJson): ContentSummary {
        return ContentSummary.fromJson(json);
    }

    fromJsonToContentIdBaseItemArray(jsonArray: ContentSummaryJson[]): ContentSummary[] {

        return ContentSummary.fromJsonArray(jsonArray);
    }
}
