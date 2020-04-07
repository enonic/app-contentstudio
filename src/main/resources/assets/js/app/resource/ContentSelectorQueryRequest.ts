import * as Q from 'q';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {OrderExpr} from 'lib-admin-ui/query/expr/OrderExpr';
import {FieldOrderExpr} from 'lib-admin-ui/query/expr/FieldOrderExpr';
import {OrderDirection} from 'lib-admin-ui/query/expr/OrderDirection';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {Expression} from 'lib-admin-ui/query/expr/Expression';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentQueryResultJson} from './json/ContentQueryResultJson';
import {ContentJson} from '../content/ContentJson';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {PathMatchExpressionBuilder} from 'lib-admin-ui/query/PathMatchExpression';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class ContentSelectorQueryRequest<CONTENT_JSON extends ContentSummaryJson, CONTENT extends ContentSummary>
    extends ContentResourceRequest<CONTENT[]> {

    public static DEFAULT_SIZE: number = 15;

    public static MODIFIED_TIME_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('modifiedTime'), OrderDirection.DESC);

    public static SCORE_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('_score'), OrderDirection.DESC);

    public static DEFAULT_ORDER: OrderExpr[] = [ContentSelectorQueryRequest.SCORE_DESC, ContentSelectorQueryRequest.MODIFIED_TIME_DESC];

    private queryExpr: QueryExpr;

    private from: number = 0;

    private loadingFrom: number;

    private size: number = ContentSelectorQueryRequest.DEFAULT_SIZE;

    private expand: Expand = Expand.SUMMARY;

    private content: ContentSummary;

    private inputName: string;

    private contentTypeNames: string[] = [];

    private allowedContentPaths: string[] = [];

    private relationshipType: string;

    private loaded: boolean;

    private results: CONTENT[] = [];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);

        this.setSearchString();
        this.addRequestPathElements('selectorQuery');
    }

    setInputName(name: string) {
        this.inputName = name;
    }

    getInputName(): string {
        return this.inputName;
    }

    setContent(content: ContentSummary) {
        this.content = content;
    }

    getContent(): ContentSummary {
        return this.content;
    }

    setFrom(from: number) {
        this.from = from;
    }

    getFrom(): number {
        return this.from;
    }

    setSize(size: number) {
        this.size = size;
    }

    getSize(): number {
        return this.size;
    }

    setContentTypeNames(contentTypeNames: string[]) {
        this.contentTypeNames = contentTypeNames;
    }

    setAllowedContentPaths(allowedContentPaths: string[]) {
        this.allowedContentPaths = allowedContentPaths;
    }

    setRelationshipType(relationshipType: string) {
        this.relationshipType = relationshipType;
    }

    setExpand(expand: Expand) {
        this.expand = expand;
    }

    getExpand(): Expand {
        return this.expand;
    }

    setSearchString(searchString: string = '') {
        let fulltextExpression = this.createSearchExpression(searchString);

        this.queryExpr = new QueryExpr(fulltextExpression, ContentSelectorQueryRequest.DEFAULT_ORDER);
    }

    setQueryExpr(queryExpr: QueryExpr) {
        this.queryExpr = queryExpr;
    }

    private createSearchExpression(searchString: string): Expression {
        return new PathMatchExpressionBuilder()
            .setSearchString(searchString)
            .setPath(this.content ? this.content.getPath().toString() : '')
            .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
            .addField(new QueryField(QueryField.NAME, 3))
            .addField(new QueryField(QueryField.ALL))
            .build();
    }

    getQueryExpr(): QueryExpr {
        return this.queryExpr;
    }

    isPartiallyLoaded(): boolean {
        return this.results.length > 0 && !this.loaded;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    resetParams() {
        this.from = 0;
        this.loaded = false;
    }

    getParams(): Object {
        let queryExprAsString = this.getQueryExpr() ? this.getQueryExpr().toString() : '';

        return {
            queryExpr: queryExprAsString,
            from: this.getFrom(),
            size: this.getSize(),
            expand: this.expandAsString(),
            contentId: this.content ? this.content.getId().toString() : null,
            inputName: this.getInputName(),
            contentTypeNames: this.contentTypeNames,
            allowedContentPaths: this.allowedContentPaths,
            relationshipType: this.relationshipType
        };
    }

    private isConcurrentLoad() {
        return this.from === this.loadingFrom;
    }

    sendAndParse(): Q.Promise<CONTENT[]> {
        if (this.isConcurrentLoad()) {
            return Q(this.results);
        }

        this.loadingFrom = this.from;

        return super.sendAndParse().catch(() => {
            return [];
        });
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

    protected parseResponse(response: JsonResponse<ContentQueryResultJson<CONTENT_JSON>>): CONTENT[] {
        let responseResult: ContentQueryResultJson<CONTENT_JSON> = response.getResult();

        let contentsAsJson: ContentSummaryJson[] = responseResult.contents;

        let contents: CONTENT[];

        if (this.expand === Expand.SUMMARY) {
            contents = <any[]> this.fromJsonToContentSummaryArray(<ContentSummaryJson[]>contentsAsJson);
        } else {
            contents = <any[]>this.fromJsonToContentArray(<ContentJson[]>contentsAsJson);
        }

        if (this.from === 0) {
            this.results = [];
        }
        this.loadingFrom = undefined;
        this.from += responseResult.metadata['hits'];
        this.loaded = this.from >= responseResult.metadata['totalHits'];

        this.results = this.results.concat(contents);

        return this.results;
    }
}
