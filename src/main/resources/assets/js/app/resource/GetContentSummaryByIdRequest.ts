import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetContentSummaryByIdRequest
    extends ContentResourceRequest<ContentSummaryJson, ContentSummary> {

    private id: ContentId;

    private expand: string;

    constructor(id: ContentId) {
        super();
        super.setMethod('GET');
        this.id = id;
        this.expand = ContentResourceRequest.EXPAND_SUMMARY;
    }

    getParams(): Object {
        return {
            id: this.id.toString(),
            expand: this.expand
        };
    }

    getRequestPath(): Path {
        return super.getResourcePath();
    }

    sendAndParse(): Q.Promise<ContentSummary> {

        return this.send().then((response: JsonResponse<ContentSummaryJson>) => {
            return this.fromJsonToContentSummary(response.getResult());
        });
    }
}
