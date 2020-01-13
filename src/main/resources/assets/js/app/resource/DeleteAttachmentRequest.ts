import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

export class DeleteAttachmentRequest
    extends ContentResourceRequest<ContentJson, Content> {

    private contentId: ContentId;

    private attachmentNames: string[] = [];

    constructor() {
        super();
        super.setMethod('POST');
        this.addRequestPathElements('deleteAttachment');
    }

    setContentId(contentId: ContentId): DeleteAttachmentRequest {
        this.contentId = contentId;
        return this;
    }

    addAttachmentName(value: string): DeleteAttachmentRequest {
        this.attachmentNames.push(value);
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString(),
            attachmentNames: this.attachmentNames
        };
    }

    protected processResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
