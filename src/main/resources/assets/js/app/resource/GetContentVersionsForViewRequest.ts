import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetContentVersionsForViewResultsJson} from './json/GetContentVersionsForViewResultsJson';
import {ContentVersions} from '../ContentVersions';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetContentVersionsForViewRequest
    extends ContentResourceRequest<GetContentVersionsForViewResultsJson, ContentVersions> {

    private contentId: ContentId;
    private from: number;
    private size: number;

    constructor(contentId: ContentId) {
        super();
        super.setMethod('POST');
        this.contentId = contentId;
    }

    setFrom(from: number): GetContentVersionsForViewRequest {
        this.from = from;
        return this;
    }

    setSize(size: number): GetContentVersionsForViewRequest {
        this.size = size;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString(),
            from: this.from,
            size: this.size
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getVersionsForView');
    }

    sendAndParse(): Q.Promise<ContentVersions> {

        return this.send().then((response: JsonResponse<GetContentVersionsForViewResultsJson>) => {
            return ContentVersions.fromJson(response.getResult());
        });
    }
}
