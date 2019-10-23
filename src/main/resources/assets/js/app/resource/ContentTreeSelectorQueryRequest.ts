import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {Expression} from 'lib-admin-ui/query/expr/Expression';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentSelectorQueryRequest} from './ContentSelectorQueryRequest';
import {ContentTreeSelectorListJson} from './ContentTreeSelectorListResult';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentMetadata} from '../content/ContentMetadata';
import {PathMatchExpressionBuilder} from 'lib-admin-ui/query/PathMatchExpression';
import {Expand} from 'lib-admin-ui/rest/Expand';

export class ContentTreeSelectorQueryRequest<DATA extends ContentTreeSelectorItem>
    extends ContentResourceRequest<any, DATA[]> {

    private queryExpr: QueryExpr;

    private from: number = 0;

    private size: number = 10;//ContentTreeSelectorQueryRequest.DEFAULT_SIZE;

    private expand: Expand = Expand.SUMMARY;

    private content: ContentSummary;

    private inputName: string;

    private contentTypeNames: string[] = [];

    private allowedContentPaths: string[] = [];

    private relationshipType: string;

    private loaded: boolean;

    private results: ContentSummary[] = [];

    private metadata: ContentMetadata;

    private parentPath: ContentPath;

    private childOrder: ChildOrder;

    constructor() {
        super();
        super.setMethod('POST');

        this.setQueryExpr();
    }

    setInputName(name: string) {
        this.inputName = name;
    }

    getInputName(): string {
        return this.inputName;
    }

    setContent(content: ContentSummary) {
        this.content = content;
        this.setQueryExpr();
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

    setQueryExpr(searchString: string = '') {
        let fulltextExpression = this.createSearchExpression(searchString);

        this.queryExpr = new QueryExpr(fulltextExpression, ContentSelectorQueryRequest.DEFAULT_ORDER);
    }

    setParentContent(content: ContentSummary) {
        this.parentPath = content ? content.getPath() : null;
        this.childOrder = content ? content.getChildOrder() : null;
    }

    protected createSearchExpression(searchString: string): Expression {
        return new PathMatchExpressionBuilder()
            .setSearchString(searchString)
            .setPath(this.content ? this.content.getPath().toString() : '')
            .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
            .addField(new QueryField(QueryField.NAME, 3))
            .addField(new QueryField(QueryField.ALL))
            .build();
    }

    getAllowedContentPaths(): string[] {
        return this.allowedContentPaths;
    }

    getContentTypeNames(): string[] {
        return this.contentTypeNames;
    }

    getRelationshipType(): string {
        return this.relationshipType;
    }

    getQueryExpr(): QueryExpr {
        return this.queryExpr;
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'treeSelectorQuery');
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
            relationshipType: this.relationshipType,
            parentPath: this.parentPath ? this.parentPath.toString() : null,
            childOrder: this.childOrder ? this.childOrder.toString() : ''
        };
    }

    getMetadata(): ContentMetadata {
        return this.metadata;
    }

    sendAndParse(): Q.Promise<DATA[]> {
        return this.send().then((response: JsonResponse<ContentTreeSelectorListJson>) => {
            if (response.getResult() && response.getResult().items.length > 0) {
                this.metadata = new ContentMetadata(response.getResult().metadata['hits'], response.getResult().metadata['totalHits']);
                return response.getResult().items.map(json => <any>ContentTreeSelectorItem.fromJson(json));
            } else {
                this.metadata = new ContentMetadata(0, 0);
                return [];
            }
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
}
