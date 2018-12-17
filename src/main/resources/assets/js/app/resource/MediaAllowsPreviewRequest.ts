import ContentId = api.content.ContentId;
import Path = api.rest.Path;
import JsonResponse = api.rest.JsonResponse;
import {JsonResourceRequest} from './JsonResourceRequest';

export class MediaAllowsPreviewRequest
    extends JsonResourceRequest<boolean, boolean> {

    private contentId: ContentId;

    private identifier: string;

    constructor(contentId: ContentId, identifier?: string) {
        super();
        super.setMethod('GET');
        this.contentId = contentId;
        this.identifier = identifier;
    }

    getParams(): Object {
        return {
            contentId: this.contentId ? this.contentId.toString() : null,
            identifier: this.identifier
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getRestPath(), 'content', 'media', 'isAllowPreview');
    }

    sendAndParse(): wemQ.Promise<boolean> {
        return this.send().then((response: JsonResponse<boolean>) => {
            return response.getResult();
        });
    }
}
