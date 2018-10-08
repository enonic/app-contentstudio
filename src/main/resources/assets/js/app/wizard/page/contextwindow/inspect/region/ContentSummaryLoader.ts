import ContentPath = api.content.ContentPath;
import ContentSummary = api.content.ContentSummary;
import PostLoader = api.util.loader.PostLoader;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import {ContentSummaryRequest} from '../../../../../resource/ContentSummaryRequest';
import {ContentQueryResultJson} from '../../../../../resource/json/ContentQueryResultJson';
import {GetContentSummaryByIds} from '../../../../../resource/GetContentSummaryByIds';

export class ContentSummaryLoader
    extends PostLoader<ContentQueryResultJson<ContentSummaryJson>, ContentSummary> {

    protected request: ContentSummaryRequest;

    constructor() {
        super();

        this.setSearchQueryExpr();
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<ContentSummary[]> {
        let contentIds = ids.split(';').map((id) => {
            return new api.content.ContentId(id);
        });

        return new GetContentSummaryByIds(contentIds).sendAndParse();
    }

    protected createRequest(): ContentSummaryRequest {
        return new ContentSummaryRequest();
    }

    protected getRequest(): ContentSummaryRequest {
        return this.request;
    }

    setAllowedContentTypes(contentTypes: string[]) {
        this.getRequest().setAllowedContentTypes(contentTypes);
    }

    setAllowedContentTypeNames(contentTypeNames: api.schema.content.ContentTypeName[]) {
        this.getRequest().setAllowedContentTypeNames(contentTypeNames);
    }

    setSize(size: number) {
        this.getRequest().setSize(size);
    }

    setContentPath(path: ContentPath) {
        this.getRequest().setContentPath(path);
    }

    isPartiallyLoaded(): boolean {
        return this.getRequest().isPartiallyLoaded();
    }

    private setSearchQueryExpr(searchString: string = '') {
        this.getRequest().setSearchString(searchString);
    }

    resetParams() {
        this.getRequest().resetParams();
    }

    search(searchString: string): wemQ.Promise<ContentSummary[]> {
        this.setSearchQueryExpr(searchString);

        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.setSearchQueryExpr(value);
    }

}
