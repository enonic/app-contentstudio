import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentIdBaseItemJson} from './json/ResolvePublishContentResultJson';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

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
