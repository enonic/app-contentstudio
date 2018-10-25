import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import ContentTypeSummary = api.schema.content.ContentTypeSummary;
import ContentTypeSummaryListJson = api.schema.content.ContentTypeSummaryListJson;
import ContentTypeSummaryJson = api.schema.content.ContentTypeSummaryJson;

export class GetAllContentTypesRequest
    extends ContentTypeResourceRequest<ContentTypeSummaryListJson, ContentTypeSummary[]> {

    constructor() {
        super();
        super.setMethod('GET');
    }

    getParams(): Object {
        return {};
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'all');
    }

    sendAndParse(): wemQ.Promise<ContentTypeSummary[]> {

        return this.send().then((response: api.rest.JsonResponse<ContentTypeSummaryListJson>) => {
            return response.getResult().contentTypes.map((contentTypeJson: ContentTypeSummaryJson) => {
                return this.fromJsonToContentTypeSummary(contentTypeJson);
            });
        });
    }
}
