import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentId} from '../content/ContentId';

export class MediaAllowsPreviewRequest
    extends ContentResourceRequest<boolean> {

    private readonly contentId: ContentId;

    private readonly identifier: string;

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
