import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class DeleteAttachmentRequest
    extends CmsContentResourceRequest<Content> {

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

    getParams(): object {
        return {
            contentId: this.contentId.toString(),
            attachmentNames: this.attachmentNames
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
