import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';

export class GetContentTypesByContentRequest
    extends ContentTypeResourceRequest<ContentTypeSummaryListJson, ContentTypeSummary[]> {

    private contentId: ContentId;

    constructor(content: ContentId) {
        super();
        super.setMethod('GET');
        this.contentId = content;
    }

    getParams(): Object {
        return {
            contentId: this.contentId && this.contentId.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'byContent');
    }

    sendAndParse(): Q.Promise<ContentTypeSummary[]> {

        return this.send().then((response: JsonResponse<ContentTypeSummaryListJson>) => {
            return response.getResult().contentTypes.map((contentTypeJson: ContentTypeSummaryJson) => {
                return this.fromJsonToContentTypeSummary(contentTypeJson);
            });
        });
    }
}
