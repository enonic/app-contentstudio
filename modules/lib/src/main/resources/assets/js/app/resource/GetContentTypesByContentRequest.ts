import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentId} from '../content/ContentId';
import {ContentTypeSummaryListJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ContentTypeContextResourceRequest} from './ContentTypeContextResourceRequest';

export class GetContentTypesByContentRequest
    extends ContentTypeContextResourceRequest<ContentTypeSummary[]> {

    private contentId: ContentId;

    constructor(content: ContentId) {
        super();
        this.contentId = content;
        this.addRequestPathElements('byContent');
    }

    getParams(): object {
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
