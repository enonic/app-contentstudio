import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentId} from '../content/ContentId';
import {ChildOrder} from './order/ChildOrder';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ContentIdBaseItemJson} from './json/ContentIdBaseItemJson';

export class GetContentIdsByParentRequest
    extends CmsContentResourceRequest<ContentId[]> {

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

    getParams(): object {
        return {
            parentId: this.parentId ? this.parentId.toString() : null,
            childOrder: this.order ? this.order.toString() : ''
        };
    }

    protected parseResponse(response: JsonResponse<ContentIdBaseItemJson[]>): ContentId[] {
        return response.getResult().map((item => new ContentId(item.id)));
    }
}
