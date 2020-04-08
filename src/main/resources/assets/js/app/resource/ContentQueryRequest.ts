import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {AggregationQueryTypeWrapperJson} from 'lib-admin-ui/query/aggregation/AggregationQueryTypeWrapperJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentQueryResultJson} from './json/ContentQueryResultJson';
import {ContentQueryResult} from './ContentQueryResult';
import {ContentMetadata} from '../content/ContentMetadata';
import {ContentJson} from '../content/ContentJson';
import {ContentQuery} from '../content/ContentQuery';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {BucketAggregation} from 'lib-admin-ui/aggregation/BucketAggregation';
import {AggregationQuery} from 'lib-admin-ui/query/aggregation/AggregationQuery';
import {FilterTypeWrapperJson} from 'lib-admin-ui/query/filter/FilterTypeWrapperJson';
import {Filter} from 'lib-admin-ui/query/filter/Filter';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class ContentQueryRequest<CONTENT_JSON extends ContentSummaryJson, CONTENT extends ContentSummary>
    extends ContentResourceRequest<ContentQueryResult<CONTENT, CONTENT_JSON>> {

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

        let queryExprAsString = this.contentQuery.getQueryExpr() ? this.contentQuery.getQueryExpr().toString() : '';

        return {
            queryExpr: queryExprAsString,
            from: this.contentQuery.getFrom(),
            size: this.contentQuery.getSize(),
            contentTypeNames: this.contentTypeNamesAsString(this.contentQuery.getContentTypes()),
            mustBeReferencedById: this.getMustBereferencedById(),
            expand: this.expandAsString(),
            aggregationQueries: this.aggregationQueriesToJson(this.contentQuery.getAggregationQueries()),
            queryFilters: this.queryFiltersToJson(this.contentQuery.getQueryFilters())
        };
    }

    protected parseResponse(response: JsonResponse<ContentQueryResultJson<CONTENT_JSON>>): ContentQueryResult<CONTENT, CONTENT_JSON> {
        let responseResult: ContentQueryResultJson<CONTENT_JSON> = response.getResult();
        let aggregations = BucketAggregation.fromJsonArray(responseResult.aggregations);
        let contentsAsJson: ContentSummaryJson[] = responseResult.contents;
        let metadata = new ContentMetadata(response.getResult().metadata['hits'], response.getResult().metadata['totalHits']);
        let contents: CONTENT[];

        if (this.expand === Expand.NONE) {
            contents = <any[]> this.fromJsonToContentIdBaseItemArray(contentsAsJson);
        } else if (this.expand === Expand.SUMMARY) {
            contents = <any[]> this.fromJsonToContentSummaryArray(<ContentSummaryJson[]>contentsAsJson);
        } else {
            contents = <any[]>this.fromJsonToContentArray(<ContentJson[]>contentsAsJson);
        }

        this.updateStateAfterLoad(contents, metadata);

        return new ContentQueryResult<CONTENT, CONTENT_JSON>(this.results, aggregations, <CONTENT_JSON[]>contentsAsJson, metadata);
    }

    private updateStateAfterLoad(contents: CONTENT[], metadata: ContentMetadata) {
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
