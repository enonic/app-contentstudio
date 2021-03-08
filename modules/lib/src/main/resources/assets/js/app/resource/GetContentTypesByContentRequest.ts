import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';

export class GetContentTypesByContentRequest
    extends ContentTypeResourceRequest<ContentTypeSummary[]> {

    private contentId: ContentId;

    constructor(content: ContentId) {
        super();
        this.contentId = content;
        this.addRequestPathElements('byContent');
    }

    getParams(): Object {
        return {
            contentId: this.contentId && this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((contentTypeJson: ContentTypeSummaryJson) => {
            return this.fromJsonToContentTypeSummary(contentTypeJson);
        });
    }
}
