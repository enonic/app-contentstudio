import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {CompareStatus} from '../content/CompareStatus';
import {ContentIdBaseItemJson} from './json/ResolvePublishContentResultJson';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetDescendantsOfContentsRequest
    extends ContentResourceRequest<ContentId[]> {

    private contentPaths: ContentPath[] = [];

    private filterStatuses?: CompareStatus[] = [];

    public static LOAD_SIZE: number = 20;

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

    getParams(): Object {
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
