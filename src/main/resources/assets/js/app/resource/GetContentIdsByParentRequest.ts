import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentIdBaseItemJson} from './json/ResolvePublishContentResultJson';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';

export class GetContentIdsByParentRequest
    extends ContentResourceRequest<any> {

    private parentId: ContentId;

    private order: ChildOrder;

    constructor() {
        super();
        this.addRequestPathElements('listIds');
    }

    setOrder(value: ChildOrder): GetContentIdsByParentRequest {
        this.order = value;
        return this;
    }

    setParentId(value: ContentId): GetContentIdsByParentRequest {
        this.parentId = value;
        return this;
    }

    getParams(): Object {
        return {
            parentId: this.parentId ? this.parentId.toString() : null,
            childOrder: this.order ? this.order.toString() : ''
        };
    }

    protected parseResponse(response: JsonResponse<ContentIdBaseItemJson[]>): ContentId[] {
        return response.getResult().map((item => new ContentId(item.id)));
    }
}
