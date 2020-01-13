import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {AttachmentJson} from '../attachment/AttachmentJson';
import {Attachments} from '../attachment/Attachments';

export class GetContentAttachmentsRequest
    extends ContentResourceRequest<any, any> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        super.setMethod('GET');
        this.contentId = contentId;
        this.addRequestPathElements('getAttachments');
    }

    getParams(): Object {
        return {
            id: this.contentId.toString()
        };
    }

    protected processResponse(response: JsonResponse<AttachmentJson[]>): Attachments {
        return response.getResult().length > 0 ? Attachments.create().fromJson(response.getResult()).build() : null;
    }

}
