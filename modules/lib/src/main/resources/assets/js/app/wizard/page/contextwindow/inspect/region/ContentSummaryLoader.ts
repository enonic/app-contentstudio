import * as Q from 'q';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {PostLoader} from 'lib-admin-ui/util/loader/PostLoader';
import {ContentSummaryRequest} from '../../../../../resource/ContentSummaryRequest';
import {GetContentSummaryByIds} from '../../../../../resource/GetContentSummaryByIds';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummary} from '../../../../../content/ContentSummary';

export class ContentSummaryLoader
    extends PostLoader<ContentSummary> {

    protected request: ContentSummaryRequest;

    constructor() {
        super();

        this.setSearchQueryExpr();
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<ContentSummary[]> {
        let contentIds = ids.split(';').map((id) => {
            return new ContentId(id);
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

    setAllowedContentTypeNames(contentTypeNames: ContentTypeName[]) {
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

    search(searchString: string): Q.Promise<ContentSummary[]> {
        this.setSearchQueryExpr(searchString);

        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.setSearchQueryExpr(value);
    }

}
