import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentIdBaseItemJson} from './json/ResolvePublishContentResultJson';

export class ResolveUnpublishRequest
    extends ContentResourceRequest<ContentId[]> {

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
