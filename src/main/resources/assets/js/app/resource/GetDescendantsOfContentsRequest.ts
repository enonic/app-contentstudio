import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {CompareStatus} from '../content/CompareStatus';
import {ContentIdBaseItemJson} from './json/ResolvePublishContentResultJson';

export class GetDescendantsOfContentsRequest
    extends ContentResourceRequest<ContentIdBaseItemJson[], ContentId[]> {

    private contentPaths: ContentPath[] = [];

    private filterStatuses: CompareStatus[] = [];

    public static LOAD_SIZE: number = 20;

    constructor(contentPath?: ContentPath) {
        super();
        super.setMethod('POST');
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
        this.filterStatuses = filterStatuses;
        return this;
    }

    addContentPath(contentPath: ContentPath): GetDescendantsOfContentsRequest {
        this.contentPaths.push(contentPath);
        return this;
    }

    getParams(): Object {
        let fn = (contentPath: ContentPath) => {
            return contentPath.toString();
        };
        return {
            contentPaths: this.contentPaths.map(fn),
            filterStatuses: this.filterStatuses
        };
    }

    protected processResponse(response: JsonResponse<ContentIdBaseItemJson[]>): ContentId[] {
        return response.getResult().map((item => new ContentId(item.id)));
    }
}
