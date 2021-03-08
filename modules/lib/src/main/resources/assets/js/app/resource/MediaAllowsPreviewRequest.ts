import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';

export class MediaAllowsPreviewRequest
    extends ContentResourceRequest<boolean> {

    private contentId: ContentId;

    private identifier: string;

    constructor(contentId: ContentId, identifier?: string) {
        super();
        this.contentId = contentId;
        this.identifier = identifier;
        this.addRequestPathElements('media', 'isAllowPreview');
    }

    getParams(): Object {
        return {
            contentId: this.contentId ? this.contentId.toString() : null,
            identifier: this.identifier
        };
    }

    protected parseResponse(response: JsonResponse<boolean>): boolean {
        return response.getResult();
    }
}
