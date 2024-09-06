import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class MediaAllowsPreviewRequest
    extends CmsContentResourceRequest<boolean> {

    private readonly contentId: ContentId;

    private readonly identifier: string;

    constructor(contentId: ContentId, identifier?: string) {
        super();
        this.contentId = contentId;
        this.identifier = identifier;
        this.addRequestPathElements('media', 'isAllowPreview');
    }

    getParams(): object {
        return {
            contentId: this.contentId ? this.contentId.toString() : null,
            identifier: this.identifier
        };
    }

    protected parseResponse(response: JsonResponse<boolean>): boolean {
        return response.getResult();
    }
}
