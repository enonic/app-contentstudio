import {OrderExpr} from '@enonic/lib-admin-ui/query/expr/OrderExpr';
import {FieldOrderExpr} from '@enonic/lib-admin-ui/query/expr/FieldOrderExpr';
import {OrderDirection} from '@enonic/lib-admin-ui/query/expr/OrderDirection';
import {FieldExpr} from '@enonic/lib-admin-ui/query/expr/FieldExpr';
import {Expression} from '@enonic/lib-admin-ui/query/expr/Expression';
import {QueryField} from '@enonic/lib-admin-ui/query/QueryField';
import {QueryExpr} from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {PathMatchExpressionBuilder} from '@enonic/lib-admin-ui/query/PathMatchExpression';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentSummary} from '../content/ContentSummary';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ResultMetadata} from './ResultMetadata';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';

export abstract class ContentSelectorRequest<CONTENT>
    extends CmsContentResourceRequest<CONTENT[]> {

    public static MODIFIED_TIME_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('modifiedTime'), OrderDirection.DESC);

    public static SCORE_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('_score'), OrderDirection.DESC);

    public static DEFAULT_ORDER: OrderExpr[] = [ContentSelectorRequest.SCORE_DESC, ContentSelectorRequest.MODIFIED_TIME_DESC];

    protected queryExpr: QueryExpr;

    protected from: number = 0;

    protected size: number;

    private expand: Expand = Expand.SUMMARY;

    protected content: ContentSummary;

    private inputName: string;

    private contentTypeNames: string[] = [];

    private allowedContentPaths: string[] = [];

    private relationshipType: string;

    private applicationKey: ApplicationKey;

    protected loaded: boolean;

    protected results: CONTENT[] = [];

    protected constructor() {
        super();
        this.setMethod(HttpMethod.POST);

        this.setSearchString();
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

    getContentTypeNames(): string[] {
        return this.contentTypeNames;
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

        this.queryExpr = new QueryExpr(fulltextExpression, ContentSelectorRequest.DEFAULT_ORDER);
    }

    setQueryExpr(queryExpr: QueryExpr) {
        this.queryExpr = queryExpr;
    }

    setApplicationKey(key: ApplicationKey): void {
        this.applicationKey = key;
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

    getParams(): object {
        const queryExprAsString = this.getQueryExpr() ? this.getQueryExpr().toString() : '';

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
            applicationKey: this.applicationKey?.toString() || null
        };
    }

    abstract getMetadata(): ResultMetadata;

    protected expandAsString(): string {
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
