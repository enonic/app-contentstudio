import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class DeleteAttachmentRequest
    extends ContentResourceRequest<Content> {

    private contentId: ContentId;

    private attachmentNames: string[] = [];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
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

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
