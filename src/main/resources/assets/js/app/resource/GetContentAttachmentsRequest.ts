import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {AttachmentJson} from '../attachment/AttachmentJson';
import {Attachments} from '../attachment/Attachments';

export class GetContentAttachmentsRequest
    extends ContentResourceRequest<any> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('getAttachments');
    }

    getParams(): Object {
        return {
            id: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<AttachmentJson[]>): Attachments {
        return response.getResult().length > 0 ? Attachments.create().fromJson(response.getResult()).build() : null;
    }

}
