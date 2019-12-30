import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getDescendantsOfContents');
    }

    sendAndParse(): Q.Promise<ContentId[]> {

        return this.send().then((response: JsonResponse<ContentIdBaseItemJson[]>) => {
            return response.getResult().map((item => new ContentId(item.id)));
        });
    }
}
