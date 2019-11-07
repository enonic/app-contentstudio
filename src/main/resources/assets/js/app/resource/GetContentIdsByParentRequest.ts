import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentIdBaseItemJson} from './json/ResolvePublishContentResultJson';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';

export class GetContentIdsByParentRequest
    extends ContentResourceRequest<any, any> {

    private parentId: ContentId;

    private order: ChildOrder;

    constructor() {
        super();
        super.setMethod('GET');
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'listIds');
    }

    sendAndParse(): Q.Promise<ContentId[]> {

        return this.send().then((response: JsonResponse<ContentIdBaseItemJson[]>) => {
            return response.getResult().map((item => new ContentId(item.id)));
        });
    }
}
