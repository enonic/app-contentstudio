import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {AttachmentJson} from '../attachment/AttachmentJson';
import {Attachments} from '../attachment/Attachments';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetContentAttachmentsRequest
    extends CmsContentResourceRequest<any> {

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
