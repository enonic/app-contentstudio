import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {CompareStatus} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ContentIdBaseItemJson} from './json/ContentIdBaseItemJson';

export class GetDescendantsOfContentsRequest
    extends CmsContentResourceRequest<ContentId[]> {

    private contentPaths: ContentPath[] = [];

    private filterStatuses?: CompareStatus[] = [];

    public static LOAD_SIZE: number = 36;

    constructor(contentPath?: ContentPath) {
        super();
        this.setMethod(HttpMethod.POST);
        if (contentPath) {
            this.addContentPath(contentPath);
        }
        this.addRequestPathElements('getDescendantsOfContents');
    }

    setContentPaths(contentPaths: ContentPath[]): GetDescendantsOfContentsRequest {
        this.contentPaths = contentPaths;
        return this;
    }

    setFilterStatuses(filterStatuses: CompareStatus[]): GetDescendantsOfContentsRequest {
        this.filterStatuses = filterStatuses || [];
        return this;
    }

    addContentPath(contentPath: ContentPath): GetDescendantsOfContentsRequest {
        this.contentPaths.push(contentPath);
        return this;
    }

    getParams(): object {
        return {
            contentPaths: this.convertPaths(),
            filterStatuses: this.convertStatuses()
        };
    }

    private convertPaths(): string[] {
        return this.contentPaths.map((path: ContentPath) => path.toString());
    }

    private convertStatuses(): string[] {
        return this.filterStatuses.map((status: CompareStatus) => CompareStatus[status]);
    }

    protected parseResponse(response: JsonResponse<ContentIdBaseItemJson[]>): ContentId[] {
        return response.getResult().map((item => new ContentId(item.id)));
    }
}
