import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {OrderExpr} from 'lib-admin-ui/query/expr/OrderExpr';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {FieldOrderExpr} from 'lib-admin-ui/query/expr/FieldOrderExpr';
import {OrderDirection} from 'lib-admin-ui/query/expr/OrderDirection';
import {ConstraintExpr} from 'lib-admin-ui/query/expr/ConstraintExpr';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentQueryRequest} from './ContentQueryRequest';
import {ContentQueryResult} from './ContentQueryResult';
import {ContentQueryResultJson} from './json/ContentQueryResultJson';
import {ContentQuery} from '../content/ContentQuery';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {PathMatchExpressionBuilder} from 'lib-admin-ui/query/PathMatchExpression';

export class ContentSummaryRequest
    extends ResourceRequest<ContentSummary[]> {

    private path: ContentPath;

    private searchString: string = '';

    private request: ContentQueryRequest<ContentSummaryJson, ContentSummary>;

    public static MODIFIED_TIME_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('modifiedTime'), OrderDirection.DESC);

    public static SCORE_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('_score'), OrderDirection.DESC);

    public static PATH_ASC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('_path'), OrderDirection.ASC);

    public static DEFAULT_ORDER: FieldOrderExpr[] = [ContentSummaryRequest.SCORE_DESC, ContentSummaryRequest.MODIFIED_TIME_DESC];

    public static ROOT_ORDER: FieldOrderExpr[] = [ContentSummaryRequest.SCORE_DESC, ContentSummaryRequest.PATH_ASC];

    constructor() {
        super();
        this.request =
            new ContentQueryRequest<ContentSummaryJson, ContentSummary>(new ContentQuery()).setExpand(Expand.SUMMARY);
    }

    getSearchString(): string {
        return this.searchString;
    }

    getRestPath(): Path {
        return this.request.getRestPath();
    }

    getRequestPath(): Path {
        return this.request.getRequestPath();
    }

    getContentPath(): ContentPath {
        return this.path;
    }

    getParams(): Object {
        return this.request.getParams();
    }

    send(): Q.Promise<JsonResponse<ContentQueryResultJson<ContentSummaryJson>>> {
        this.buildSearchQueryExpr();

        return <any>this.request.send();
    }

    sendAndParse(): Q.Promise<ContentSummary[]> {
        this.buildSearchQueryExpr();

        return this.request.sendAndParse().then(
            (queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                return queryResult.getContents();
            });
    }

    setAllowedContentTypes(contentTypes: string[]) {
        this.request.getContentQuery().setContentTypeNames(this.createContentTypeNames(contentTypes));
    }

    setAllowedContentTypeNames(contentTypeNames: ContentTypeName[]) {
        this.request.getContentQuery().setContentTypeNames(contentTypeNames);
    }

    setSize(size: number) {
        this.request.getContentQuery().setSize(size);
    }

    setContentPath(path: ContentPath) {
        this.path = path;
    }

    setSearchString(value: string = '') {
        this.searchString = value;
    }

    isPartiallyLoaded(): boolean {
        return this.request.isPartiallyLoaded();
    }

    resetParams() {
        this.request.resetParams();
    }

    private buildSearchQueryExpr() {
        this.request.getContentQuery().setQueryExpr(new QueryExpr(this.createSearchExpression(), this.getDefaultOrder()));
    }

    protected getDefaultOrder(): OrderExpr[] {
        return ContentSummaryRequest.DEFAULT_ORDER;
    }

    protected createSearchExpression(): ConstraintExpr {
        return new PathMatchExpressionBuilder()
            .setSearchString(this.searchString)
            .setPath(this.path ? this.path.toString() : '')
            .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
            .addField(new QueryField(QueryField.NAME, 3))
            .addField(new QueryField(QueryField.ALL))
            .build();
    }

    private createContentTypeNames(names: string[]): ContentTypeName[] {
        return (names || []).map((name: string) => new ContentTypeName(name));
    }
}
