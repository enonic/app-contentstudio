import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ContentIdBaseItemJson} from './json/ContentIdBaseItemJson';

export class ResolveUnpublishRequest
    extends CmsContentResourceRequest<ContentId[]> {

    private ids: ContentId[];

    constructor(contentIds: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = contentIds;
        this.addRequestPathElements('resolveForUnpublish');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected parseResponse(response: JsonResponse<ContentIdBaseItemJson[]>): ContentId[] {
        return response.getResult().map((item => new ContentId(item.id)));
    }
}
