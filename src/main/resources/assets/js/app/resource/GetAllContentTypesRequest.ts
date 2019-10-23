import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';

export class GetAllContentTypesRequest
    extends ContentTypeResourceRequest<ContentTypeSummaryListJson, ContentTypeSummary[]> {

    constructor() {
        super();
        super.setMethod('GET');
    }

    getParams(): Object {
        return {};
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'all');
    }

    sendAndParse(): Q.Promise<ContentTypeSummary[]> {

        return this.send().then((response: JsonResponse<ContentTypeSummaryListJson>) => {
            return response.getResult().contentTypes.map((contentTypeJson: ContentTypeSummaryJson) => {
                return this.fromJsonToContentTypeSummary(contentTypeJson);
            });
        });
    }
}
