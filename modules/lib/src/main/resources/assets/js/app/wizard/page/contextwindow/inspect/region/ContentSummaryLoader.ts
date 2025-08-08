import * as Q from 'q';
import {PostLoader} from '@enonic/lib-admin-ui/util/loader/PostLoader';
import {ContentSummaryRequest} from '../../../../../resource/ContentSummaryRequest';
import {GetContentSummaryByIds} from '../../../../../resource/GetContentSummaryByIds';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummary} from '../../../../../content/ContentSummary';
import {ContentId} from '../../../../../content/ContentId';
import {ContentPath} from '../../../../../content/ContentPath';

export class ContentSummaryLoader
    extends PostLoader<ContentSummary> {

    declare protected request: ContentSummaryRequest;

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
